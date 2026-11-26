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

/** Дані для реєстрації апаратного помічника */
export class CreateDeviceDto {
  @ApiProperty({
    example: 'HB-0003',
    description: 'Серійний номер: великі латинські літери, цифри, дефіс',
  })
  @Matches(/^[A-Z0-9-]{3,32}$/)
  serialNumber: string;

  @ApiProperty({ example: 'Помічник складу №2' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Користувач, за яким закріплено пристрій',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  ownerId?: number;

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+$/)
  firmwareVersion?: string;
}
