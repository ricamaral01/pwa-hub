import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  if (!isProduction) {
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed =
          /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):5173$/.test(origin) ||
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/.test(origin) ||
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173$/.test(origin) ||
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:5173$/.test(origin);
        callback(allowed ? null : new Error('Origem CORS nao permitida.'), allowed);
      },
      credentials: true,
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port, '0.0.0.0');
}

bootstrap();
