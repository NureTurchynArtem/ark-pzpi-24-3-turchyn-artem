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
import { Role, RoleCode, User } from '../database/entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UsersService } from './users.service';

@ApiTags('Користувачі')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Список користувачів (фільтри, пагінація)' })
  findAll(@Query() query: UsersQueryDto): Promise<Page<User>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Користувач за ідентифікатором' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Створити користувача' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<User> {
    return this.usersService.create(dto, actor);
  }

  @Put(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Оновити дані користувача' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<User> {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(':id')
  @Auth(RoleCode.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Видалити користувача (без історії сесій)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    return this.usersService.remove(id, actor);
  }
}

@ApiTags('Ролі')
@Controller('roles')
export class RolesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Довідник ролей користувачів' })
  findAll(): Promise<Role[]> {
    return this.usersService.findAllRoles();
  }
}
