import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth.types';
import {
  dateRange,
  Page,
  toPage,
  toSkipTake,
} from '../common/utils/query.util';
import {
  Action,
  ActionParameter,
  Command,
  CommandParameter,
  CommandStatus,
  ParameterType,
  RoleCode,
  Session,
} from '../database/entities';
import { canTransition } from './command-lifecycle';
import {
  CommandParameterValueDto,
  CreateCommandDto,
} from './dto/create-command.dto';
import { CommandsQueryDto } from './dto/commands-query.dto';
import { UpdateCommandStatusDto } from './dto/update-command-status.dto';

/** Подання команди у відповідях API */
export interface CommandView {
  id: number;
  sessionId: number;
  status: CommandStatus;
  resultCode: string | null;
  requestText: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
  action: {
    id: number;
    code: string;
    nameUk: string;
    nameEn: string;
    riskLevel: string;
  };
  parameters: Array<{
    code: string;
    type: ParameterType;
    unit: string | null;
    value: string;
  }>;
}

/** Результат створення команди: команда та ознака, чи її щойно створено */
export interface CreateCommandResult {
  command: CommandView;
  created: boolean;
}

/** Зв'язки, які завантажуються разом із командою */
const COMMAND_RELATIONS = {
  action: true,
  session: true,
  parameters: { parameter: true },
} as const;

/**
 * Журнал команд: створення типізованих команд і керування їхнім життєвим циклом
 */
