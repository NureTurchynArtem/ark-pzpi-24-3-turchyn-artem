import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Action, Role } from '../database/entities';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

/** Модуль каталогу дозволених дій */
@Module({
  imports: [TypeOrmModule.forFeature([Action, Role]), AuditModule],
  controllers: [ActionsController],
  providers: [ActionsService],
})
export class ActionsModule {}
