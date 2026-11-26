/**
 * Автоматизована перевірка REST API на запущеному сервері.
 * Запуск: npm run test:api (сервер має працювати на http://localhost:3000).
 * Кожна перевірка надсилає HTTP-запит і порівнює код відповіді з очікуваним.
 * Тимчасові записи отримують унікальні значення, тому скрипт можна
 * запускати повторно без перестворення бази даних.
 */
const BASE_URL = process.env.API_URL ?? 'http://localhost:3000/api';
const DEVICE_KEY = 'dk_demo_hb0001_0000000000000000000000000000000000';
const STAMP = Date.now();
const results = [];

/** Надсилає запит до API, виводить результат і повертає тіло відповіді */
async function check(title, expected, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.deviceKey) {
    headers['X-Device-Key'] = options.deviceKey;
  }
  const response = await fetch(BASE_URL + path, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const passed = response.status === expected;
  results.push(passed);
  const mark = passed ? 'OK  ' : 'FAIL';
  console.log(
    `${mark} ${response.status} ${method.padEnd(6)} ${path.padEnd(34)} ${title}`,
  );
  return text ? JSON.parse(text) : null;
}

/** Виконує вхід і повертає JWT-токен */
async function login(email, password) {
  const data = await check(`вхід ${email}`, 200, 'POST', '/auth/login', {
    body: { email, password },
  });
  return data.accessToken;
}

