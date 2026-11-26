import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

/**
 * Запис журналу аудиту адміністративних змін (лише додавання, без редагування)
 */
@Entity({ name: 'audit_logs' })
@Index('idx_audit_logs_entity', ['entityType', 'entityId'])
@Index('idx_audit_logs_created_at', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_audit_logs' })
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  /** Код операції, наприклад USER_CREATED або DEVICE_KEY_REVOKED */
  @Column({ type: 'varchar', length: 64 })
  operation: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entityId: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  details: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_audit_logs_user',
  })
  user: User | null;
}
