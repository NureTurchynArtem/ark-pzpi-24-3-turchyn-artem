import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToBoolean } from '../../common/decorators/to-boolean.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Фільтри списку користувачів */
export class UsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'мельник',
    description: 'Пошук за email або ПІБ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
