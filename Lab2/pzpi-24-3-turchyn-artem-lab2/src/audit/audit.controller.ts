import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { Page } from '../common/utils/query.util';
import { AuditLog, RoleCode } from '../database/entities';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';

@ApiTags('Журнал аудиту')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({
    summary: 'Журнал адміністративних змін (фільтри, пагінація)',
  })
  findAll(@Query() query: AuditQueryDto): Promise<Page<AuditLog>> {
    return this.auditService.findAll(query);
  }
}
