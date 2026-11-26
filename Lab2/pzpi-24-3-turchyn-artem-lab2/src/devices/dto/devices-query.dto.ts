import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DeviceStatus } from '../../database/entities';

/** Фільтри списку апаратних помічників */
export class DevicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ownerId?: number;

  @ApiPropertyOptional({ enum: DeviceStatus, enumName: 'DeviceStatus' })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({
    example: 'HB-',
    description: 'Пошук за серійним номером або назвою',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
