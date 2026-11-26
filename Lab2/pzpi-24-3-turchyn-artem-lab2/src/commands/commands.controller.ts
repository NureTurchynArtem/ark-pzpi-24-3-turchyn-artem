import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.types';
import { Page } from '../common/utils/query.util';
import { CommandsService, CommandView } from './commands.service';
import { CommandsQueryDto } from './dto/commands-query.dto';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandStatusDto } from './dto/update-command-status.dto';

@ApiTags('Команди')
@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Журнал команд (фільтри за станом, дією, сесією, періодом)',
  })
  findAll(
    @Query() query: CommandsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Page<CommandView>> {
    return this.commandsService.findAll(query, user);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Команда за ідентифікатором' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<CommandView> {
    return this.commandsService.findOne(id, user);
  }

  @Post()
  @Auth()
  @ApiOperation({
    summary: 'Створити команду (ідемпотентно за idempotencyKey)',
  })
  @ApiCreatedResponse({ description: 'Команду створено' })
  @ApiOkResponse({
    description: 'Команда з таким ключем уже існує — повернуто наявну',
  })
  async create(
    @Body() dto: CreateCommandDto,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CommandView> {
    const result = await this.commandsService.create(dto, user);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result.command;
  }

  @Patch(':id/status')
  @Auth()
  @ApiOperation({
    summary: 'Змінити стан команди (перевіряються дозволені переходи)',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommandStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CommandView> {
    return this.commandsService.updateStatus(id, dto, user);
  }
}
