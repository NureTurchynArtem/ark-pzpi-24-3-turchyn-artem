import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ActionParameter } from './action-parameter.entity';
import { RiskLevel } from './enums';
import { Role } from './role.entity';

/** Дозволена дія власного мобільного застосунку компанії (елемент каталогу) */
@Entity({ name: 'actions' })
@Unique('uq_actions_code', ['code'])
export class Action {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_actions' })
  id: number;

  /** Незмінний код дії, за яким її визначають клієнти та мовна модель */
  @Column({ type: 'varchar', length: 64 })
  code: string;

  /**
   * Назва українською; правило сортування ICU враховує український алфавіт (Ґ,
   * Є, І, Ї)
   */
  @Column({
    name: 'name_uk',
    type: 'varchar',
    length: 128,
    collation: 'uk-x-icu',
  })
  nameUk: string;

  @Column({
    name: 'name_en',
    type: 'varchar',
    length: 128,
    collation: 'en-x-icu',
  })
  nameEn: string;

  @Column({
    name: 'risk_level',
    type: 'enum',
    enum: RiskLevel,
    enumName: 'risk_level',
  })
  riskLevel: RiskLevel;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ActionParameter, (parameter) => parameter.action)
  parameters: ActionParameter[];

  /**
   * Ролі, яким дозволено виконувати дію (зв'язок «багато до багатьох» через
   * action_roles)
   */
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'action_roles',
    joinColumn: {
      name: 'action_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_action_roles_action',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_action_roles_role',
    },
  })
  roles: Role[];
}
