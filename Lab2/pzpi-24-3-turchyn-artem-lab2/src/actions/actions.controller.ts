import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.types';
import { Page } from '../common/utils/query.util';
import { Action, RoleCode } from '../database/entities';
import { ActionsService } from './actions.service';
import { ActionsQueryDto } from './dto/actions-query.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';

@ApiTags('Каталог дозволених дій')
@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  @Auth()
  @ApiOperation({
    summary: 'Каталог дій з параметрами та ролями (фільтри, пагінація)',
  })
  findAll(@Query() query: ActionsQueryDto): Promise<Page<Action>> {
    return this.actionsService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Дія за ідентифікатором' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Action> {
    return this.actionsService.findOne(id);
  }

  @Post()
  @Auth(RoleCode.CATALOG_ADMIN, RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Створити дію з параметрами' })
  create(
    @Body() dto: CreateActionDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<Action> {
    return this.actionsService.create(dto, actor);
  }

  @Put(':id')
  @Auth(RoleCode.CATALOG_ADMIN, RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Оновити дію (назви, ризик, доступність, ролі)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActionDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<Action> {
    return this.actionsService.update(id, dto, actor);
  }

  @Delete(':id')
  @Auth(RoleCode.CATALOG_ADMIN, RoleCode.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити дію (якщо її не використано в командах)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.actionsService.remove(id, actor);
  }
}
