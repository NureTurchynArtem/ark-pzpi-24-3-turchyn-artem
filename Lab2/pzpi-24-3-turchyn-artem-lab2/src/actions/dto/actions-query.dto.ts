import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ToBoolean } from '../../common/decorators/to-boolean.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Locale, RiskLevel } from '../../database/entities';

/** Фільтри каталогу дозволених дій */
export class ActionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RiskLevel, enumName: 'RiskLevel' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Лише дії, дозволені цій ролі',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({
    example: 'order',
    description: 'Пошук за кодом або назвою',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @ApiPropertyOptional({
    enum: Locale,
    enumName: 'Locale',
    description: 'Мова, за назвою якою сортується список',
  })
  @IsOptional()
  @IsEnum(Locale)
  lang?: Locale;
}
