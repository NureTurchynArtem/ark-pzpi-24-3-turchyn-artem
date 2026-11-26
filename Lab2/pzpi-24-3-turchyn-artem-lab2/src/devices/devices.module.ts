import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Device } from '../database/entities';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

/** Модуль реєстру апаратних помічників */
@Module({
  imports: [TypeOrmModule.forFeature([Device]), AuditModule],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