@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(Command) private readonly commands: Repository<Command>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(Action) private readonly actions: Repository<Action>,
    private readonly dataSource: DataSource,
  ) {}

  /** Повертає сторінку команд; оператор бачить лише команди власних сесій */
  async findAll(
    query: CommandsQueryDto,
    user: AuthUser,
  ): Promise<Page<CommandView>> {
    const where: FindOptionsWhere<Command> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.actionId !== undefined) {
      where.actionId = query.actionId;
    }
    if (query.sessionId !== undefined) {
      where.sessionId = query.sessionId;
    }
    if (query.from || query.to) {
      where.createdAt = dateRange(query.from, query.to);
    }
    if (user.role === RoleCode.OPERATOR) {
      where.session = { userId: user.id };
    }
    const [items, total] = await this.commands.findAndCount({
      where,
      relations: COMMAND_RELATIONS,
      order: { createdAt: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });
    return toPage([items.map((command) => this.toView(command)), total], query);
  }

  /** Повертає команду за ідентифікатором з перевіркою права доступу */
  async findOne(id: number, user: AuthUser): Promise<CommandView> {
    return this.toView(await this.loadAccessible(id, user));
  }

  /**
   * Створює команду. Повторний запит із тим самим ключем ідемпотентності
   * повертає вже створену команду замість дубліката.
   */
  async create(
    dto: CreateCommandDto,
    user: AuthUser,
  ): Promise<CreateCommandResult> {
    const existing = await this.commands.findOne({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return { command: await this.findOne(existing.id, user), created: false };
    }

    const session = await this.sessions.findOne({
      where: { id: dto.sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${dto.sessionId} not found`);
    }
    if (session.userId !== user.id) {
      throw new ForbiddenException('Session belongs to another user');
    }
    if (session.endedAt) {
      throw new ConflictException(`Session ${session.id} is already ended`);
    }

    const action = await this.actions.findOne({
      where: { id: dto.actionId },
      relations: { parameters: true, roles: true },
    });
    if (!action || !action.isEnabled) {
      throw new NotFoundException(`Action ${dto.actionId} is not available`);
    }
    if (!action.roles.some((role) => role.code === user.role)) {
      throw new ForbiddenException(
        `Role ${user.role} is not allowed to execute ${action.code}`,
      );
    }
    const values = this.resolveParameters(action.parameters, dto.parameters);

    // Команда та значення її параметрів зберігаються атомарно в одній
    // транзакції
    const commandId = await this.dataSource.transaction(async (manager) => {
      const command = await manager.save(Command, {
        sessionId: session.id,
        actionId: action.id,
        idempotencyKey: dto.idempotencyKey,
        requestText: dto.requestText ?? null,
      });
      if (values.length > 0) {
        await manager.insert(
          CommandParameter,
          values.map((value) => ({ ...value, commandId: command.id })),
        );
      }
      return command.id;
    });
    return { command: await this.findOne(commandId, user), created: true };
  }

  /** Змінює стан команди відповідно до дозволених переходів життєвого циклу */
  async updateStatus(
    id: number,
    dto: UpdateCommandStatusDto,
    user: AuthUser,
  ): Promise<CommandView> {
    const command = await this.loadAccessible(id, user);
    if (!canTransition(command.status, dto.status)) {
      throw new ConflictException(
        `Transition ${command.status} -> ${dto.status} is not allowed`,
      );
    }
    await this.commands.update(
      { id },
      { status: dto.status, resultCode: dto.resultCode ?? command.resultCode },
    );
    return this.findOne(id, user);
  }

  /** Завантажує команду; оператор має доступ лише до команд власних сесій */
  private async loadAccessible(id: number, user: AuthUser): Promise<Command> {
    const command = await this.commands.findOne({
      where: { id },
      relations: COMMAND_RELATIONS,
    });
    if (!command) {
      throw new NotFoundException(`Command ${id} not found`);
    }
    if (user.role === RoleCode.OPERATOR && command.session.userId !== user.id) {
      throw new ForbiddenException('Command belongs to another user');
    }
    return command;
  }

  /** Зіставляє передані значення з описом параметрів дії та перевіряє їх */
  private resolveParameters(
    definitions: ActionParameter[],
    input: CommandParameterValueDto[],
  ): Array<{ parameterId: number; value: string }> {
    const byCode = new Map(
      definitions.map((definition) => [definition.code, definition]),
    );
    const codes = input.map((item) => item.code);
    const unknown = codes.filter((code) => !byCode.has(code));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown parameters: ${unknown.join(', ')}`,
      );
    }
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException(
        'Each parameter can be specified only once',
      );
    }
    const missing = definitions
      .filter(
        (definition) =>
          definition.isRequired && !codes.includes(definition.code),
      )
      .map((definition) => definition.code);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required parameters: ${missing.join(', ')}`,
      );
    }
    return input.map((item) => {
      const definition = byCode.get(item.code) as ActionParameter;
      this.assertValueMatches(definition, item.value);
      return { parameterId: definition.id, value: item.value };
    });
  }

  /**
   * Перевіряє, що значення відповідає типу параметра та допустимому діапазону
   */
  private assertValueMatches(definition: ActionParameter, value: string): void {
    if (definition.type === ParameterType.STRING) {
      return;
    }
    if (definition.type === ParameterType.BOOLEAN) {
      if (value !== 'true' && value !== 'false') {
        throw new BadRequestException(
          `Parameter ${definition.code} must be true or false`,
        );
      }
      return;
    }
    const numeric = Number(value);
    const isNumber = value.trim() !== '' && Number.isFinite(numeric);
    if (
      !isNumber ||
      (definition.type === ParameterType.INTEGER && !Number.isInteger(numeric))
    ) {
      throw new BadRequestException(
        `Parameter ${definition.code} must be ${definition.type.toLowerCase()}`,
      );
    }
    const belowMin =
      definition.minValue !== null && numeric < definition.minValue;
    const aboveMax =
      definition.maxValue !== null && numeric > definition.maxValue;
    if (belowMin || aboveMax) {
      const min = definition.minValue ?? '-inf';
      const max = definition.maxValue ?? '+inf';
      throw new BadRequestException(
        `Parameter ${definition.code} must be in range [${min}; ${max}]`,
      );
    }
  }

  /** Перетворює сутність команди на подання для відповіді API */
  private toView(command: Command): CommandView {
    return {
      id: command.id,
      sessionId: command.sessionId,
      status: command.status,
      resultCode: command.resultCode,
      requestText: command.requestText,
      idempotencyKey: command.idempotencyKey,
      createdAt: command.createdAt,
      updatedAt: command.updatedAt,
      action: {
        id: command.action.id,
        code: command.action.code,
        nameUk: command.action.nameUk,
        nameEn: command.action.nameEn,
        riskLevel: command.action.riskLevel,
      },
      parameters: command.parameters.map((item) => ({
        code: item.parameter.code,
        type: item.parameter.type,
        unit: item.parameter.unit,
        value: item.value,
      })),
    };
  }
}
