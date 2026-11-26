import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device, DeviceEvent } from '../database/entities';
import {
  DeviceEventsAdminController,
  DeviceEventsController,
} from './events.controller';
import { EventsService } from './events.service';

/** Модуль подій апаратних помічників */
@Module({
  imports: [TypeOrmModule.forFeature([DeviceEvent, Device])],
  controllers: [DeviceEventsController, DeviceEventsAdminController],
  providers: [EventsService],
})
export class EventsModule {}
