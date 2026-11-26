import * as bcrypt from 'bcryptjs';
import { EntityManager } from 'typeorm';
import { sha256 } from '../../common/utils/crypto.util';
import dataSource from '../data-source';
import {
  Action,
  ActionParameter,
  AuditLog,
  Command,
  CommandParameter,
  CommandStatus,
  Device,
  DeviceEvent,
  DeviceEventType,
  Locale,
  ParameterType,
  RiskLevel,
  Role,
  RoleCode,
  Session,
  User,
} from '../entities';

/**
 * Ключ демонстраційного апаратного помічника HB-0001 (для тестування API подій)
 */
const DEMO_DEVICE_KEY = 'dk_demo_hb0001_0000000000000000000000000000000000';

/** Тестові облікові записи: email, пароль, ПІБ, роль, мова */
const DEMO_USERS: Array<[string, string, string, RoleCode, Locale]> = [
  [
    'admin@example.com',
    'Admin123!',
    'Ірина Коваленко',
    RoleCode.SYSTEM_ADMIN,
    Locale.UK,
  ],
  [
    'catalog@example.com',
    'Catalog123!',
    'Максим Бондар',
    RoleCode.CATALOG_ADMIN,
    Locale.UK,
  ],
  [
    'operator@example.com',
    'Operator123!',
    'Андрій Мельник',
    RoleCode.OPERATOR,
    Locale.UK,
  ],
  [
    'courier@example.com',
    'Courier123!',
    'Olha Shevchenko',
    RoleCode.OPERATOR,
    Locale.EN,
  ],
];

/** Опис дії каталогу для наповнення бази даних */
interface ActionSeed {
  code: string;
  nameUk: string;
  nameEn: string;
  riskLevel: RiskLevel;
  roles: RoleCode[];
  parameters: Array<Partial<ActionParameter>>;
}

const DEMO_ACTIONS: ActionSeed[] = [
  {
    code: 'order.mark_delivered',
    nameUk: 'Позначити замовлення доставленим',
    nameEn: 'Mark order as delivered',
    riskLevel: RiskLevel.MEDIUM,
    roles: [RoleCode.OPERATOR, RoleCode.SYSTEM_ADMIN],
    parameters: [
      {
        code: 'orderId',
        nameUk: 'Номер замовлення',
        nameEn: 'Order number',
        type: ParameterType.INTEGER,
        minValue: 1,
      },
    ],
  },
  {
    code: 'stock.set_quantity',
    nameUk: 'Змінити кількість товару',
    nameEn: 'Set item quantity',
    riskLevel: RiskLevel.MEDIUM,
    roles: [RoleCode.OPERATOR],
    parameters: [
      {
        code: 'sku',
        nameUk: 'Артикул',
        nameEn: 'SKU',
        type: ParameterType.STRING,
      },
      {
        code: 'quantity',
        nameUk: 'Кількість',
        nameEn: 'Quantity',
        type: ParameterType.INTEGER,
        unit: 'pcs',
        minValue: 0,
        maxValue: 10000,
      },
    ],
  },
  {
    code: 'timer.start',
    nameUk: 'Запустити таймер робіт',
    nameEn: 'Start work timer',
    riskLevel: RiskLevel.LOW,
    roles: [RoleCode.OPERATOR],
    parameters: [
      {
        code: 'minutes',
        nameUk: 'Тривалість',
        nameEn: 'Duration',
        type: ParameterType.INTEGER,
        unit: 'min',
        minValue: 1,
        maxValue: 480,
      },
    ],
  },
  {
    code: 'note.create',
    nameUk: 'Додати нотатку',
    nameEn: 'Add note',
    riskLevel: RiskLevel.LOW,
    roles: [RoleCode.OPERATOR, RoleCode.SYSTEM_ADMIN],
    parameters: [
      {
        code: 'text',
        nameUk: 'Текст нотатки',
        nameEn: 'Note text',
        type: ParameterType.STRING,
      },
    ],
  },
  {
    code: 'order.cancel',
    nameUk: 'Скасувати замовлення',
    nameEn: 'Cancel order',
    riskLevel: RiskLevel.HIGH,
    roles: [RoleCode.SYSTEM_ADMIN],
    parameters: [
      {
        code: 'orderId',
        nameUk: 'Номер замовлення',
        nameEn: 'Order number',
        type: ParameterType.INTEGER,
        minValue: 1,
      },
      {
        code: 'reason',
        nameUk: 'Причина',
        nameEn: 'Reason',
        type: ParameterType.STRING,
        isRequired: false,
      },
    ],
  },
];

/**
 * Повертає дату, зміщену на вказану кількість хвилин назад від поточного
 * моменту
 */
function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

/** Створює ролі та користувачів; повертає користувачів за email */
async function seedUsers(manager: EntityManager): Promise<Map<string, User>> {
  const roles = await manager.save(Role, [
    { code: RoleCode.OPERATOR, nameUk: 'Оператор', nameEn: 'Operator' },
    {
      code: RoleCode.CATALOG_ADMIN,
      nameUk: 'Адміністратор каталогу',
      nameEn: 'Catalog administrator',
    },
    {
      code: RoleCode.SYSTEM_ADMIN,
      nameUk: 'Адміністратор системи',
      nameEn: 'System administrator',
    },
  ]);
  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const users = new Map<string, User>();
  for (const [email, password, fullName, roleCode, locale] of DEMO_USERS) {
    const user = await manager.save(User, {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      roleId: roleByCode.get(roleCode)!.id,
      locale,
    });
    users.set(email, user);
  }
  return users;
}

