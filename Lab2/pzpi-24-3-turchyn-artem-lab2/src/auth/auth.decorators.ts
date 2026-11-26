import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Device, RoleCode } from '../database/entities';
import { AuthenticatedRequest, AuthUser } from './auth.types';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/** Ключ метаданих зі списком ролей, яким дозволено доступ до маршруту */
export const ROLES_KEY = 'roles';

/**
 * Вимагає JWT-автентифікації; якщо передано ролі — доступ мають лише
 * користувачі з цими ролями.
 * Приклад: @Auth(RoleCode.SYSTEM_ADMIN)
 */
export function Auth(...roles: RoleCode[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Відсутній або недійсний JWT-токен',
    }),
    ApiForbiddenResponse({ description: 'Недостатньо прав для операції' }),
  );
}

/** Повертає автентифікованого користувача (request.user) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user as AuthUser,
);

/** Повертає автентифікований апаратний помічник (request.device) */
export const CurrentDevice = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Device =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().device as Device,
);
