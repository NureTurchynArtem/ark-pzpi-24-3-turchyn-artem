import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { RiskLevel } from '../../database/entities';

/**
 * Редаговані поля дії (PUT). Код і параметри дії після створення не змінюються,
 * щоб раніше створені команди залишалися коректними.
 */
export class UpdateActionDto {
  @ApiProperty({ example: 'Списати пошкоджений товар' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  nameUk: string;

  @ApiProperty({ example: 'Write off damaged item' })
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

  @ApiProperty({ example: false })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({ example: [3], type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds: number[];
}
