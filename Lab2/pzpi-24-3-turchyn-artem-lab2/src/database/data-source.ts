import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from './typeorm.options';

/**
 * Джерело даних для CLI TypeORM (генерування та виконання міграцій, сценарій
 * наповнення)
 */
export default new DataSource(typeOrmOptions);
