import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';

function buildUsuario(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    empresaId: 'empresa-1',
    email: 'operador@example.com',
    senhaHash: 'hash-armazenado',
    deveTrocarSenha: false,
    tentativasLogin: 0,
    bloqueadoAte: null as Date | null,
    ultimoLoginEm: null as Date | null,
    ativo: true,
    perfis: [{ codigo: 'ADMIN' }],
    ...overrides,
  };
}

describe('AuthService', () => {
  let usuario: ReturnType<typeof buildUsuario>;
  let queryBuilder: {
    addSelect: jest.Mock;
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };
  let usuarioRepository: { createQueryBuilder: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let passwordService: { verify: jest.Mock; hash: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let auditoriaService: { registrar: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usuario = buildUsuario();

    queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(usuario),
    };

    usuarioRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    passwordService = { verify: jest.fn(), hash: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('token-jwt') };
    configService = {
      get: jest.fn((key: string, fallback?: unknown) => {
        const values: Record<string, unknown> = {
          AUTH_MAX_LOGIN_ATTEMPTS: 3,
          AUTH_LOCKOUT_MINUTES: 15,
        };
        return values[key] ?? fallback;
      }),
    };
    auditoriaService = { registrar: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      usuarioRepository as never,
      passwordService as unknown as PasswordService,
      jwtService as never,
      configService as never,
      auditoriaService as never,
    );
  });

  it('faz login com sucesso, zera tentativas e retorna token', async () => {
    usuario.tentativasLogin = 2;
    passwordService.verify.mockResolvedValue(true);

    const result = await service.login('operador@example.com', 'senha-correta');

    expect(result.accessToken).toBe('token-jwt');
    expect(usuario.tentativasLogin).toBe(0);
    expect(usuario.bloqueadoAte).toBeNull();
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ perfis: ['ADMIN'] }),
    );
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ entidade: 'usuario', acao: 'UPDATE' }),
    );
  });

  it('rejeita com mensagem genérica quando o usuário não existe', async () => {
    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.login('inexistente@example.com', 'qualquer')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('bloqueia o usuário após atingir o número máximo de tentativas inválidas', async () => {
    usuario.tentativasLogin = 2; // próxima tentativa inválida atinge o limite de 3
    passwordService.verify.mockResolvedValue(false);

    await expect(service.login('operador@example.com', 'senha-errada')).rejects.toThrow(
      UnauthorizedException,
    );

    expect(usuario.tentativasLogin).toBe(0);
    expect(usuario.bloqueadoAte).not.toBeNull();
  });

  it('rejeita login de usuário já bloqueado mesmo com senha correta', async () => {
    usuario.bloqueadoAte = new Date(Date.now() + 60_000);

    await expect(service.login('operador@example.com', 'senha-correta')).rejects.toThrow(
      ForbiddenException,
    );
    expect(passwordService.verify).not.toHaveBeenCalled();
  });
});
