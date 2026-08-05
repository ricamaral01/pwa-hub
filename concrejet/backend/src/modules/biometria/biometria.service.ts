import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Colaborador } from '../cadastros/entities';
import { Unidade } from '../organizacao/entities/unidade.entity';
import { Dispositivo } from '../producao-base/entities/dispositivo.entity';
import { AuthService, OperatorLoginResult } from '../auth/auth.service';
import { BiometriaEvento, BiometriaFacial } from './entities';

type ChallengeStep = 'blink' | 'turn_left' | 'turn_right' | 'move_closer';
type FaceResult =
  'confirmado' | 'nao_confirmado' | 'ambiguo' | 'baixa_qualidade' | 'prova_presenca_invalida';

interface ChallengeState {
  id: string;
  dispositivoId: string;
  unidadeId: string;
  empresaId: string;
  maquinaId: string;
  steps: ChallengeStep[];
  expiraEm: Date;
  usado: boolean;
}

export interface FacePayload {
  dispositivoId: string;
  unidadeId?: string;
  embedding?: number[];
  qualidade?: number;
  liveness?: { valid: boolean; steps: ChallengeStep[]; frames: number; faces: number };
  model?: { nome: string; versao: string; dimensao: number };
}

export type FaceEnrollmentPayload = FacePayload & { samples?: number[][] };
export type FaceLoginPayload = FacePayload & { challengeId: string; ip?: string };

const challenges = new Map<string, ChallengeState>();
export const FACE_EMBEDDING_DIMENSION = 128;
export const FACE_MODEL_NAME = 'opencv_sface';
export const FACE_MODEL_VERSION = '2021dec-int8bq';

@Injectable()
export class BiometriaService {
  constructor(
    @InjectRepository(BiometriaFacial)
    private readonly biometriaRepository: Repository<BiometriaFacial>,
    @InjectRepository(BiometriaEvento)
    private readonly eventoRepository: Repository<BiometriaEvento>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
  ) {}

  async readiness() {
    const enabled = this.configService.get<boolean>('FACIAL_AUTH_ENABLED', false);
    const reasons: string[] = [];
    const encryptionReady = Boolean(this.getKey());
    const governanceReady = this.configService.get<boolean>(
      'BIOMETRIC_GOVERNANCE_CONFIGURED',
      false,
    );
    const database = await this.databaseReadiness();
    const permissionsReady = await this.permissionsReadiness();
    const model = this.modelConfig();
    const modelReady = Boolean(model.nome && model.versao && model.threshold > 0);

    if (!enabled) reasons.push('feature_flag_desativada');
    if (!encryptionReady) reasons.push('chave_criptografia_ausente');
    if (!governanceReady) {
      reasons.push('governanca_incompleta');
    }
    if (!database.ready) reasons.push(...database.reasons);
    if (!permissionsReady) reasons.push('permissoes_biometricas_ausentes');
    if (!modelReady) reasons.push('modelo_biometrico_incompleto');

    return {
      enabled,
      available: enabled && reasons.length === 0,
      httpsReady: null,
      encryptionReady,
      modelReady,
      governanceReady,
      databaseReady: database.ready,
      permissionsReady,
      cameraSupported: null,
      reasons,
      model,
    };
  }

  async startEnrollment(colaboradorId: string) {
    this.assertAvailable();
    const colaborador = await this.getColaborador(colaboradorId);
    return {
      enrollmentId: randomUUID(),
      colaborador: { id: colaborador.id, nome: colaborador.nome, matricula: colaborador.matricula },
      finalidade: 'login_operacional',
      requiredSamples: 5,
      sequence: ['frontal', 'turn_left', 'turn_right', 'blink', 'move_closer'],
      model: this.modelConfig(),
    };
  }

