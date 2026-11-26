import {
  Between,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

/** Сторінка результатів списку разом із загальною кількістю записів */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** Перетворює номер і розмір сторінки на параметри skip/take для TypeORM */
export function toSkipTake(query: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

/** Формує сторінку з результату findAndCount / getManyAndCount */
export function toPage<T>(
  [items, total]: [T[], number],
  query: PaginationQueryDto,
): Page<T> {
  return { items, total, page: query.page, limit: query.limit };
}

/** Формує умову фільтрації за проміжком часу [from; to] */
export function dateRange(
  from?: Date,
  to?: Date,
): FindOperator<Date> | undefined {
  if (from && to) {
    return Between(from, to);
  }
  if (from) {
    return MoreThanOrEqual(from);
  }
  return to ? LessThanOrEqual(to) : undefined;
}
