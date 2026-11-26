import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Action } from './action.entity';
import { ParameterType } from './enums';

/**
 * Опис типізованого параметра дії (тип, одиниця вимірювання, допустимий
 * діапазон)
 */
@Entity({ name: 'action_parameters' })
@Unique('uq_action_parameters_action_code', ['actionId', 'code'])
@Check(
  'chk_action_parameters_range',
  '"min_value" IS NULL OR "max_value" IS NULL OR "min_value" <= "max_value"',
)
export class ActionParameter {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_action_parameters' })
  id: number;

  @Column({ name: 'action_id', type: 'int' })
  actionId: number;

  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ name: 'name_uk', type: 'varchar', length: 64 })
  nameUk: string;

  @Column({ name: 'name_en', type: 'varchar', length: 64 })
  nameEn: string;

  @Column({ type: 'enum', enum: ParameterType, enumName: 'parameter_type' })
  type: ParameterType;

  /** Одиниця вимірювання значення (наприклад, pcs, min, kg) */
  @Column({ type: 'varchar', length: 16, nullable: true })
  unit: string | null;

  @Column({ name: 'min_value', type: 'double precision', nullable: true })
  minValue: number | null;

  @Column({ name: 'max_value', type: 'double precision', nullable: true })
  maxValue: number | null;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @ManyToOne(() => Action, (action) => action.parameters, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'action_id',
    foreignKeyConstraintName: 'fk_action_parameters_action',
  })
  action: Action;
}
