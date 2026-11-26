import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DeviceEventType } from '../../database/entities';

/** Фільтри журналу подій пристрою */
export class EventsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DeviceEventType, enumName: 'DeviceEventType' })
  @IsOptional()
  @IsEnum(DeviceEventType)
  type?: DeviceEventType;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
