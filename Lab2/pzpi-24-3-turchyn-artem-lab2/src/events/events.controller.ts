import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, CurrentDevice } from '../auth/auth.decorators';
import { DeviceKeyGuard } from '../auth/guards/device-key.guard';
import { Page } from '../common/utils/query.util';
import { Device, DeviceEvent, RoleCode } from '../database/entities';
import { DeviceEventDto, DeviceEventsBatchDto } from './dto/device-event.dto';
import { EventsQueryDto } from './dto/events-query.dto';
import { EventsService, IngestResult } from './events.service';

/**
 * Маршрути, які викликає сам апаратний помічник (автентифікація ключем
 * пристрою)
 */
@ApiTags('Події пристрою (IoT-клієнт)')
@ApiSecurity('device-key')
@ApiUnauthorizedResponse({
  description: 'Відсутній, невідомий або відкликаний ключ пристрою',
})
@UseGuards(DeviceKeyGuard)
@Controller('device/events')
export class DeviceEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Надіслати одну подію від пристрою' })
  ingestOne(
    @CurrentDevice() device: Device,
    @Body() dto: DeviceEventDto,
  ): Promise<IngestResult> {
    return this.eventsService.ingest(device, [dto]);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Надіслати пакет подій (до 100) з дедуплікацією' })
  ingestBatch(
    @CurrentDevice() device: Device,
    @Body() dto: DeviceEventsBatchDto,
  ): Promise<IngestResult> {
    return this.eventsService.ingest(device, dto.events);
  }
}

/** Перегляд журналу подій пристрою адміністратором */
@ApiTags('Апаратні помічники')
@Controller('devices/:deviceId/events')
export class DeviceEventsAdminController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Журнал подій пристрою (фільтри за типом і періодом)',
  })
  findByDevice(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Query() query: EventsQueryDto,
  ): Promise<Page<DeviceEvent>> {
    return this.eventsService.findByDevice(deviceId, query);
  }
}