async function main() {
  console.log(`Перевірка API: ${BASE_URL}\n`);
  await check('стан сервера та БД', 200, 'GET', '/health');

  // Автентифікація та ролі
  const admin = await login('admin@example.com', 'Admin123!');
  const catalog = await login('catalog@example.com', 'Catalog123!');
  const operator = await login('operator@example.com', 'Operator123!');
  await check('невірний пароль', 401, 'POST', '/auth/login', {
    body: { email: 'admin@example.com', password: 'WrongPass1!' },
  });
  await check('запит без токена', 401, 'GET', '/auth/me');
  await check('профіль', 200, 'GET', '/auth/me', { token: operator });
  await check('довідник ролей', 200, 'GET', '/roles', { token: operator });

  // Користувачі: CRUD і обмеження цілісності
  await check('оператор не бачить користувачів', 403, 'GET', '/users', {
    token: operator,
  });
  const email = `tester.${STAMP}@example.com`;
  const user = await check('створити користувача', 201, 'POST', '/users', {
    token: admin,
    body: {
      email,
      password: 'Tester123!',
      fullName: 'Тест Тестенко',
      roleId: 1,
    },
  });
  await check('дублікат email', 409, 'POST', '/users', {
    token: admin,
    body: { email, password: 'Tester123!', fullName: 'Дублікат', roleId: 1 },
  });
  await check('неіснуюча роль', 400, 'POST', '/users', {
    token: admin,
    body: {
      email: `x.${STAMP}@example.com`,
      password: 'Tester123!',
      fullName: 'X',
      roleId: 99,
    },
  });
  await check('знайти користувача', 200, 'GET', `/users/${user.id}`, {
    token: admin,
  });
  await check('оновити користувача', 200, 'PUT', `/users/${user.id}`, {
    token: admin,
    body: {
      fullName: 'Тест Тестенко',
      roleId: 1,
      locale: 'en',
      timeZone: 'Europe/London',
      isActive: true,
    },
  });
  await check('користувач з історією', 409, 'DELETE', '/users/3', {
    token: admin,
  });
  await check('видалити користувача', 204, 'DELETE', `/users/${user.id}`, {
    token: admin,
  });
  await check('видалений користувач', 404, 'GET', `/users/${user.id}`, {
    token: admin,
  });

  // Апаратні помічники
  const device = await check(
    'зареєструвати пристрій',
    201,
    'POST',
    '/devices',
    {
      token: admin,
      body: {
        serialNumber: `HB-T${STAMP % 1000000}`,
        name: 'Тестовий помічник',
      },
    },
  );
  await check('відкликати ключ', 200, 'PATCH', `/devices/${device.id}/revoke`, {
    token: admin,
  });
  await check('подія з відкликаним ключем', 401, 'POST', '/device/events', {
    deviceKey: device.deviceKey,
    body: {
      eventUid: 'x',
      seq: 1,
      type: 'BUTTON_SHORT',
      occurredAt: new Date().toISOString(),
    },
  });
  await check('видалити пристрій', 204, 'DELETE', `/devices/${device.id}`, {
    token: admin,
  });

  // Каталог дозволених дій
  await check('каталог дій', 200, 'GET', '/actions?lang=uk', {
    token: operator,
  });
  const action = await check('створити дію', 201, 'POST', '/actions', {
    token: catalog,
    body: {
      code: `test.action_${STAMP}`,
      nameUk: 'Тестова дія',
      nameEn: 'Test action',
      riskLevel: 'LOW',
      roleIds: [1],
      parameters: [
        {
          code: 'count',
          nameUk: 'Кількість',
          nameEn: 'Count',
          type: 'INTEGER',
          minValue: 1,
          maxValue: 10,
        },
      ],
    },
  });
  await check('оператор не змінює каталог', 403, 'POST', '/actions', {
    token: operator,
    body: {
      code: 'x.y',
      nameUk: 'X',
      nameEn: 'X',
      riskLevel: 'LOW',
      roleIds: [1],
      parameters: [],
    },
  });
  await check('оновити дію', 200, 'PUT', `/actions/${action.id}`, {
    token: catalog,
    body: {
      nameUk: 'Тестова дія 2',
      nameEn: 'Test action 2',
      riskLevel: 'MEDIUM',
      isEnabled: true,
      roleIds: [1, 3],
    },
  });
  await check('дія, використана в командах', 409, 'DELETE', '/actions/1', {
    token: catalog,
  });
  await check('видалити дію', 204, 'DELETE', `/actions/${action.id}`, {
    token: catalog,
  });

  // Сесія та команди оператора
  const session = await check('відкрити сесію', 201, 'POST', '/sessions', {
    token: operator,
    body: { deviceId: 1 },
  });
  const commandBody = {
    sessionId: session.id,
    actionId: 2,
    idempotencyKey: `check-${STAMP}`,
    requestText: 'зміни кількість SKU-778 на дванадцять',
    parameters: [
      { code: 'sku', value: 'SKU-778' },
      { code: 'quantity', value: '12' },
    ],
  };
  const command = await check('створити команду', 201, 'POST', '/commands', {
    token: operator,
    body: commandBody,
  });
  await check('повтор ключа ідемпотентності', 200, 'POST', '/commands', {
    token: operator,
    body: commandBody,
  });
  await check('значення поза діапазоном', 400, 'POST', '/commands', {
    token: operator,
    body: {
      ...commandBody,
      idempotencyKey: `check-${STAMP}-2`,
      parameters: [
        { code: 'sku', value: 'SKU-1' },
        { code: 'quantity', value: '20000' },
      ],
    },
  });
  await check('дія не дозволена ролі', 403, 'POST', '/commands', {
    token: operator,
    body: {
      sessionId: session.id,
      actionId: 5,
      idempotencyKey: `check-${STAMP}-3`,
      parameters: [{ code: 'orderId', value: '1' }],
    },
  });
  for (const status of ['CONFIRMED', 'DISPATCHED', 'EXECUTED']) {
    await check(
      `стан ${status}`,
      200,
      'PATCH',
      `/commands/${command.id}/status`,
      {
        token: operator,
        body: { status, resultCode: status === 'EXECUTED' ? 'OK' : undefined },
      },
    );
  }
  await check(
    'недопустимий перехід стану',
    409,
    'PATCH',
    `/commands/${command.id}/status`,
    {
      token: operator,
      body: { status: 'CREATED' },
    },
  );
  await check('журнал команд', 200, 'GET', '/commands?status=EXECUTED', {
    token: operator,
  });

  // Події від IoT-клієнта з дедуплікацією
  const events = [1, 2].map((index) => ({
    eventUid: `CHECK-${STAMP}-${index}`,
    seq: 1000 + index,
    type: index === 1 ? 'TOUCH_TAP' : 'COMMAND_RESULT',
    commandId: command.id,
    occurredAt: new Date().toISOString(),
  }));
  const batch = await check(
    'пакет подій',
    200,
    'POST',
    '/device/events/batch',
    {
      deviceKey: DEVICE_KEY,
      body: { events },
    },
  );
  const repeat = await check(
    'повтор пакета',
    200,
    'POST',
    '/device/events/batch',
    {
      deviceKey: DEVICE_KEY,
      body: { events },
    },
  );
  console.log(
    `     прийнято ${batch.accepted}, дублікатів при повторі ${repeat.duplicates}`,
  );
  await check('подія без ключа', 401, 'POST', '/device/events', {
    body: events[0],
  });
  await check('журнал подій пристрою', 200, 'GET', '/devices/1/events', {
    token: admin,
  });

  // Завершення сесії та журнал аудиту
  await check('завершити сесію', 200, 'PATCH', `/sessions/${session.id}/end`, {
    token: operator,
  });
  await check('команда в завершеній сесії', 409, 'POST', '/commands', {
    token: operator,
    body: { ...commandBody, idempotencyKey: `check-${STAMP}-4` },
  });
  await check('журнал аудиту', 200, 'GET', '/audit-logs', { token: admin });

  const passed = results.filter(Boolean).length;
  console.log(`\nУспішно: ${passed} з ${results.length}`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch((error) => {
  console.error('Перевірку перервано:', error.message);
  process.exitCode = 1;
});
