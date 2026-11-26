import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Action } from './action.entity';
import { CommandParameter } from './command-parameter.entity';
import { CommandStatus } from './enums';
import { Session } from './session.entity';

/** Типізована команда: запит на виконання дозволеної дії в межах сесії */
@Entity({ name: 'commands' })
@Unique('uq_commands_idempotency_key', ['idempotencyKey'])
@Index('idx_commands_session_id', ['sessionId'])
@Index('idx_commands_action_id', ['actionId'])
@Index('idx_commands_status_created_at', ['status', 'createdAt'])
export class Command {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_commands' })
  id: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId: number;

  @Column({ name: 'action_id', type: 'int' })
  actionId: number;

  /**
   * Ключ ідемпотентності: повторний запит із тим самим ключем не створює
   * дубліката
   */
  @Column({ name: 'idempotency_key', type: 'varchar', length: 64 })
  idempotencyKey: string;

  /** Текст запиту користувача (аудіо на сервері не зберігається) */
  @Column({
    name: 'request_text',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  requestText: string | null;

  @Column({
    type: 'enum',
    enum: CommandStatus,
    enumName: 'command_status',
    default: CommandStatus.CREATED,
  })
  status: CommandStatus;

  /**
   * Код результату виконання дії у мобільному застосунку (OK, E_TIMEOUT тощо)
   */
  @Column({ name: 'result_code', type: 'varchar', length: 32, nullable: true })
  resultCode: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Session, (session) => session.commands, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'fk_commands_session',
  })
  session: Session;

  @ManyToOne(() => Action, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'action_id',
    foreignKeyConstraintName: 'fk_commands_action',
  })
  action: Action;

  @OneToMany(() => CommandParameter, (value) => value.command)
  parameters: CommandParameter[];
}
