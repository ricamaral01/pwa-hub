import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  senhaAtual!: string;

  @IsString()
  @MinLength(12, { message: 'A nova senha deve ter pelo menos 12 caracteres' })
  novaSenha!: string;
}
