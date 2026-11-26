import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import {
  dateRange,
  Page,
  toPage,
  toSkipTake,
} from '../common/utils/query.util';
import { Device, DeviceEvent } from '../database/entities';
import { DeviceEventDto } from './dto/device-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';

/** Результат приймання подій від пристрою */
export interface IngestResult {
  received: number;
  accepted: number;
  duplicates: number;
}

/** Приймання подій від апаратних помічників і перегляд журналу подій */
@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(DeviceEvent)
    private readonly events: Repository<DeviceEvent>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Зберігає пакет подій пристрою. Події впорядковуються за лічильником seq,
   * а повторно надіслані (з тим самим eventUid) пропускаються завдяки ON
   * CONFLICT DO NOTHING.
   */
  async ingest(
    device: Device,
    events: DeviceEventDto[],
  ): Promise<IngestResult> {
    const rows = [...events]
      .sort((first, second) => first.seq - second.seq)
      .map((event) => ({
        deviceId: device.id,
        eventUid: event.eventUid,
        seq: event.seq,
        type: event.type,
        value: event.value ?? null,
        commandId: event.commandId ?? null,
        occurredAt: new Date(event.occurredAt),
      }));
    return this.dataSource.transaction(async (manager) => {
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(DeviceEvent)
        .values(rows)
        .orIgnore()
        .returning(['id'])
        .execute();
      await manager.update(
        Device,
        { id: device.id },
        { lastSeenAt: new Date() },
      );
      const accepted = (insertResult.raw as unknown[]).length;
      return {
        received: events.length,
        accepted,
        duplicates: events.length - accepted,
      };
    });
  }

  /** Повертає сторінку подій пристрою від останніх до перших */
  async findByDevice(
    deviceId: number,
    query: EventsQueryDto,
  ): Promise<Page<DeviceEvent>> {
    if (!(await this.devices.existsBy({ id: deviceId }))) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    const where: FindOptionsWhere<DeviceEvent> = { deviceId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.from || query.to) {
      where.occurredAt = dateRange(query.from, query.to);
    }
    const result = await this.events.findAndCount({
      where,
      order: { seq: 'DESC' },
      ...toSkipTake(query),
    });
    return toPage(result, query);
  }
}
