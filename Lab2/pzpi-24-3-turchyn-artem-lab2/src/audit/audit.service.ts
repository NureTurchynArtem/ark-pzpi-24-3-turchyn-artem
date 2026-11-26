import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import {
  dateRange,
  Page,
  toPage,
  toSkipTake,
} from '../common/utils/query.util';
import { AuditLog } from '../database/entities';
import { AuditQueryDto } from './dto/audit-query.dto';

/** Дані нового запису журналу аудиту */
export interface AuditEntry {
  userId: number | null;
  operation: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
}

/**
 * Журнал аудиту адміністративних змін: записи лише додаються, але не змінюються
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  /**
   * Додає запис до журналу в межах транзакції, яку передав викликаючий сервіс
   */
  async log(manager: EntityManager, entry: AuditEntry): Promise<void> {
    await manager.insert(AuditLog, entry);
  }

  /** Повертає сторінку журналу від новіших записів до старіших */
  async findAll(query: AuditQueryDto): Promise<Page<AuditLog>> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (query.userId !== undefined) {
      where.userId = query.userId;
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.operation) {
      where.operation = query.operation;
    }
    if (query.from || query.to) {
      where.createdAt = dateRange(query.from, query.to);
    }
    const result = await this.auditLogs.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });
    return toPage(result, query);
  }
}
