import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'node:path';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/global-exception.filter.js';
import { PrismaService } from './prisma/prisma.service.js';
import { seedDefaultAuthData } from './auth/auth.seed.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const prisma = app.get(PrismaService);

  app.setGlobalPrefix('api');
  app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: [/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):5173$/, /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/],
      credentials: true,
    });
  }

  await seedDefaultAuthData(prisma);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
