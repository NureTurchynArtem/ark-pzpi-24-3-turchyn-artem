import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sha256 } from '../../common/utils/crypto.util';
import { Device, DeviceStatus } from '../../database/entities';
import { AuthenticatedRequest } from '../auth.types';

/**
 * Автентифікує апаратний помічник за секретним ключем із заголовка X-Device-
 * Key.
 * У базі даних зберігається лише SHA-256 хеш ключа.
 */
@Injectable()
export class DeviceKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(Device) private readonly devices: Repository<Device>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const deviceKey = request.header('x-device-key');
    if (!deviceKey) {
      throw new UnauthorizedException('Missing X-Device-Key header');
    }
    const device = await this.devices.findOne({
      where: { keyHash: sha256(deviceKey) },
    });
    if (!device || device.status !== DeviceStatus.ACTIVE) {
      throw new UnauthorizedException('Unknown or revoked device key');
    }
    request.device = device;
    return true;
  }
}
