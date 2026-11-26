import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { appConfig } from '../config/app.config';
import { ENTITIES } from './entities';

/** Спільні параметри підключення TypeORM для застосунку та CLI міграцій */
export const typeOrmOptions: DataSourceOptions = {
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.name,
  entities: ENTITIES,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  // Схема змінюється лише через міграції, автоматична синхронізація вимкнена
  synchronize: false,
  logging: ['error', 'warn'],
};
