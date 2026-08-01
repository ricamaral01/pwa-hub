import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('gera um hash argon2id verificável com a senha correta', async () => {
    const hash = await service.hash('SenhaForte123!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(service.verify(hash, 'SenhaForte123!')).resolves.toBe(true);
  });

  it('rejeita a verificação com senha incorreta', async () => {
    const hash = await service.hash('SenhaForte123!');
    await expect(service.verify(hash, 'senha-errada')).resolves.toBe(false);
  });

  it('não lança exceção para hash inválido, apenas retorna false', async () => {
    await expect(service.verify('hash-invalido', 'qualquer-coisa')).resolves.toBe(false);
  });
});