  async completeEnrollment(colaboradorId: string, body: FaceEnrollmentPayload) {
    this.assertAvailable();
    const colaborador = await this.getColaborador(colaboradorId);
    const unidade = await this.resolveEnrollmentUnit(colaborador.empresaId, body.unidadeId);
    const samples = body.samples?.length ? body.samples : body.embedding ? [body.embedding] : [];
    this.assertModel(body);
    if (samples.length < 5 || samples.length > 7)
      throw new UnprocessableEntityException('amostras_invalidas');
    const qualidade = body.qualidade ?? 0;
    const config = this.modelConfig();
    if (qualidade < config.qualidadeMinima)
      throw new UnprocessableEntityException('baixa_qualidade');
    const embedding = normalize(average(samples.map(normalize)));
    if (!consistent(samples.map(normalize), embedding))
      throw new UnprocessableEntityException('amostras_divergentes');
    const encrypted = this.encrypt(JSON.stringify({ embedding, model: config }));
    await this.biometriaRepository.update(
      { colaboradorId, ativa: true },
      { ativa: false, revogadaEm: new Date(), motivoRevogacao: 'substituida' },
    );
    const entity = this.biometriaRepository.create({
      empresaId: colaborador.empresaId,
      unidadeId: unidade.id,
      colaboradorId,
      modeloNome: config.nome,
      modeloVersao: config.versao,
      templateCriptografado: encrypted.data,
      templateIv: encrypted.iv,
      templateAuthTag: encrypted.authTag,
      qualidade: qualidade.toFixed(4),
      thresholdAplicado: config.threshold.toFixed(4),
      ativa: true,
      emitidaEm: new Date(),
    });
    await this.biometriaRepository.save(entity);
    await this.log(
      entity.empresaId,
      entity.unidadeId,
      colaboradorId,
      null,
      null,
      'enrollment',
      'confirmado',
    );
    return { status: 'ok', biometriaId: entity.id };
  }

