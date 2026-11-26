import { Request } from 'express';
import { Device, RoleCode } from '../database/entities';

/** Дані автентифікованого користувача, отримані з JWT-токена */
export interface AuthUser {
  id: number;
  email: string;
  role: RoleCode;
}

/** Вміст (payload) JWT-токена */
export interface JwtPayload {
  sub: number;
  email: string;
  role: RoleCode;
}

/** HTTP-запит після проходження guard-ів автентифікації */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  device?: Device;
}
