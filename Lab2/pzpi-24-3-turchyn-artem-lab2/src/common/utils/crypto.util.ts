import { createHash, randomBytes } from 'crypto';

/** Обчислює SHA-256 хеш рядка у шістнадцятковому вигляді */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Генерує новий секретний ключ апаратного помічника */
export function generateDeviceKey(): string {
  return `dk_${randomBytes(24).toString('hex')}`;
}
