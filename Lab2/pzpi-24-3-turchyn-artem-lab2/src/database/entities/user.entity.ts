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
import { Locale } from './enums';
import { Role } from './role.entity';

/** Користувач системи (працівник компанії або адміністратор) */
@Entity({ name: 'users' })
@Unique('uq_users_email', ['email'])
@Index('idx_users_role_id', ['roleId'])
export class User {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_users' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Хеш пароля bcrypt; сам пароль у базі даних не зберігається */
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 100,
    select: false,
  })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: 128 })
  fullName: string;

  @Column({ name: 'role_id', type: 'int' })
  roleId: number;

  @Column({
    type: 'enum',
    enum: Locale,
    enumName: 'locale',
    default: Locale.UK,
  })
  locale: Locale;

  /** Часовий пояс для відображення часу; на сервері час зберігається в UTC */
  @Column({
    name: 'time_zone',
    type: 'varchar',
    length: 64,
    default: 'Europe/Kyiv',
  })
  timeZone: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'role_id', foreignKeyConstraintName: 'fk_users_role' })
  role: Role;
}
