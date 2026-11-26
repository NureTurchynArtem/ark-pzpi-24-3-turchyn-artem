import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Фільтри журналу аудиту */
export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Хто виконав операцію' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({
    example: 'User',
    description: 'Тип сутності: User, Device, Action',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  entityType?: string;

  @ApiPropertyOptional({ example: 'USER_CREATED' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  operation?: string;

  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00Z',
    description: 'Початок періоду (UTC)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Кінець періоду (UTC)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
