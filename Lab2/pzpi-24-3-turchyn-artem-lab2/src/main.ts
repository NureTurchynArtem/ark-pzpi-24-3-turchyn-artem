import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';
import { appConfig } from './config/app.config';

/**
 * Точка входу: створює застосунок, налаштовує валідацію, обробку помилок БД і
 * документацію API
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  // Валідація тіла та параметрів запиту за DTO; зайві поля відхиляються
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Allowed Actions API')
    .setDescription(
      'REST API серверної частини програмної системи керування ' +
        'дозволеними діями мобільного застосунку через апаратний помічник',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'X-Device-Key', in: 'header' },
      'device-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(appConfig.port);
  const logger = new Logger('Bootstrap');
  logger.log(`API: http://localhost:${appConfig.port}/api`);
  logger.log(`Swagger UI: http://localhost:${appConfig.port}/api/docs`);
}

void bootstrap();
