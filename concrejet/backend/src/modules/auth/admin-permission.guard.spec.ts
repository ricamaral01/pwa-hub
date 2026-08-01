import { ForbiddenException } from '@nestjs/common';
import { AdminPermissionGuard } from './admin-permission.guard';
import { ADMIN_PERMISSION_KEY } from './require-admin-permission.decorator';

describe('AdminPermissionGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const dataSource = {
    query: jest.fn(),
  };

  function context(user?: unknown) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as never;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue('estoque.consultar');
  });

  it('libera quando o usuario possui a permissao requerida', async () => {
    dataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    const guard = new AdminPermissionGuard(reflector as never, dataSource as never);

    await expect(
      guard.canActivate(context({ sub: 'user-id', empresaId: 'empresa-id' })),
    ).resolves.toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ADMIN_PERMISSION_KEY,
      expect.any(Array),
    );
    expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [
      'user-id',
      'empresa-id',
      'estoque.consultar',
    ]);
  });

  it('retorna 403 quando a permissao falta', async () => {
    dataSource.query.mockResolvedValue([]);
    const guard = new AdminPermissionGuard(reflector as never, dataSource as never);

    await expect(
      guard.canActivate(context({ sub: 'user-id', empresaId: 'empresa-id' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
