import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductionRecordDto {
  @IsString()
  dispositivoId!: string;

  @IsUUID()
  operadorId!: string;

  @IsOptional()
  @IsUUID()
  ordemProducaoId?: string;

  @IsUUID()
  itemId!: string;

  @IsUUID()
  configuracaoItemMoldeId!: string;

  @IsUUID()
  loteResinaId!: string;

  @IsUUID()
  operacaoId!: string;

  @IsOptional()
  @IsDateString()
  inicioEm?: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class UpdateProductionRecordDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  pecasBoas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pecasRefugo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  falhaPreenchimentoQtd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  borraKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  galhoKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outrasPerdasKg?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsInt()
  @Min(1)
  version!: number;
}

export class FinishProductionRecordDto extends UpdateProductionRecordDto {
  @IsDateString()
  fimEm!: string;
}

export class CancelProductionRecordDto {
  @IsString()
  motivoCancelamento!: string;

  @IsInt()
  @Min(1)
  version!: number;
}

export class CalculateProductionRecordDto {
  @IsNumber()
  @Min(0)
  pesoPecaAplicadoG!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pecasBoas?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pecasRefugo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  falhaPreenchimentoQtd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  borraKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  galhoKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  outrasPerdasKg?: number;
}
