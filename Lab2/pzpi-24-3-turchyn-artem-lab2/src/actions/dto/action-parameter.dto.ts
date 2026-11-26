import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ParameterType } from '../../database/entities';

/** Опис параметра дії під час її створення */
export class ActionParameterDto {
  @ApiProperty({
    example: 'quantity',
    description: 'Код параметра (латиниця, camelCase)',
  })
  @Matches(/^[a-z][a-zA-Z0-9_]{0,31}$/)
  code: string;

  @ApiProperty({ example: 'Кількість' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nameUk: string;

  @ApiProperty({ example: 'Quantity' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  nameEn: string;

  @ApiProperty({
    enum: ParameterType,
    enumName: 'ParameterType',
    example: ParameterType.INTEGER,
  })
  @IsEnum(ParameterType)
  type: ParameterType;

  @ApiPropertyOptional({ example: 'pcs', description: 'Одиниця вимірювання' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  unit?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
