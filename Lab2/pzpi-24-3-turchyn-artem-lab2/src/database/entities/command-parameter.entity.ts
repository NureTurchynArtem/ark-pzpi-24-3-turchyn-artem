import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ActionParameter } from './action-parameter.entity';
import { Command } from './command.entity';

/**
 * Значення параметра конкретної команди (складений первинний ключ: команда +
 * параметр)
 */
@Entity({ name: 'command_parameters' })
export class CommandParameter {
  @PrimaryColumn({
    name: 'command_id',
    type: 'int',
    primaryKeyConstraintName: 'pk_command_parameters',
  })
  commandId: number;

  @PrimaryColumn({
    name: 'parameter_id',
    type: 'int',
    primaryKeyConstraintName: 'pk_command_parameters',
  })
  parameterId: number;

  /** Значення у текстовому вигляді; тип визначається описом параметра */
  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ManyToOne(() => Command, (command) => command.parameters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'command_id',
    foreignKeyConstraintName: 'fk_command_parameters_command',
  })
  command: Command;

  @ManyToOne(() => ActionParameter, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'parameter_id',
    foreignKeyConstraintName: 'fk_command_parameters_parameter',
  })
  parameter: ActionParameter;
}
