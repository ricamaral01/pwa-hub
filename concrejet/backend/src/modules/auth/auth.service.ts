import { randomUUID } from 'crypto';
import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { PasswordService } from './password.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { AuthenticatedUser } from './jwt.strategy';
import { Colaborador } from '../cadastros/entities';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';

export interface LoginResult {
  accessToken: string;
  deveTrocarSenha: boolean;
}

export interface OperatorLoginResult {
  token: string;
  expiraEm: string;
  operador: { id: string; matricula: string; nome: string };
  dispositivo: { id: string; maquinaId: string };
}

const operatorSessions = new Map<string, { operadorId: string; dispositivoId: string; expiraEm: Date }>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
  ) {}

  async login(email: string, senha: string, correlationId?: string): Promise<LoginResult> {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .leftJoinAndSelect('usuario.perfis', 'perfis')
      .where('usuario.email = :email', { email })
      .andWhere('usuario.ativo = true')
      .getOne();

    // Mensagem genérica para não revelar se o e-mail existe (evita enumeração de contas).
    const credenciaisInvalidas = () => new UnauthorizedException('Credenciais inválidas');

    if (!usuario) {
      throw credenciaisInvalidas();
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte.getTime() > Date.now()) {
      throw new ForbiddenException('Usuário temporariamente bloqueado por tentativas inválidas');
    }

    const senhaValida = await this.passwordService.verify(usuario.senhaHash, senha);

    if (!senhaValida) {
      await this.registrarTentativaInvalida(usuario);
      throw credenciaisInvalidas();
    }

    usuario.tentativasLogin = 0;
    usuario.bloqueadoAte = null;
    usuario.ultimoLoginEm = new Date();
    await this.usuarioRepository.save(usuario);

    await this.auditoriaService.registrar({
      entidade: 'usuario',
      entidadeId: usuario.id,
      acao: 'UPDATE',
      usuarioId: usuario.id,
      dadosDepois: { evento: 'login_sucesso' },
      correlationId,
    });

    const perfis = (usuario.perfis ?? []).map((perfil) => perfil.codigo);
    const payload: AuthenticatedUser = {
      sub: usuario.id,
      empresaId: usuario.empresaId,
      email: usuario.email,
      perfis,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, deveTrocarSenha: usuario.deveTrocarSenha };
  }

  private async registrarTentativaInvalida(usuario: Usuario): Promise<void> {
    const maxTentativas = this.configService.get<number>('AUTH_MAX_LOGIN_ATTEMPTS', 5);
    const minutosBloqueio = this.configService.get<number>('AUTH_LOCKOUT_MINUTES', 15);

    usuario.tentativasLogin += 1;

    if (usuario.tentativasLogin >= maxTentativas) {
      usuario.bloqueadoAte = new Date(Date.now() + minutosBloqueio * 60_000);
      usuario.tentativasLogin = 0;
    }

    await this.usuarioRepository.save(usuario);
  }

  async me(userId: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['perfis'],
    });
  }

  async changePassword(
    userId: string,
    senhaAtual: string,
    novaSenha: string,
    correlationId?: string,
  ): Promise<void> {
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .where('usuario.id = :userId', { userId })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const senhaAtualValida = await this.passwordService.verify(usuario.senhaHash, senhaAtual);
    if (!senhaAtualValida) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    usuario.senhaHash = await this.passwordService.hash(novaSenha);
    usuario.deveTrocarSenha = false;
    await this.usuarioRepository.save(usuario);

    await this.auditoriaService.registrar({
      entidade: 'usuario',
      entidadeId: usuario.id,
      acao: 'UPDATE',
      usuarioId: usuario.id,
      dadosDepois: { evento: 'troca_senha' },
      correlationId,
    });
  }

  async operatorLogin(
    matricula: string,
    pin: string,
    dispositivoId: string,
    correlationId?: string,
  ): Promise<OperatorLoginResult> {
    const dispositivo = await this.dataSource.getRepository(Dispositivo).findOne({
      where: { id: dispositivoId, ativo: true },
    });
    if (!dispositivo) throw new BadRequestException('Dispositivo invalido ou inativo.');
    if (!dispositivo.maquinaId) throw new BadRequestException('Dispositivo sem maquina vinculada.');

    const colaborador = await this.dataSource
      .getRepository(Colaborador)
      .createQueryBuilder('colaborador')
      .addSelect('colaborador.pinHash')
      .where('colaborador.matricula = :matricula', { matricula })
      .andWhere('colaborador.ativo = true')
      .getOne();
    if (!colaborador) throw new UnauthorizedException('Credenciais operacionais invalidas.');
    if (!colaborador.pinHash) throw new ForbiddenException('Operador sem PIN definido.');
    if (colaborador.bloqueadoAte && colaborador.bloqueadoAte.getTime() > Date.now()) {
      throw new ForbiddenException('Operador temporariamente bloqueado.');
    }

    const pinValido = await this.passwordService.verify(colaborador.pinHash, pin);
    if (!pinValido) {
      colaborador.tentativasPin += 1;
      if (colaborador.tentativasPin >= 5) {
        colaborador.bloqueadoAte = new Date(Date.now() + 15 * 60_000);
        colaborador.tentativasPin = 0;
      }
      await this.dataSource.getRepository(Colaborador).save(colaborador);
      throw new UnauthorizedException('Credenciais operacionais invalidas.');
    }

    colaborador.tentativasPin = 0;
    colaborador.bloqueadoAte = null;
    colaborador.ultimoLoginOperacionalEm = new Date();
    await this.dataSource.getRepository(Colaborador).save(colaborador);

    const token = randomUUID();
    const expiraEm = new Date(Date.now() + 8 * 60 * 60_000);
    operatorSessions.set(token, { operadorId: colaborador.id, dispositivoId, expiraEm });

    await this.auditoriaService.registrar({
      entidade: 'colaborador',
      entidadeId: colaborador.id,
      acao: 'UPDATE',
      usuarioId: null,
      dadosDepois: { evento: 'operator_login', dispositivoId },
      correlationId,
    });

    return {
      token,
      expiraEm: expiraEm.toISOString(),
      operador: { id: colaborador.id, matricula: colaborador.matricula, nome: colaborador.nome },
      dispositivo: { id: dispositivo.id, maquinaId: dispositivo.maquinaId },
    };
  }

  operatorLogout(token: string): void {
    operatorSessions.delete(token);
  }

  restoreOperatorSession(token: string): OperatorLoginResult | null {
    const session = operatorSessions.get(token);
    if (!session || session.expiraEm.getTime() <= Date.now()) {
      if (session) operatorSessions.delete(token);
      return null;
    }
    return {
      token,
      expiraEm: session.expiraEm.toISOString(),
      operador: { id: session.operadorId, matricula: '', nome: '' },
      dispositivo: { id: session.dispositivoId, maquinaId: '' },
    };
  }
}
