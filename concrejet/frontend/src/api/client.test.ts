import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { getApiErrorMessage } from './client';

function apiError(status: number, message?: string, correlationId?: string) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config: {} as never,
    data: { message, correlationId },
  });
}

describe('getApiErrorMessage', () => {
  it('traduz 401 em mensagem especifica', () => {
    expect(getApiErrorMessage(apiError(401))).toBe('Sessao expirada. Faca login novamente.');
  });

  it('inclui referencia controlada em 500', () => {
    expect(getApiErrorMessage(apiError(500, 'Erro interno do servidor', 'abc-123'))).toBe(
      'Falha inesperada no servidor. Referencia: abc-123.',
    );
  });
});
