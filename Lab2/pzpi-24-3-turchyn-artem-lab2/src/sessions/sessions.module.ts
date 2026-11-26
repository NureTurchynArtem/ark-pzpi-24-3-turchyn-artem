import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device, Session } from '../database/entities';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

/** Модуль сесій взаємодії */
@Module({
  imports: [TypeOrmModule.forFeature([Session, Device])],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
