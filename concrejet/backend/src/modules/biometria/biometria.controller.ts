import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BiometriaService } from './biometria.service';

@Controller()
export class BiometriaController {
  constructor(private readonly biometriaService: BiometriaService) {}

  @Get('biometrics/face/readiness')
  readiness() {
    return this.biometriaService.readiness();
  }

  @Post('employees/:id/face-enrollment/start')
  start(@Param('id') id: string) {
    return this.biometriaService.startEnrollment(id);
  }

  @Post('employees/:id/face-enrollment/complete')
  complete(@Param('id') id: string, @Body() body: any) {
    return this.biometriaService.completeEnrollment(id, body);
  }

  @Post('employees/:id/face-enrollment/test')
  test(@Param('id') id: string, @Body() body: any) {
    return this.biometriaService.completeEnrollment(id, body);
  }

  @Post('employees/:id/face-enrollment/revoke')
  revoke(@Param('id') id: string, @Body() body: { motivo?: string }) {
    return this.biometriaService.revoke(id, body?.motivo);
  }

  @Delete('employees/:id/face-enrollment')
  remove(@Param('id') id: string) {
    return this.biometriaService.remove(id);
  }

  @Get('employees/:id/face-enrollment/status')
  status(@Param('id') id: string) {
    return this.biometriaService.status(id);
  }

  @Post('auth/operator-face/challenge')
  challenge(@Body() body: { dispositivoId: string }) {
    return this.biometriaService.challenge(body);
  }

  @Post('auth/operator-face-login')
  login(@Body() body: any) {
    return this.biometriaService.faceLogin(body);
  }
}
