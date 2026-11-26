import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { Page, toPage, toSkipTake } from '../common/utils/query.util';
import { Action, ActionParameter, Locale, Role } from '../database/entities';
import { ActionParameterDto } from './dto/action-parameter.dto';
import { ActionsQueryDto } from './dto/actions-query.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

/**
 * Каталог дозволених дій: CRUD-операції з діями, їхніми параметрами та ролями
 */
@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(Action) private readonly actions: Repository<Action>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /** Повертає сторінку каталогу; список сортується за назвою обраною мовою */
  async findAll(query: ActionsQueryDto): Promise<Page<Action>> {
    const builder = this.actions
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.parameters', 'parameter')
      .leftJoinAndSelect('action.roles', 'role');
    if (query.riskLevel) {
      builder.andWhere('action.riskLevel = :riskLevel', {
        riskLevel: query.riskLevel,
      });
    }
    if (query.isEnabled !== undefined) {
      builder.andWhere('action.isEnabled = :isEnabled', {
        isEnabled: query.isEnabled,
      });
    }
    if (query.roleId !== undefined) {
      // Підзапит, щоб фільтр за роллю не обрізав список ролей у відповіді
      builder.andWhere(
        'action.id IN (SELECT ar.action_id FROM action_roles ar ' +
          'WHERE ar.role_id = :roleId)',
        { roleId: query.roleId },
      );
    }
    if (query.search) {
      builder.andWhere(
        '(action.code ILIKE :search OR action.nameUk ILIKE :search ' +
          'OR action.nameEn ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    // Сортування за назвою обраною мовою з урахуванням правил алфавіту (ICU-
    // колація стовпця)
    const sortColumn =
      query.lang === Locale.EN ? 'action.nameEn' : 'action.nameUk';
    const { skip, take } = toSkipTake(query);
    const [items, total] = await builder
      .orderBy(sortColumn, 'ASC')
      .addOrderBy('action.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    // Параметри впорядковуються в пам'яті: сортування за приєднаною таблицею
    // порушило б пагінацію
    items.forEach((action) =>
      action.parameters.sort((first, second) => first.id - second.id),
    );
    return toPage([items, total], query);
  }

  /** Повертає дію з параметрами та ролями або помилку 404 */
  async findOne(id: number): Promise<Action> {
    const action = await this.actions.findOne({
      where: { id },
      relations: { parameters: true, roles: true },
      order: { parameters: { id: 'ASC' } },
    });
    if (!action) {
      throw new NotFoundException(`Action ${id} not found`);
    }
    return action;
  }

  /** Створює дію, її параметри та зв'язки з ролями в одній транзакції */
  async create(dto: CreateActionDto, actor: AuthUser): Promise<Action> {
    this.assertParametersValid(dto.parameters);
    const roles = await this.findRoles(dto.roleIds);
    const actionId = await this.dataSource.transaction(async (manager) => {
      const action = await manager.save(Action, {
        code: dto.code,
        nameUk: dto.nameUk,
        nameEn: dto.nameEn,
        riskLevel: dto.riskLevel,
        isEnabled: dto.isEnabled ?? true,
        roles,
      });
      if (dto.parameters.length > 0) {
        await manager.insert(
          ActionParameter,
          dto.parameters.map((parameter) => ({
            ...parameter,
            actionId: action.id,
          })),
        );
      }
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'ACTION_CREATED',
        entityType: 'Action',
        entityId: action.id,
        details: action.code,
      });
      return action.id;
    });
    return this.findOne(actionId);
  }

  /** Оновлює назви, рівень ризику, доступність і набір ролей дії (PUT) */
  async update(
    id: number,
    dto: UpdateActionDto,
    actor: AuthUser,
  ): Promise<Action> {
    await this.findOne(id);
    const roles = await this.findRoles(dto.roleIds);
    await this.dataSource.transaction(async (manager) => {
      // save() з масивом roles синхронізує таблицю зв'язку action_roles
      await manager.save(Action, {
        id,
        nameUk: dto.nameUk,
        nameEn: dto.nameEn,
        riskLevel: dto.riskLevel,
        isEnabled: dto.isEnabled,
        roles,
      });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'ACTION_UPDATED',
        entityType: 'Action',
        entityId: id,
      });
    });
    return this.findOne(id);
  }

  /**
   * Видаляє дію разом із параметрами; дію, яку вже використано в командах,
   * видалити не можна
   */
  async remove(id: number, actor: AuthUser): Promise<void> {
    const action = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Action, { id });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'ACTION_DELETED',
        entityType: 'Action',
        entityId: id,
        details: action.code,
      });
    });
  }

  /** Завантажує ролі за ідентифікаторами та перевіряє, що всі вони існують */
  private async findRoles(roleIds: number[]): Promise<Role[]> {
    const uniqueIds = [...new Set(roleIds)];
    const roles = await this.roles.findBy({ id: In(uniqueIds) });
    if (roles.length !== uniqueIds.length) {
      throw new BadRequestException('Some of the specified roles do not exist');
    }
    return roles;
  }

  /**
   * Перевіряє унікальність кодів параметрів і коректність діапазонів [min; max]
   */
  private assertParametersValid(parameters: ActionParameterDto[]): void {
    const codes = parameters.map((parameter) => parameter.code);
    if (new Set(codes).size !== codes.length) {
      throw new BadRequestException(
        'Parameter codes must be unique within an action',
      );
    }
    const invalidRange = parameters.find(
      (parameter) =>
        parameter.minValue !== undefined &&
        parameter.maxValue !== undefined &&
        parameter.minValue > parameter.maxValue,
    );
    if (invalidRange) {
      throw new BadRequestException(
        `Parameter ${invalidRange.code}: minValue is greater than maxValue`,
      );
    }
  }
}
