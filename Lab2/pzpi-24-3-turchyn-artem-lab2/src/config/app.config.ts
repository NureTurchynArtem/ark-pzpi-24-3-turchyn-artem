import 'dotenv/config';

/**
 * Налаштування застосунку, які зчитуються зі змінних середовища (файл .env).
 * Значення за замовчуванням відповідають локальному запуску через docker-
 * compose.
 */
export const appConfig = {
  port: Number(process.env.PORT ?? 3000),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    expiresInSeconds: Number(process.env.JWT_EXPIRES_IN ?? 3600),
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USER ?? 'helper',
    password: process.env.DB_PASSWORD ?? 'helper',
    name: process.env.DB_NAME ?? 'allowed_actions',
  },
} as const;
