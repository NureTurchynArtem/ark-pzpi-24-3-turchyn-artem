import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsTimeZone,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Locale } from '../../database/entities';

/** Дані для створення користувача */
export class CreateUserDto {
  @ApiProperty({ example: 'new.operator@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Operator123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 'Петро Іваненко' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  fullName: string;

  @ApiProperty({
    example: 1,
    description: 'Ідентифікатор ролі (див. GET /api/roles)',
  })
  @IsInt()
  @IsPositive()
  roleId: number;

  @ApiPropertyOptional({ enum: Locale, enumName: 'Locale', default: Locale.UK })
  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;

  @ApiPropertyOptional({ example: 'Europe/Kyiv', default: 'Europe/Kyiv' })
  @IsOptional()
  @IsTimeZone()
  timeZone?: string;
}
