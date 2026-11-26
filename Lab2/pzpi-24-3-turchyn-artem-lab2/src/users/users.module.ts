import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Role, User } from '../database/entities';
import { RolesController, UsersController } from './users.controller';
import { UsersService } from './users.service';

/** Модуль керування користувачами та довідником ролей */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuditModule],
  controllers: [UsersController, RolesController],
  providers: [UsersService],
})
export class UsersModule {}
