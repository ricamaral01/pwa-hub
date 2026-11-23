import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorPayload {
  statusCode: number;
  error: string;
  message: string | string[];
  correlationId?: string;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Erro interno do servidor';
    let error = 'Internal Server Error';

    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const typed = body as { message?: string | string[]; error?: string };
        message = typed.message ?? exception.message;
        error = typed.error ?? error;
      }
    }

    if (!isHttpException) {
      // Nunca vazar stack trace ou detalhes internos para o cliente.
      this.logger.error(
        `Erro não tratado: ${(exception as Error)?.message ?? exception}`,
        (exception as Error)?.stack,
      );
    }

    const payload: ErrorPayload = {
      statusCode: status,
      error,
      message,
      correlationId: request.correlationId,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
