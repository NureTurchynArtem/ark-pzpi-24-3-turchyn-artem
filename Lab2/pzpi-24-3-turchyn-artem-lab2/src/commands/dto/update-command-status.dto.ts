import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, Matches } from 'class-validator';
import { CommandStatus } from '../../database/entities';

/** Новий стан команди та (за потреби) код результату виконання */
export class UpdateCommandStatusDto {
  @ApiProperty({
    enum: CommandStatus,
    enumName: 'CommandStatus',
    example: CommandStatus.CONFIRMED,
  })
  @IsEnum(CommandStatus)
  status: CommandStatus;

  @ApiPropertyOptional({
    example: 'OK',
    description: 'Код результату від мобільного застосунку',
  })
  @IsOptional()
  @Matches(/^[A-Z0-9_]{1,32}$/)
  resultCode?: string;
}
