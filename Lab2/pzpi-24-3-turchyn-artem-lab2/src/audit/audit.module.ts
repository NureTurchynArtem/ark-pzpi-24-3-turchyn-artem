import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

/** Модуль журналу аудиту; AuditService використовують інші модулі */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
