import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOccurrenceDto {
  @IsUUID()
  apontamentoId!: string;

  @IsUUID()
  tipoOcorrenciaId!: string;

  @IsIn(['produtiva', 'nao_produtiva'])
  classificacao!: 'produtiva' | 'nao_produtiva';

  @IsIn(['programada', 'nao_programada'])
  programacao!: 'programada' | 'nao_programada';

  @IsOptional()
  @IsBoolean()
  entraCalculoOee?: boolean;

  @IsOptional()
  @IsDateString()
  inicioEm?: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsString()
  causa?: string;

  @IsOptional()
  @IsString()
  acaoCorretiva?: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class UpdateOccurrenceDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  causa?: string;

  @IsOptional()
  @IsString()
  acaoCorretiva?: string;

  @IsInt()
  @Min(1)
  version!: number;
}

export class FinishOccurrenceDto extends UpdateOccurrenceDto {
  @IsOptional()
  @IsDateString()
  fimEm?: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class CancelOccurrenceDto {
  @IsString()
  motivoCancelamento!: string;

  @IsInt()
  @Min(1)
  version!: number;

  @IsUUID()
  idempotencyKey!: string;
}

export class ApproveOccurrenceDto {
  @IsInt()
  @Min(1)
  version!: number;
}
