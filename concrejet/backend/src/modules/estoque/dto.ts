import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class StockEntryDto {
  @IsUUID()
  loteId!: string;

  @IsNumber()
  @Min(0.001)
  quantidadeKg!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custoUnitarioAplicado?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class StockAdjustmentDto extends StockEntryDto {
  @IsIn(['ajuste_positivo', 'ajuste_negativo'])
  tipo!: 'ajuste_positivo' | 'ajuste_negativo';

  @IsString()
  motivo!: string;
}

export class StockReturnDto extends StockEntryDto {
  @IsString()
  motivo!: string;
}

export class ReverseMovementDto {
  @IsString()
  motivo!: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class TransferDto {
  @IsUUID()
  loteOrigemId!: string;

  @IsUUID()
  loteDestinoId!: string;

  @IsNumber()
  @Min(0.001)
  quantidadeKg!: number;

  @IsString()
  motivo!: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class BlendComponentDto {
  @IsUUID()
  loteOrigemId!: string;

  @IsNumber()
  @Min(0.001)
  quantidadeKg!: number;
}

export class CreateBlendDto {
  @IsString()
  codigo!: string;

  @IsString()
  descricao!: string;

  @IsNumber()
  @Min(0.001)
  quantidadePlanejadaKg!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => BlendComponentDto)
  componentes!: BlendComponentDto[];

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class UpdateBlendDto {
  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => BlendComponentDto)
  componentes?: BlendComponentDto[];
}

export class FinishBlendDto {
  @IsNumber()
  @Min(0.001)
  quantidadeResultanteKg!: number;

  @IsUUID()
  loteResultanteId!: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class CancelBlendDto {
  @IsString()
  motivoCancelamento!: string;

  @IsUUID()
  idempotencyKey!: string;
}

export class AnalyticsQueryDto {
  @IsDateString()
  inicio!: string;

  @IsDateString()
  fim!: string;
}
