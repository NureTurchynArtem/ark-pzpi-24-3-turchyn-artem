import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RoleCode } from './enums';
import { User } from './user.entity';

/**
 * Роль користувача (довідник): оператор, адміністратор каталогу, адміністратор
 * системи
 */
@Entity({ name: 'roles' })
@Unique('uq_roles_code', ['code'])
export class Role {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'pk_roles' })
  id: number;

  @Column({ type: 'varchar', length: 32 })
  code: RoleCode;

  @Column({ name: 'name_uk', type: 'varchar', length: 64 })
  nameUk: string;

  @Column({ name: 'name_en', type: 'varchar', length: 64 })
  nameEn: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
