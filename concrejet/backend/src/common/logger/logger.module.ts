import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';
import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
              'req.body.senha',
              'req.body.password',
            ],
            censor: '[REDACTED]',
          },
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const id = (req as Request).correlationId ?? randomUUID();
            res.setHeader(CORRELATION_ID_HEADER, id);
            return id;
          },
          customProps: (req: IncomingMessage) => ({
            correlationId: (req as Request).correlationId,
          }),
        },
      }),
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
