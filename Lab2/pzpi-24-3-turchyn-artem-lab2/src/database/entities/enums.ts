/** Коди ролей користувачів системи */
export enum RoleCode {
  OPERATOR = 'OPERATOR',
  CATALOG_ADMIN = 'CATALOG_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

/** Мова інтерфейсу користувача */
export enum Locale {
  UK = 'uk',
  EN = 'en',
}

/** Рівень ризику дозволеної дії */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Тип значення параметра дії */
export enum ParameterType {
  INTEGER = 'INTEGER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
}

/** Стан апаратного помічника */
export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

/** Стани життєвого циклу команди */
export enum CommandStatus {
  CREATED = 'CREATED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  EXECUTED = 'EXECUTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/** Типи локальних подій, які формує апаратний помічник */
export enum DeviceEventType {
  BUTTON_SHORT = 'BUTTON_SHORT',
  BUTTON_DOUBLE = 'BUTTON_DOUBLE',
  BUTTON_LONG = 'BUTTON_LONG',
  TOUCH_TAP = 'TOUCH_TAP',
  TOUCH_HOLD = 'TOUCH_HOLD',
  ENCODER_TURN = 'ENCODER_TURN',
  COMMAND_RESULT = 'COMMAND_RESULT',
}
