import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * Дані для відкриття сесії; без deviceId сесія відкривається для тестового
 * клієнта
 */
export class CreateSessionDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Апаратний помічник, через який працює користувач',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  deviceId?: number;
}
