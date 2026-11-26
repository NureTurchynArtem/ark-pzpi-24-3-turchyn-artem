import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CommandStatus } from '../../database/entities';

/** Фільтри журналу команд */
export class CommandsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: CommandStatus, enumName: 'CommandStatus' })
  @IsOptional()
  @IsEnum(CommandStatus)
  status?: CommandStatus;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actionId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sessionId?: number;

  @ApiPropertyOptional({
    example: '2026-11-01T00:00:00Z',
    description: 'Створені не раніше (UTC)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'Створені не пізніше (UTC)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
