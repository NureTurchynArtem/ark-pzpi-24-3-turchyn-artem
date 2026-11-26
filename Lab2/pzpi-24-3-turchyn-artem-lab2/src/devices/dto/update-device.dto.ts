import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Редаговані поля апаратного помічника (PUT); відсутнє необов'язкове поле
 * означає null
 */
export class UpdateDeviceDto {
  @ApiProperty({ example: 'Помічник складу №1 (зміна Б)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  ownerId?: number | null;

  @ApiPropertyOptional({ example: '1.1.0', nullable: true })
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+$/)
  firmwareVersion?: string | null;
}