  async status(colaboradorId: string) {
    const colaborador = await this.getColaborador(colaboradorId);
    const unidade = await this.resolveDefaultUnit(colaborador.empresaId);
    const latest = await this.biometriaRepository.findOne({
      where: { colaboradorId },
      order: { emitidaEm: 'DESC' },
    });
    const compatibility = latest ? this.readTemplateCompatibility(latest) : null;
    const situacao = this.statusSituation(latest, compatibility);
    const events = await this.eventoRepository.find({
      where: { colaboradorId },
      order: { criadoEm: 'DESC' },
      take: 8,
    });
    return {
      ativa: Boolean(latest?.ativa && situacao === 'ativa'),
      situacao,
      compatibilidade: compatibility?.compatibilidade ?? 'sem_cadastro',
      mensagem: compatibility?.mensagem ?? null,
      dimensaoEmbedding: compatibility?.dimensao ?? null,
      modeloNome: latest?.modeloNome ?? null,
      modeloVersao: latest?.modeloVersao ?? null,
      qualidade: latest?.qualidade ?? null,
      ultimaUtilizacaoEm: latest?.ultimaUtilizacaoEm ?? null,
      emitidaEm: latest?.emitidaEm ?? null,
      revogadaEm: latest?.revogadaEm ?? null,
      motivoRevogacao: latest?.motivoRevogacao ?? null,
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome,
        matricula: colaborador.matricula,
        ativo: colaborador.ativo,
        unidadeId: unidade?.id ?? null,
        unidadeCodigo: unidade?.codigo ?? null,
        unidadeNome: unidade?.nome ?? null,
        unidadeVinculada: Boolean(unidade),
      },
      auditoria: events.map((event) => ({
        id: event.id,
        tipoEvento: event.tipoEvento,
        resultado: event.resultado,
        criadoEm: event.criadoEm,
        similaridade: event.similaridade,
      })),
    };
  }

  async revoke(colaboradorId: string, motivo = 'revogada') {
    await this.biometriaRepository.update(
      { colaboradorId, ativa: true },
      { ativa: false, revogadaEm: new Date(), motivoRevogacao: motivo },
    );
    return { status: 'ok' };
  }

  async remove(colaboradorId: string) {
    await this.biometriaRepository.delete({ colaboradorId });
    return { status: 'ok' };
  }

  async challenge(body: { dispositivoId: string }) {
    this.assertAvailable();
    const dispositivo = await this.getDispositivo(body.dispositivoId);
    const maquina = dispositivo.maquina;
    if (!maquina || !dispositivo.maquinaId) throw new BadRequestException('dispositivo_invalido');
    const steps = shuffle<ChallengeStep>(['blink', 'turn_left', 'turn_right', 'move_closer']).slice(
      0,
      2,
    );
    const challenge: ChallengeState = {
      id: randomUUID(),
      dispositivoId: dispositivo.id,
      unidadeId: maquina.unidadeId,
      empresaId: maquina.unidade.empresaId,
      maquinaId: dispositivo.maquinaId,
      steps,
      expiraEm: new Date(Date.now() + 60_000),
      usado: false,
    };
    challenges.set(challenge.id, challenge);
    return {
      challengeId: challenge.id,
      expiresAt: challenge.expiraEm.toISOString(),
      sequence: steps,
    };
  }

  async faceLogin(
    body: FaceLoginPayload,
  ): Promise<OperatorLoginResult & { resultado: FaceResult }> {
    this.assertAvailable();
    const challenge = challenges.get(body.challengeId);
    if (!challenge || challenge.usado || challenge.expiraEm.getTime() < Date.now()) {
      throw new UnauthorizedException('challenge_invalido');
    }
    challenge.usado = true;
    await this.registerAttempt(challenge, body.ip ?? '');
    this.assertModel(body);
    this.validateCapture(body, challenge.steps);
    const config = this.modelConfig();
    const candidates = await this.loadCandidates(challenge.empresaId, challenge.unidadeId);
    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        similarity: cosine(normalize(body.embedding ?? []), candidate.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);
    const first = ranked[0];
    const second = ranked[1];
    if (!first || first.similarity < config.threshold) {
      await this.log(
        challenge.empresaId,
        challenge.unidadeId,
        null,
        challenge.dispositivoId,
        challenge.maquinaId,
        'login',
        'nao_confirmado',
      );
      throw new UnauthorizedException('identificacao_nao_confirmada');
    }
    if (second && first.similarity - second.similarity < config.margemMinima) {
      await this.log(
        challenge.empresaId,
        challenge.unidadeId,
        null,
        challenge.dispositivoId,
        challenge.maquinaId,
        'login',
        'ambiguo',
        first.similarity,
      );
      throw new ConflictException('resultado_ambiguo');
    }
    first.record.ultimaUtilizacaoEm = new Date();
    await this.biometriaRepository.save(first.record);
    await this.log(
      challenge.empresaId,
      challenge.unidadeId,
      first.colaborador.id,
      challenge.dispositivoId,
      challenge.maquinaId,
      'login',
      'confirmado',
      first.similarity,
    );
    const session = this.authService.createOperatorSession(
      first.colaborador.id,
      challenge.dispositivoId,
    );
    return {
      resultado: 'confirmado',
      token: session.token,
      expiraEm: session.expiraEm.toISOString(),
      operador: {
        id: first.colaborador.id,
        matricula: first.colaborador.matricula,
        nome: first.colaborador.nome,
      },
      dispositivo: { id: challenge.dispositivoId, maquinaId: challenge.maquinaId },
    };
  }

  private validateCapture(body: FacePayload, steps: ChallengeStep[]) {
    if (!body.embedding?.length) throw new UnprocessableEntityException('captura_invalida');
    if ((body.qualidade ?? 0) < this.modelConfig().qualidadeMinima)
      throw new UnprocessableEntityException('baixa_qualidade');
    if (!body.liveness?.valid || body.liveness.frames < 3 || body.liveness.faces !== 1)
      throw new BadRequestException('prova_presenca_invalida');
    if (!steps.every((step) => body.liveness?.steps.includes(step)))
      throw new BadRequestException('prova_presenca_invalida');
  }

  private async loadCandidates(empresaId: string, unidadeId: string) {
    const config = this.modelConfig();
    const records = await this.biometriaRepository.find({
      where: {
        empresaId,
        unidadeId,
        ativa: true,
        modeloNome: config.nome,
        modeloVersao: config.versao,
      },
      relations: ['colaborador'],
    });
    return records
      .filter((record) => record.colaborador?.ativo)
      .map((record) => ({
        record,
        colaborador: record.colaborador,
        embedding: JSON.parse(this.decrypt(record)).embedding as number[],
      }));
  }

  private async getColaborador(id: string) {
    const colaborador = await this.dataSource
      .getRepository(Colaborador)
      .findOne({ where: { id, ativo: true } });
    if (!colaborador) throw new NotFoundException('colaborador_inacessivel');
    return colaborador;
  }

  private async getDispositivo(id: string) {
    const dispositivo = await this.dataSource
      .getRepository(Dispositivo)
      .findOne({ where: { id, ativo: true }, relations: ['maquina', 'maquina.unidade'] });
    if (!dispositivo?.maquinaId || !dispositivo.maquina)
      throw new BadRequestException('dispositivo_invalido');
    return dispositivo;
  }

  private assertAvailable() {
    const enabled = this.configService.get<boolean>('FACIAL_AUTH_ENABLED', false);
    if (
      !enabled ||
      !this.getKey() ||
      !this.configService.get<boolean>('BIOMETRIC_GOVERNANCE_CONFIGURED', false)
    ) {
      throw new ServiceUnavailableException('biometria_desativada_ou_sem_governanca');
    }
  }

  private async databaseReadiness(): Promise<{ ready: boolean; reasons: string[] }> {
    const requiredTables = ['biometria_facial', 'biometria_evento', 'biometria_tentativa'];
    const rows = (await this.dataSource.query(
      `
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1)
      `,
      [requiredTables],
    )) as Array<{ table_name: string }>;
    const found = new Set(rows.map((row) => row.table_name));
    const missing = requiredTables.filter((table) => !found.has(table));
    return {
      ready: missing.length === 0,
      reasons: missing.map((table) => `tabela_${table}_ausente`),
    };
  }

  private async permissionsReadiness(): Promise<boolean> {
    const requiredPermissions = [
      'biometria.consultar',
      'biometria.cadastrar',
      'biometria.testar',
      'biometria.revogar',
      'biometria.excluir',
      'operadores.autenticar_face',
    ];
    const rows = (await this.dataSource.query(
      `
        select chave
        from permissao
        where chave = any($1)
      `,
      [requiredPermissions],
    )) as Array<{ chave: string }>;
    const found = new Set(rows.map((row) => row.chave));
    return requiredPermissions.every((permission) => found.has(permission));
  }

  private modelConfig() {
    return {
      nome: this.configService.get<string>('BIOMETRIC_MODEL_NAME', FACE_MODEL_NAME),
      versao: this.configService.get<string>('BIOMETRIC_MODEL_VERSION', FACE_MODEL_VERSION),
      dimensao: FACE_EMBEDDING_DIMENSION,
      metrica: 'cosine',
      threshold: this.configService.get<number>('BIOMETRIC_THRESHOLD', 0.363),
      margemMinima: this.configService.get<number>('BIOMETRIC_MIN_MARGIN', 0.05),
      qualidadeMinima: this.configService.get<number>('BIOMETRIC_MIN_QUALITY', 0.6),
    };
  }

  private assertModel(body: FaceEnrollmentPayload) {
    const config = this.modelConfig();
    if (!body.model || body.model.nome !== config.nome || body.model.versao !== config.versao) {
      throw new UnprocessableEntityException('modelo_incompativel');
    }
    const embeddingLength = body.embedding?.length ?? body.samples?.[0]?.length;
    if (body.model.dimensao !== config.dimensao || embeddingLength !== config.dimensao) {
      throw new UnprocessableEntityException('dimensao_incompativel');
    }
  }

  private async resolveDefaultUnit(empresaId: string) {
    return this.dataSource
      .getRepository(Unidade)
      .findOne({ where: { empresaId, ativo: true }, order: { criadoEm: 'ASC' } });
  }

  private async resolveEnrollmentUnit(empresaId: string, unidadeId?: string) {
    if (!unidadeId) throw new BadRequestException('unidade_ausente');
    const unidade = await this.dataSource
      .getRepository(Unidade)
      .findOne({ where: { id: unidadeId, empresaId, ativo: true } });
    if (!unidade) throw new BadRequestException('unidade_ausente');
    return unidade;
  }

  private readTemplateCompatibility(record: BiometriaFacial) {
    const config = this.modelConfig();
    const incompatibleMessage =
      'Esta biometria foi cadastrada com uma versao anterior do modelo facial. Faca um novo cadastro.';
    if (record.modeloNome !== config.nome || record.modeloVersao !== config.versao) {
      return {
        compatibilidade: 'modelo_incompativel',
        dimensao: null,
        mensagem: incompatibleMessage,
      };
    }
    try {
      const payload = JSON.parse(this.decrypt(record)) as { embedding?: number[] };
      const dimensao = payload.embedding?.length ?? 0;
      if (dimensao !== config.dimensao) {
        return {
          compatibilidade: 'dimensao_incompativel',
          dimensao,
          mensagem: incompatibleMessage,
        };
      }
      return { compatibilidade: 'compativel', dimensao, mensagem: null };
    } catch {
      return {
        compatibilidade: 'template_invalido',
        dimensao: null,
        mensagem: incompatibleMessage,
      };
    }
  }

  private statusSituation(
    record: BiometriaFacial | null,
    compatibility: { compatibilidade: string } | null,
  ) {
    if (!record) return 'nao_cadastrada';
    if (!record.ativa) return record.revogadaEm ? 'revogada' : 'bloqueada';
    if (compatibility?.compatibilidade !== 'compativel') return 'incompativel';
    return 'ativa';
  }

  private async registerAttempt(challenge: ChallengeState, ip: string) {
    const max = this.configService.get<number>('BIOMETRIC_MAX_ATTEMPTS', 10);
    const lockout = this.configService.get<number>('BIOMETRIC_LOCKOUT_MINUTES', 15);
    const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000);
    const rows = await this.dataSource.query(
      `
        insert into biometria_tentativa (empresa_id, unidade_id, dispositivo_id, ip, janela_inicio, tentativas)
        values ($1, $2, $3, $4, $5, 1)
        on conflict (empresa_id, unidade_id, dispositivo_id, ip, janela_inicio)
        do update set tentativas = biometria_tentativa.tentativas + 1,
          atualizado_em = now(),
          bloqueado_ate = case
            when biometria_tentativa.tentativas + 1 >= $6 then now() + ($7 || ' minutes')::interval
            else biometria_tentativa.bloqueado_ate
          end
        returning tentativas, bloqueado_ate
      `,
      [
        challenge.empresaId,
        challenge.unidadeId,
        challenge.dispositivoId,
        ip,
        windowStart,
        max,
        lockout,
      ],
    );
    const row = rows[0];
    if (row?.bloqueado_ate && new Date(row.bloqueado_ate).getTime() > Date.now()) {
      await this.log(
        challenge.empresaId,
        challenge.unidadeId,
        null,
        challenge.dispositivoId,
        challenge.maquinaId,
        'tentativa',
        'bloqueado',
      );
      throw new HttpException('excesso_tentativas', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private getKey(): Buffer | null {
    const raw = this.configService.get<string>('BIOMETRIC_ENCRYPTION_KEY');
    if (!raw) return null;
    const decoded = Buffer.from(raw, 'base64');
    return decoded.length === 32 ? decoded : null;
  }

  private encrypt(plain: string) {
    const key = this.getKey();
    if (!key) throw new ServiceUnavailableException('chave_criptografia_ausente');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return { data, iv, authTag: cipher.getAuthTag() };
  }

  private decrypt(record: BiometriaFacial) {
    const key = this.getKey();
    if (!key) throw new ServiceUnavailableException('chave_criptografia_ausente');
    const decipher = createDecipheriv('aes-256-gcm', key, record.templateIv);
    decipher.setAuthTag(record.templateAuthTag);
    return Buffer.concat([
      decipher.update(record.templateCriptografado),
      decipher.final(),
    ]).toString('utf8');
  }

  private async log(
    empresaId: string,
    unidadeId: string,
    colaboradorId: string | null,
    dispositivoId: string | null,
    maquinaId: string | null,
    tipoEvento: string,
    resultado: string,
    similaridade?: number,
  ) {
    await this.eventoRepository.save(
      this.eventoRepository.create({
        empresaId,
        unidadeId,
        colaboradorId,
        dispositivoId,
        maquinaId,
        tipoEvento,
        resultado,
        similaridade: similaridade?.toFixed(4),
      }),
    );
  }
}

function average(samples: number[][]): number[] {
  return samples[0].map(
    (_, index) => samples.reduce((sum, sample) => sum + (sample[index] ?? 0), 0) / samples.length,
  );
}

function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return magnitude ? values.map((value) => value / magnitude) : values;
}

function consistent(samples: number[][], centroid: number[]): boolean {
  return samples.every((sample) => cosine(sample, centroid) >= 0.72);
}

function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const ma = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const mb = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return ma && mb ? dot / (ma * mb) : 0;
}

function shuffle<T>(items: T[]): T[] {
  return items
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.value);
}
