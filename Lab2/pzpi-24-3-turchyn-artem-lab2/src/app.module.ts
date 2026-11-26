import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsModule } from './actions/actions.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CommandsModule } from './commands/commands.module';
import { typeOrmOptions } from './database/typeorm.options';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { HealthController } from './health/health.controller';
import { SessionsModule } from './sessions/sessions.module';
import { UsersModule } from './users/users.module';

/** Кореневий модуль серверної частини */
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmOptions),
    AuditModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    ActionsModule,
    SessionsModule,
    CommandsModule,
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
