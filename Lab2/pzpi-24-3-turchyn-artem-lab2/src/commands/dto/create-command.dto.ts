import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Значення одного параметра команди */
export class CommandParameterValueDto {
  @ApiProperty({ example: 'quantity' })
  @Matches(/^[a-z][a-zA-Z0-9_]{0,31}$/)
  code: string;

  @ApiProperty({ example: '12', description: 'Значення у текстовому вигляді' })
  @IsString()
  @MaxLength(255)
  value: string;
}

/** Дані для створення команди */
export class CreateCommandDto {
  @ApiProperty({
    example: 2,
    description: 'Відкрита сесія поточного користувача',
  })
  @IsInt()
  @IsPositive()
  sessionId: number;

  @ApiProperty({
    example: 2,
    description: 'Дія з каталогу (наприклад, stock.set_quantity)',
  })
  @IsInt()
  @IsPositive()
  actionId: number;

  @ApiProperty({
    example: 'demo-cmd-0001',
    description: 'Ключ ідемпотентності, унікальний для команди',
  })
  @IsString()
  @Length(8, 64)
  idempotencyKey: string;

  @ApiPropertyOptional({ example: 'зміни кількість SKU-778 на дванадцять' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  requestText?: string;

  @ApiProperty({
    type: [CommandParameterValueDto],
    example: [
      { code: 'sku', value: 'SKU-778' },
      { code: 'quantity', value: '12' },
    ],
  })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CommandParameterValueDto)
  parameters: CommandParameterValueDto[];
}
