import { CommandStatus } from '../database/entities';

/** Дозволені переходи між станами життєвого циклу команди */
export const COMMAND_TRANSITIONS: Readonly<
  Record<CommandStatus, readonly CommandStatus[]>
> = {
  [CommandStatus.CREATED]: [
    CommandStatus.PENDING_CONFIRMATION,
    CommandStatus.CONFIRMED,
    CommandStatus.CANCELLED,
  ],
  [CommandStatus.PENDING_CONFIRMATION]: [
    CommandStatus.CONFIRMED,
    CommandStatus.CANCELLED,
    CommandStatus.EXPIRED,
  ],
  [CommandStatus.CONFIRMED]: [
    CommandStatus.DISPATCHED,
    CommandStatus.CANCELLED,
  ],
  [CommandStatus.DISPATCHED]: [CommandStatus.EXECUTED, CommandStatus.FAILED],
  [CommandStatus.EXECUTED]: [],
  [CommandStatus.FAILED]: [],
  [CommandStatus.CANCELLED]: [],
  [CommandStatus.EXPIRED]: [],
};

/** Перевіряє, чи дозволено перехід команди зі стану from у стан to */
export function canTransition(from: CommandStatus, to: CommandStatus): boolean {
  return COMMAND_TRANSITIONS[from].includes(to);
}
