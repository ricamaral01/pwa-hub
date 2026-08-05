import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireAdminPermission } from '../auth/require-admin-permission.decorator';
import {
  BiometriaService,
  type FaceEnrollmentPayload,
  type FaceLoginPayload,
} from './biometria.service';

@Controller()
export class BiometriaController {
  constructor(private readonly biometriaService: BiometriaService) {}

  @Get('biometrics/face/readiness')
  readiness() {
    return this.biometriaService.readiness();
  }

  @Post('employees/:id/face-enrollment/start')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.cadastrar')
  start(@Param('id') id: string) {
    return this.biometriaService.startEnrollment(id);
  }

  @Post('employees/:id/face-enrollment/complete')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.cadastrar')
  complete(@Param('id') id: string, @Body() body: FaceEnrollmentPayload) {
    return this.biometriaService.completeEnrollment(id, body);
  }

  @Post('employees/:id/face-enrollment/test')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.testar')
  test(@Param('id') id: string, @Body() body: FaceEnrollmentPayload) {
    return this.biometriaService.completeEnrollment(id, body);
  }

  @Post('employees/:id/face-enrollment/revoke')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.revogar')
  revoke(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return this.biometriaService.revoke(id, body?.motivo);
  }

  @Delete('employees/:id/face-enrollment')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.excluir')
  remove(@Param('id') id: string) {
    return this.biometriaService.remove(id);
  }

  @Get('employees/:id/face-enrollment/status')
  @UseGuards(JwtAuthGuard, AdminPermissionGuard)
  @RequireAdminPermission('biometria.consultar')
  status(@Param('id') id: string) {
    return this.biometriaService.status(id);
  }

  @Post('auth/operator-face/challenge')
  challenge(@Body() body: { dispositivoId: string }) {
    return this.biometriaService.challenge(body);
  }

  @Post('auth/operator-face-login')
  login(@Body() body: FaceLoginPayload, @Req() req: Request) {
    return this.biometriaService.faceLogin({ ...body, ip: req.ip });
  }
}
