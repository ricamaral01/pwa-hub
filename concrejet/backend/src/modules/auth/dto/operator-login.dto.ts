import { IsString, IsUUID, Length } from 'class-validator';

export class OperatorLoginDto {
  @IsString()
  matricula!: string;

  @IsString()
  @Length(4, 12)
  pin!: string;

  @IsUUID()
  dispositivoId!: string;
}

export class OperatorTokenDto {
  @IsString()
  token!: string;
}
