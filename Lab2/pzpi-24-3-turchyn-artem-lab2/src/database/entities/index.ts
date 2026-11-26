import { ActionParameter } from './action-parameter.entity';
import { Action } from './action.entity';
import { AuditLog } from './audit-log.entity';
import { CommandParameter } from './command-parameter.entity';
import { Command } from './command.entity';
import { DeviceEvent } from './device-event.entity';
import { Device } from './device.entity';
import { Role } from './role.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

export * from './enums';
export {
  Action,
  ActionParameter,
  AuditLog,
  Command,
  CommandParameter,
  Device,
  DeviceEvent,
  Role,
  Session,
  User,
};

/** Усі сутності, які TypeORM відображає на таблиці бази даних */
export const ENTITIES = [
  Role,
  User,
  Device,
  Action,
  ActionParameter,
  Session,
  Command,
  CommandParameter,
  DeviceEvent,
  AuditLog,
];
