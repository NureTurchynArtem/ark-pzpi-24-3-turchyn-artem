import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsTimeZone,
  MaxLength,
} from 'class-validator';
import { Locale } from '../../database/entities';

/**
 * Повний набір редагованих полів користувача (PUT); email і пароль тут не
 * змінюються
 */
export class UpdateUserDto {
  @ApiProperty({ example: 'Петро Іваненко' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  roleId: number;

  @ApiProperty({ enum: Locale, enumName: 'Locale', example: Locale.EN })
  @IsEnum(Locale)
  locale: Locale;

  @ApiProperty({ example: 'Europe/London' })
  @IsTimeZone()
  timeZone: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
