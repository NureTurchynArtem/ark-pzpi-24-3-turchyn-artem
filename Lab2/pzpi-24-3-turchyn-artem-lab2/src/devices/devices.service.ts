import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { generateDeviceKey, sha256 } from '../common/utils/crypto.util';
import { Page, toPage, toSkipTake } from '../common/utils/query.util';
import { Device, DeviceStatus } from '../database/entities';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesQueryDto } from './dto/devices-query.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

/**
 * Зареєстрований пристрій разом із секретним ключем (повертається лише під час
 * реєстрації)
 */
export type DeviceWithKey = Device & { deviceKey: string };

/** Реєстр апаратних помічників: CRUD-операції та відкликання ключа */
@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Повертає сторінку пристроїв з фільтрами за власником, станом і пошуковим
   * рядком
   */
  async findAll(query: DevicesQueryDto): Promise<Page<Device>> {
    const filter: FindOptionsWhere<Device> = {};
    if (query.ownerId !== undefined) {
      filter.ownerId = query.ownerId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    const where = query.search
      ? [
          { ...filter, serialNumber: ILike(`%${query.search}%`) },
          { ...filter, name: ILike(`%${query.search}%`) },
        ]
      : filter;
    const result = await this.devices.findAndCount({
      where,
      relations: { owner: true },
      order: { id: 'ASC' },
      ...toSkipTake(query),
    });
    return toPage(result, query);
  }

  /** Повертає пристрій за ідентифікатором або помилку 404 */
  async findOne(id: number): Promise<Device> {
    const device = await this.devices.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }
    return device;
  }

  /**
   * Реєструє пристрій; секретний ключ генерується сервером і показується лише
   * один раз
   */
  async create(dto: CreateDeviceDto, actor: AuthUser): Promise<DeviceWithKey> {
    const deviceKey = generateDeviceKey();
    const deviceId = await this.dataSource.transaction(async (manager) => {
      const device = await manager.save(Device, {
        serialNumber: dto.serialNumber,
        name: dto.name,
        ownerId: dto.ownerId ?? null,
        firmwareVersion: dto.firmwareVersion ?? null,
        keyHash: sha256(deviceKey),
      });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'DEVICE_REGISTERED',
        entityType: 'Device',
        entityId: device.id,
        details: device.serialNumber,
      });
      return device.id;
    });
    return { ...(await this.findOne(deviceId)), deviceKey };
  }

  /** Оновлює назву, власника та версію прошивки пристрою (PUT) */
  async update(
    id: number,
    dto: UpdateDeviceDto,
    actor: AuthUser,
  ): Promise<Device> {
    await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Device,
        { id },
        {
          name: dto.name,
          ownerId: dto.ownerId ?? null,
          firmwareVersion: dto.firmwareVersion ?? null,
        },
      );
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'DEVICE_UPDATED',
        entityType: 'Device',
        entityId: id,
      });
    });
    return this.findOne(id);
  }

  /**
   * Відкликає ключ пристрою: після цього пристрій не може надсилати події на
   * сервер
   */
  async revoke(id: number, actor: AuthUser): Promise<Device> {
    const device = await this.findOne(id);
    if (device.status === DeviceStatus.REVOKED) {
      throw new ConflictException(`Device ${id} is already revoked`);
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.update(Device, { id }, { status: DeviceStatus.REVOKED });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'DEVICE_KEY_REVOKED',
        entityType: 'Device',
        entityId: id,
        details: device.serialNumber,
      });
    });
    return this.findOne(id);
  }

  /** Видаляє пристрій; пристрій з історією подій або сесій видалити не можна */
  async remove(id: number, actor: AuthUser): Promise<void> {
    const device = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Device, { id });
      await this.auditService.log(manager, {
        userId: actor.id,
        operation: 'DEVICE_DELETED',
        entityType: 'Device',
        entityId: id,
        details: device.serialNumber,
      });
    });
  }
}
