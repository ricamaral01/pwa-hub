import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { RequireAdminPermission } from '../auth/require-admin-permission.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, AdminPermissionGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @RequireAdminPermission('dashboard.visualizar')
  overview(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.overview(user, query);
  }

  @Get('production')
  @RequireAdminPermission('relatorios.producao')
  production(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.production(user, query);
  }

  @Get('losses')
  @RequireAdminPermission('relatorios.perdas')
  losses(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.losses(user, query);
  }

  @Get('cycles')
  @RequireAdminPermission('relatorios.producao')
  cycles(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.cycles(user, query);
  }

  @Get('stops')
  @RequireAdminPermission('relatorios.paradas')
  stops(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.stops(user, query);
  }

  @Get('stock')
  @RequireAdminPermission('relatorios.estoque')
  stock(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.stock(user, query);
  }

  @Get('traceability')
  @RequireAdminPermission('rastreabilidade.consultar')
  traceability(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.traceability(user, query);
  }

  @Get('oee')
  @RequireAdminPermission('relatorios.oee')
  oee(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.oee(user, query);
  }

  @Get('oee/memory')
  @RequireAdminPermission('relatorios.oee')
  async oeeMemory(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return (await this.analytics.oee(user, query)).memoria;
  }

  @Get('refresh-status')
  @RequireAdminPermission('analytics.atualizar')
  refreshStatus() {
    return this.analytics.refreshStatus();
  }

  @Get('production/export.csv')
  @RequireAdminPermission('relatorios.exportar')
  exportProduction(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analytics.exportCsv(user, query);
  }
}
