import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Not, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth.types';
import { Page, toPage, toSkipTake } from '../common/utils/query.util';
import { Device, DeviceStatus, RoleCode, Session } from '../database/entities';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsQueryDto } from './dto/sessions-query.dto';

/** Сесії взаємодії користувачів із системою (архів сесій) */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
  ) {}

  /** Повертає сторінку сесій; оператор бачить лише власні сесії */
  async findAll(
    query: SessionsQueryDto,
    user: AuthUser,
  ): Promise<Page<Session>> {
    const where: FindOptionsWhere<Session> = {};
    const userId = user.role === RoleCode.OPERATOR ? user.id : query.userId;
    if (userId !== undefined) {
      where.userId = userId;
    }
    if (query.deviceId !== undefined) {
      where.deviceId = query.deviceId;
    }
    if (query.active !== undefined) {
      where.endedAt = query.active ? IsNull() : Not(IsNull());
    }
    const result = await this.sessions.findAndCount({
      where,
      relations: { device: true },
      order: { startedAt: 'DESC' },
      ...toSkipTake(query),
    });
    return toPage(result, query);
  }

  /**
   * Повертає сесію з командами; доступ до чужої сесії має лише адміністратор
   */
  async findOne(id: number, user: AuthUser): Promise<Session> {
    const session = await this.sessions.findOne({
      where: { id },
      relations: { device: true, commands: { action: true } },
      order: { commands: { id: 'ASC' } },
    });
    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }
    if (user.role === RoleCode.OPERATOR && session.userId !== user.id) {
      throw new ForbiddenException('Session belongs to another user');
    }
    return session;
  }

  /**
   * Відкриває нову сесію поточного користувача (за потреби — з апаратним
   * помічником)
   */
  async start(dto: CreateSessionDto, user: AuthUser): Promise<Session> {
    if (dto.deviceId !== undefined) {
      await this.assertDeviceAvailable(dto.deviceId, user);
    }
    const session = await this.sessions.save({
      userId: user.id,
      deviceId: dto.deviceId ?? null,
    });
    return this.findOne(session.id, user);
  }

  /** Завершує сесію; завершену сесію повторно завершити не можна */
  async end(id: number, user: AuthUser): Promise<Session> {
    const session = await this.findOne(id, user);
    if (session.endedAt) {
      throw new ConflictException(`Session ${id} is already ended`);
    }
    await this.sessions.update({ id }, { endedAt: new Date() });
    return this.findOne(id, user);
  }

  /**
   * Перевіряє, що пристрій існує, активний і не закріплений за іншим
   * користувачем
   */
  private async assertDeviceAvailable(
    deviceId: number,
    user: AuthUser,
  ): Promise<void> {
    const device = await this.devices.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    if (device.status !== DeviceStatus.ACTIVE) {
      throw new ConflictException(`Device ${deviceId} is revoked`);
    }
    if (device.ownerId !== null && device.ownerId !== user.id) {
      throw new ForbiddenException(
        `Device ${deviceId} is assigned to another user`,
      );
    }
  }
}
