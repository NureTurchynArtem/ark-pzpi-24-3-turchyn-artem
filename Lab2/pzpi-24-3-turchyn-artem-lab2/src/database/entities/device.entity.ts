import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { DeviceStatus } from './enums';
import { User } from './user.entity';

/** Апаратний помічник (IoT-пристрій на ESP32), закріплений за користувачем */
@Entity({ name: 'devices' })
@Unique('uq_devices_serial_number', ['serialNumber'])
@Unique('uq_devices_key_hash', ['keyHash'])
@Index('idx_devices_owner_id', ['ownerId'])
export class Device {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_devices' })
  id: number;

  @Column({ name: 'serial_number', type: 'varchar', length: 32 })
  serialNumber: string;

  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'owner_id', type: 'int', nullable: true })
  ownerId: number | null;

  /** SHA-256 хеш секретного ключа пристрою; сам ключ видається лише один раз */
  @Column({ name: 'key_hash', type: 'char', length: 64, select: false })
  keyHash: string;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    enumName: 'device_status',
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;

  @Column({
    name: 'firmware_version',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  firmwareVersion: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'owner_id',
    foreignKeyConstraintName: 'fk_devices_owner',
  })
  owner: User | null;
}
