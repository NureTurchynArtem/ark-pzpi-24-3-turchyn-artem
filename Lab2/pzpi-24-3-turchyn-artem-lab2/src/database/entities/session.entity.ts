import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Command } from './command.entity';
import { Device } from './device.entity';
import { User } from './user.entity';

/**
 * Сесія взаємодії користувача з системою (через апаратний помічник або тестовий
 * клієнт)
 */
@Entity({ name: 'sessions' })
@Index('idx_sessions_user_id', ['userId'])
@Index('idx_sessions_device_id', ['deviceId'])
@Check(
  'chk_sessions_period',
  '"ended_at" IS NULL OR "ended_at" >= "started_at"',
)
export class Session {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_sessions' })
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'device_id', type: 'int', nullable: true })
  deviceId: number | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'fk_sessions_user' })
  user: User;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'device_id',
    foreignKeyConstraintName: 'fk_sessions_device',
  })
  device: Device | null;

  @OneToMany(() => Command, (command) => command.session)
  commands: Command[];
}
