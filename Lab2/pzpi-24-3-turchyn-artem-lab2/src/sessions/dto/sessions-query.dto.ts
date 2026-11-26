import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { ToBoolean } from '../../common/decorators/to-boolean.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Фільтри архіву сесій */
export class SessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 3,
    description: 'Ігнорується для ролі OPERATOR',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deviceId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'true — лише відкриті, false — лише завершені',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  active?: boolean;
}
