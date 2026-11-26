import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Коди помилок PostgreSQL (SQLSTATE), які обробляє фільтр */
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_CHECK_VIOLATION = '23514';
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

/** Поля помилки драйвера pg, які використовуються для формування відповіді */
interface PgDriverError {
  code?: string;
  detail?: string;
  constraint?: string;
}

/**
 * Перетворює помилки PostgreSQL (порушення обмежень цілісності) на зрозумілі
 * HTTP-відповіді,
 * щоб клієнт отримував 400/409 з поясненням замість 500.
 */
@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const driverError = exception.driverError as PgDriverError;
    const { status, message } = this.mapError(driverError, request.method);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.message, exception.stack);
    }
    response.status(status).json({
      statusCode: status,
      message,
      constraint: driverError.constraint ?? null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  /** Визначає HTTP-статус і текст повідомлення за кодом помилки PostgreSQL */
  private mapError(
    error: PgDriverError,
    method: string,
  ): { status: number; message: string } {
    switch (error.code) {
      case PG_UNIQUE_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate value. ${error.detail ?? ''}`.trim(),
        };
      case PG_FOREIGN_KEY_VIOLATION:
        // Для DELETE це означає, що на запис посилаються інші записи,
        // для POST/PUT — що вказаного пов'язаного запису не існує
        return method === 'DELETE'
          ? {
              status: HttpStatus.CONFLICT,
              message: `Record is still in use. ${error.detail ?? ''}`.trim(),
            }
          : {
              status: HttpStatus.BAD_REQUEST,
              message: `Related record not found. ${error.detail ?? ''}`.trim(),
            };
      case PG_CHECK_VIOLATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Check constraint violated: ${error.constraint}`,
        };
      case PG_INVALID_TEXT_REPRESENTATION:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid value format',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
        };
    }
  }
}
