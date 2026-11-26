import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { RiskLevel } from '../../database/entities';
import { ActionParameterDto } from './action-parameter.dto';

/** Дані для створення дозволеної дії разом із параметрами та ролями */
export class CreateActionDto {
  @ApiProperty({
    example: 'stock.write_off',
    description: 'Унікальний код дії (латиниця, крапка — роздільник)',
  })
  @Matches(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/)
  @MaxLength(64)
  code: string;

  @ApiProperty({ example: 'Списати товар' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nameUk: string;

  @ApiProperty({ example: 'Write off item' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nameEn: string;

  @ApiProperty({
    enum: RiskLevel,
    enumName: 'RiskLevel',
    example: RiskLevel.HIGH,
  })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({
    example: [1, 3],
    type: [Number],
    description: 'Ролі, яким дозволено виконувати дію',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds: number[];

  @ApiProperty({ type: [ActionParameterDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ActionParameterDto)
  parameters: ActionParameterDto[];
}
