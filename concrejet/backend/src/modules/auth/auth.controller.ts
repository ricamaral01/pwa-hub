import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ deveTrocarSenha: boolean }> {
    const result = await this.authService.login(dto.email, dto.senha, req.correlationId);
    this.setSessionCookie(res, result.accessToken);
    return { deveTrocarSenha: result.deveTrocarSenha };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response): { status: 'ok' } {
    const cookieName = this.configService.get<string>('JWT_COOKIE_NAME', 'concretrack_session');
    res.clearCookie(cookieName);
    return { status: 'ok' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    const usuario = await this.authService.me(user.sub);
    if (!usuario) {
      return null;
    }
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      empresaId: usuario.empresaId,
      deveTrocarSenha: usuario.deveTrocarSenha,
      perfis: (usuario.perfis ?? []).map((perfil) => perfil.codigo),
    };
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<{ status: 'ok' }> {
    await this.authService.changePassword(
      user.sub,
      dto.senhaAtual,
      dto.novaSenha,
      req.correlationId,
    );
    return { status: 'ok' };
  }

  private setSessionCookie(res: Response, token: string): void {
    const cookieName = this.configService.get<string>('JWT_COOKIE_NAME', 'concretrack_session');
    const ttlSeconds = this.configService.get<number>('JWT_ACCESS_TOKEN_TTL_SECONDS', 900);
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ttlSeconds * 1000,
      path: '/',
    });
  }
}
