import { IsString, Length } from 'class-validator';

export class OperatorLoginDto {
  @IsString()
  matricula!: string;

  @IsString()
  @Length(4, 12)
  pin!: string;

  @IsString()
  dispositivoId!: string;
}

export class OperatorTokenDto {
  @IsString()
  token!: string;
}
