import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../../src/app.module';
import { Empresa } from '../../src/modules/organizacao/entities/empresa.entity';
import { Unidade } from '../../src/modules/organizacao/entities/unidade.entity';
import { Usuario } from '../../src/modules/usuarios/entities/usuario.entity';

// Requer PostgreSQL de teste acessível via DATABASE_* e migrations já aplicadas
// (ver docs/implantacao.md). Este teste cria seus próprios dados, identificados por
// e-mail/CNPJ únicos por execução (timestamp), e apenas os DESATIVA ao final — nunca
// os apaga fisicamente. Excluir o usuário de teste geraria um UPDATE em cascata
// (ON DELETE SET NULL) na tabela `auditoria`, que o trigger de imutabilidade bloqueia
// de propósito (ver docs/modelo-dados.md): a arquitetura não permite apagar um
// usuário que já tenha gerado auditoria, nem para limpeza de teste.
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usuarioRepo: Repository<Usuario>;
  let empresaRepo: Repository<Empresa>;
  let empresa: Empresa;
  const email = `e2e-${Date.now()}@example.com`;
  const cnpj = `9${Date.now()}`.slice(0, 14);
  const senha = 'SenhaInicial123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usuarioRepo = moduleFixture.get(getRepositoryToken(Usuario));
    empresaRepo = moduleFixture.get<Repository<Empresa>>(getRepositoryToken(Empresa));
    const unidadeRepo = moduleFixture.get<Repository<Unidade>>(getRepositoryToken(Unidade));

    empresa = await empresaRepo.save(
      empresaRepo.create({ razaoSocial: 'Empresa E2E', cnpj, ativo: true }),
    );
    await unidadeRepo.save(
      unidadeRepo.create({
        empresaId: empresa.id,
        codigo: 'E2E',
        nome: 'Unidade E2E',
        ativo: true,
      }),
    );

    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });
    await usuarioRepo.save(
      usuarioRepo.create({
        empresaId: empresa.id,
        nome: 'Usuário E2E',
        email,
        senhaHash,
        deveTrocarSenha: true,
        ativo: true,
      }),
    );
  });

  afterAll(async () => {
    await usuarioRepo.update({ email }, { ativo: false });
    await empresaRepo.update({ id: empresa.id }, { ativo: false });
    await app.close();
  });

  it('rejeita login com senha incorreta', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, senha: 'senha-errada' });

    expect(response.status).toBe(401);
  });

  it('faz login com sucesso e indica troca de senha obrigatória', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({ email, senha });

    expect(response.status).toBe(200);
    expect(response.body.deveTrocarSenha).toBe(true);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('bloqueia o usuário após exceder o número máximo de tentativas inválidas', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, senha: 'senha-errada-repetida' });
    }

    const response = await request(app.getHttpServer()).post('/auth/login').send({ email, senha });

    expect(response.status).toBe(403);
  });

  it('rejeita acesso a /auth/me sem sessão', async () => {
    const response = await request(app.getHttpServer()).get('/auth/me');
    expect(response.status).toBe(401);
  });
});
