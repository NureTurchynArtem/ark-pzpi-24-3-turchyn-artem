import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Action, Command, Session } from '../database/entities';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';

/** Модуль журналу команд */
@Module({
  imports: [TypeOrmModule.forFeature([Command, Session, Action])],
  controllers: [CommandsController],
  providers: [CommandsService],
})
export class CommandsModule {}
