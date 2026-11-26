import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.types';
import { Page } from '../common/utils/query.util';
import { Device, RoleCode } from '../database/entities';
import { DevicesService, DeviceWithKey } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DevicesQueryDto } from './dto/devices-query.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Апаратні помічники')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Список апаратних помічників (фільтри, пагінація)' })
  findAll(@Query() query: DevicesQueryDto): Promise<Page<Device>> {
    return this.devicesService.findAll(query);
  }

  @Get(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Пристрій за ідентифікатором' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Device> {
    return this.devicesService.findOne(id);
  }

  @Post()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Зареєструвати пристрій (відповідь містить ключ пристрою)',
  })
  create(
    @Body() dto: CreateDeviceDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<DeviceWithKey> {
    return this.devicesService.create(dto, actor);
  }

  @Put(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Оновити пристрій (назва, власник, прошивка)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeviceDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<Device> {
    return this.devicesService.update(id, dto, actor);
  }

  @Patch(':id/revoke')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Відкликати ключ пристрою' })
  revoke(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser,
  ): Promise<Device> {
    return this.devicesService.revoke(id, actor);
  }

  @Delete(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити пристрій (без історії подій і сесій)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.devicesService.remove(id, actor);
  }
}