/**
 * Створює каталог дозволених дій з параметрами та ролями; повертає дії за кодом
 */
async function seedActions(
  manager: EntityManager,
): Promise<Map<string, Action>> {
  const roles = await manager.find(Role);
  const actions = new Map<string, Action>();
  for (const seed of DEMO_ACTIONS) {
    const action = await manager.save(Action, {
      code: seed.code,
      nameUk: seed.nameUk,
      nameEn: seed.nameEn,
      riskLevel: seed.riskLevel,
      roles: roles.filter((role) => seed.roles.includes(role.code)),
    });
    action.parameters = await manager.save(
      ActionParameter,
      seed.parameters.map((parameter) => ({
        ...parameter,
        actionId: action.id,
      })),
    );
    actions.set(seed.code, action);
  }
  return actions;
}

/**
 * Створює команду з параметрами (значення задаються за кодами параметрів дії)
 */
async function seedCommand(
  manager: EntityManager,
  session: Session,
  action: Action,
  values: Record<string, string>,
  status: CommandStatus,
  key: string,
): Promise<Command> {
  const command = await manager.save(Command, {
    sessionId: session.id,
    actionId: action.id,
    idempotencyKey: key,
    status,
    resultCode: status === CommandStatus.EXECUTED ? 'OK' : null,
  });
  await manager.save(
    CommandParameter,
    action.parameters
      .filter((parameter) => values[parameter.code] !== undefined)
      .map((parameter) => ({
        commandId: command.id,
        parameterId: parameter.id,
        value: values[parameter.code],
      })),
  );
  return command;
}

/** Наповнює базу даних демонстраційними даними для перевірки API */
async function seed(): Promise<void> {
  await dataSource.initialize();
  try {
    if ((await dataSource.getRepository(Role).count()) > 0) {
      console.log(
        'Database is already seeded. Run "npm run db:reset" to recreate it.',
      );
      return;
    }
    await dataSource.transaction(async (manager) => {
      const users = await seedUsers(manager);
      const actions = await seedActions(manager);
      const operator = users.get('operator@example.com')!;

      const device = await manager.save(Device, {
        serialNumber: 'HB-0001',
        name: 'Помічник складу №1',
        ownerId: operator.id,
        keyHash: sha256(DEMO_DEVICE_KEY),
        firmwareVersion: '1.0.0',
        lastSeenAt: minutesAgo(50),
      });
      await manager.save(Device, {
        serialNumber: 'HB-0002',
        name: 'Courier helper',
        ownerId: users.get('courier@example.com')!.id,
        keyHash: sha256('dk_demo_hb0002_not_for_tests'),
        firmwareVersion: '1.0.0',
      });

      const session = await manager.save(Session, {
        userId: operator.id,
        deviceId: device.id,
        startedAt: minutesAgo(60),
        endedAt: minutesAgo(50),
      });
      const timer = await seedCommand(
        manager,
        session,
        actions.get('timer.start')!,
        { minutes: '30' },
        CommandStatus.EXECUTED,
        'seed-0001',
      );
      await seedCommand(
        manager,
        session,
        actions.get('order.mark_delivered')!,
        { orderId: '10452' },
        CommandStatus.EXECUTED,
        'seed-0002',
      );
      await seedCommand(
        manager,
        session,
        actions.get('stock.set_quantity')!,
        { sku: 'SKU-778', quantity: '12' },
        CommandStatus.CANCELLED,
        'seed-0003',
      );

      const eventTypes = [
        DeviceEventType.BUTTON_SHORT,
        DeviceEventType.TOUCH_TAP,
        DeviceEventType.COMMAND_RESULT,
        DeviceEventType.ENCODER_TURN,
        DeviceEventType.BUTTON_LONG,
      ];
      await manager.save(
        DeviceEvent,
        eventTypes.map((type, index) => ({
          deviceId: device.id,
          eventUid: `HB-0001-${String(index + 1).padStart(6, '0')}`,
          seq: index + 1,
          type,
          value: type === DeviceEventType.ENCODER_TURN ? 3 : null,
          commandId: type === DeviceEventType.COMMAND_RESULT ? timer.id : null,
          occurredAt: minutesAgo(59 - index * 2),
        })),
      );
      await manager.save(AuditLog, {
        userId: users.get('admin@example.com')!.id,
        operation: 'DATABASE_SEEDED',
        entityType: 'System',
        details: 'Initial demo data',
      });
    });

    console.log('Database seeded successfully.');
    console.table(
      DEMO_USERS.map(([email, password, , role]) => ({
        email,
        password,
        role,
      })),
    );
    console.log(`Demo device HB-0001 key (X-Device-Key): ${DEMO_DEVICE_KEY}`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
