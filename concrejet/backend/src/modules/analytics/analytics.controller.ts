import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.overview(user, query);
  }

  @Get('production')
  production(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.production(user, query);
  }

  @Get('losses')
  losses(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.losses(user, query);
  }

  @Get('cycles')
  cycles(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.cycles(user, query);
  }

  @Get('stops')
  stops(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.stops(user, query);
  }

  @Get('stock')
  stock(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.stock(user, query);
  }

  @Get('traceability')
  traceability(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.traceability(user, query);
  }

  @Get('oee')
  oee(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.analytics.oee(user, query);
  }

  @Get('oee/memory')
  async oeeMemory(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return (await this.analytics.oee(user, query)).memoria;
  }

  @Get('refresh-status')
  refreshStatus() {
    return this.analytics.refreshStatus();
  }

  @Get('production/export.csv')
  exportProduction(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analytics.exportCsv(user, query);
  }
}
