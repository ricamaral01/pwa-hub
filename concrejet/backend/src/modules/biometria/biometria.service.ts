import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { Colaborador } from '../cadastros/entities';
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

interface FacePayload {
  dispositivoId: string;
  unidadeId?: string;
  embedding?: number[];
  qualidade?: number;
  liveness?: { valid: boolean; steps: ChallengeStep[]; frames: number; faces: number };
}

const challenges = new Map<string, ChallengeState>();
const attempts = new Map<string, { count: number; resetAt: number }>();
const MODEL = { nome: 'SyntheticFaceEmbedding', versao: 'dev-1.0' };
const THRESHOLD = 0.82;
const MARGIN = 0.04;

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

  readiness(): { enabled: boolean; available: boolean; reasons: string[]; model: typeof MODEL } {
    const enabled = this.configService.get<boolean>('FACIAL_AUTH_ENABLED', false);
    const reasons: string[] = [];
    if (!enabled) reasons.push('feature_flag_desativada');
    if (!this.getKey()) reasons.push('chave_criptografia_ausente');
    if (!this.configService.get<boolean>('BIOMETRIC_GOVERNANCE_CONFIGURED', false)) {
      reasons.push('governanca_incompleta');
    }
    return { enabled, available: enabled && reasons.length === 0, reasons, model: MODEL };
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
      model: MODEL,
    };
  }

  async completeEnrollment(colaboradorId: string, body: FacePayload & { samples?: number[][] }) {
    this.assertAvailable();
    const colaborador = await this.getColaborador(colaboradorId);
    const samples = body.samples?.length ? body.samples : body.embedding ? [body.embedding] : [];
    if (samples.length < 1) throw new UnprocessableEntityException('Captura invalida.');
    const qualidade = body.qualidade ?? 0;
    if (qualidade < 0.55) throw new UnprocessableEntityException('baixa_qualidade');
    const embedding = average(samples);
    const encrypted = this.encrypt(JSON.stringify({ embedding }));
    await this.biometriaRepository.update(
      { colaboradorId, ativa: true },
      { ativa: false, revogadaEm: new Date(), motivoRevogacao: 'substituida' },
    );
    const entity = this.biometriaRepository.create({
      empresaId: colaborador.empresaId,
      unidadeId: body.unidadeId ?? colaborador.empresaId,
      colaboradorId,
      modeloNome: MODEL.nome,
      modeloVersao: MODEL.versao,
      templateCriptografado: encrypted.data,
      templateIv: encrypted.iv,
      templateAuthTag: encrypted.authTag,
      qualidade: qualidade.toFixed(4),
      thresholdAplicado: THRESHOLD.toFixed(4),
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
    const active = await this.biometriaRepository.findOne({
      where: { colaboradorId, ativa: true },
    });
    return {
      ativa: Boolean(active),
      modeloNome: active?.modeloNome ?? null,
      modeloVersao: active?.modeloVersao ?? null,
      qualidade: active?.qualidade ?? null,
      ultimaUtilizacaoEm: active?.ultimaUtilizacaoEm ?? null,
      emitidaEm: active?.emitidaEm ?? null,
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
    body: FacePayload & { challengeId: string },
  ): Promise<OperatorLoginResult & { resultado: FaceResult }> {
    this.assertAvailable();
    const challenge = challenges.get(body.challengeId);
    if (!challenge || challenge.usado || challenge.expiraEm.getTime() < Date.now()) {
      throw new UnauthorizedException('challenge_invalido');
    }
    challenge.usado = true;
    const key = `${challenge.dispositivoId}:${new Date().toISOString().slice(0, 13)}`;
    const current = attempts.get(key) ?? { count: 0, resetAt: Date.now() + 60 * 60_000 };
    if (current.count >= 10 && current.resetAt > Date.now())
      throw new ForbiddenException('excesso_tentativas');
    attempts.set(key, { count: current.count + 1, resetAt: current.resetAt });
    this.validateCapture(body, challenge.steps);
    const candidates = await this.loadCandidates(challenge.empresaId, challenge.unidadeId);
    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        similarity: cosine(body.embedding ?? [], candidate.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);
    const first = ranked[0];
    const second = ranked[1];
    if (!first || first.similarity < THRESHOLD) {
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
    if (second && first.similarity - second.similarity < MARGIN) {
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
    if ((body.qualidade ?? 0) < 0.55) throw new UnprocessableEntityException('baixa_qualidade');
    if (!body.liveness?.valid || body.liveness.frames < 3 || body.liveness.faces !== 1)
      throw new BadRequestException('prova_presenca_invalida');
    if (!steps.every((step) => body.liveness?.steps.includes(step)))
      throw new BadRequestException('prova_presenca_invalida');
  }

  private async loadCandidates(empresaId: string, unidadeId: string) {
    const records = await this.biometriaRepository.find({
      where: { empresaId, unidadeId, ativa: true },
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
    if (!colaborador) throw new ForbiddenException('colaborador_invalido');
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
    if (!this.readiness().available)
      throw new ServiceUnavailableException('biometria_desativada_ou_sem_governanca');
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
