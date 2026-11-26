import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Command } from './command.entity';
import { Device } from './device.entity';
import { DeviceEventType } from './enums';

/**
 * Локальна подія апаратного помічника (натискання кнопки, дотик, оберт
 * енкодера, результат)
 */
@Entity({ name: 'device_events' })
@Unique('uq_device_events_device_event_uid', ['deviceId', 'eventUid'])
@Index('idx_device_events_device_seq', ['deviceId', 'seq'])
@Check('chk_device_events_seq', '"seq" >= 0')
export class DeviceEvent {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_device_events' })
  id: number;

  @Column({ name: 'device_id', type: 'int' })
  deviceId: number;

  /**
   * Унікальний ідентифікатор події на пристрої (використовується для
   * дедуплікації)
   */
  @Column({ name: 'event_uid', type: 'varchar', length: 64 })
  eventUid: string;

  /** Монотонний лічильник подій пристрою (для впорядкування) */
  @Column({ type: 'int' })
  seq: number;

  @Column({
    type: 'enum',
    enum: DeviceEventType,
    enumName: 'device_event_type',
  })
  type: DeviceEventType;

  /**
   * Числове значення події: кроки енкодера, тривалість утримання в мс, код
   * результату
   */
  @Column({ type: 'int', nullable: true })
  value: number | null;

  @Column({ name: 'command_id', type: 'int', nullable: true })
  commandId: number | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;

  @ManyToOne(() => Device, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'device_id',
    foreignKeyConstraintName: 'fk_device_events_device',
  })
  device: Device;

  @ManyToOne(() => Command, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'command_id',
    foreignKeyConstraintName: 'fk_device_events_command',
  })
  command: Command | null;
}
