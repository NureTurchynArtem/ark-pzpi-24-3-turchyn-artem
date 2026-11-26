import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.types';
import { Page } from '../common/utils/query.util';
import { Session } from '../database/entities';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsQueryDto } from './dto/sessions-query.dto';
import { SessionsService } from './sessions.service';

@ApiTags('Сесії')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Архів сесій (оператор бачить лише власні)' })
  findAll(
    @Query() query: SessionsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Page<Session>> {
    return this.sessionsService.findAll(query, user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Сесія з командами' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<Session> {
    return this.sessionsService.findOne(id, user);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Відкрити сесію поточного користувача' })
  start(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Session> {
    return this.sessionsService.start(dto, user);
  }

  @Patch(':id/end')
  @Auth()
  @ApiOperation({ summary: 'Завершити сесію' })
  end(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<Session> {
    return this.sessionsService.end(id, user);
  }
}
