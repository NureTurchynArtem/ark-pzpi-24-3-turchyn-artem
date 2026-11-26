import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { Page, toPage, toSkipTake } from '../common/utils/query.util';
import { Role, User } from '../database/entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';

/** Кількість раундів хешування bcrypt */
const PASSWORD_SALT_ROUNDS = 10;

/** CRUD-операції з користувачами та довідником ролей */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Повертає сторінку користувачів з фільтрами за роллю, активністю та
   * пошуковим рядком
   */
  async findAll(query: UsersQueryDto): Promise<Page<User>> {
    const filter: FindOptionsWhere<User> = {};
    if (query.roleId !== undefined) {
      filter.roleId = query.roleId;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    // Масив умов означає OR: збіг за email або за ПІБ
    const where = query.search
      ? [
          { ...filter, email: ILike(`%${query.search}%`) },
          { ...filter, fullName: ILike(`%${query.search}%`) },
        ]
      : filter;
    const result = await this.users.findAndCount({
      where,
      relations: { role: true },
      order: { id: 'ASC' },
      ...toSkipTake(query),
    });
    return toPage(result, query);
  }

  /** Повертає користувача за ідентифікатором або помилку 404 */
  async findOne(id: number): Promise<User> {
    const user = await this.users.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  /** Створює користувача; пароль зберігається лише у вигляді хешу bcrypt */
  async create(dto: CreateUserDto, actor: AuthUser): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    const userId = await this.dataSource.transaction(async (manager) => {
      const user = await manager.save(User, {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        roleId: dto.roleId,
        locale: dto.locale,
        timeZone: dto.timeZone,
      });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        details: user.email,
      });
      return user.id;
    });
    return this.findOne(userId);
  }

  /** Повністю оновлює редаговані поля користувача (PUT) */
  async update(id: number, dto: UpdateUserDto, actor: AuthUser): Promise<User> {
    await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { id },
        {
          fullName: dto.fullName,
          roleId: dto.roleId,
          locale: dto.locale,
          timeZone: dto.timeZone,
          isActive: dto.isActive,
        },
      );
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'USER_UPDATED',
        entityType: 'User',
        entityId: id,
      });
    });
    return this.findOne(id);
  }

  /**
   * Видаляє користувача; користувача з історією сесій видалити не можна (ON
   * DELETE RESTRICT)
   */
  async remove(id: number, actor: AuthUser): Promise<void> {
    if (id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(User, { id });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        details: user.email,
      });
    });
  }

  /** Повертає довідник ролей */
  findAllRoles(): Promise<Role[]> {
    return this.roles.find({ order: { id: 'ASC' } });
  }
}
