import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeviceEventType } from '../../database/entities';

/** Одна локальна подія апаратного помічника */
export class DeviceEventDto {
  @ApiProperty({
    example: 'HB-0001-000006',
    description: 'Унікальний ідентифікатор події на пристрої',
  })
  @IsString()
  @Length(1, 64)
  eventUid: string;

  @ApiProperty({
    example: 6,
    description: 'Порядковий номер події (лічильник пристрою)',
  })
  @IsInt()
  @Min(0)
  seq: number;

  @ApiProperty({
    enum: DeviceEventType,
    enumName: 'DeviceEventType',
    example: DeviceEventType.BUTTON_SHORT,
  })
  @IsEnum(DeviceEventType)
  type: DeviceEventType;

  @ApiPropertyOptional({
    example: 2,
    description: 'Кроки енкодера, тривалість утримання (мс) або код результату',
  })
  @IsOptional()
  @IsInt()
  value?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Команда, до якої належить подія',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  commandId?: number;

  @ApiProperty({
    example: '2026-11-22T09:15:00.000Z',
    description: 'Час події на пристрої (UTC, ISO 8601)',
  })
  @IsISO8601({ strict: true })
  occurredAt: string;
}

/** Пакет подій, накопичених пристроєм (наприклад, під час роботи без мережі) */
export class DeviceEventsBatchDto {
  @ApiProperty({ type: [DeviceEventDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => DeviceEventDto)
  events: DeviceEventDto[];
}
