import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { RequireAdminPermission } from '../auth/require-admin-permission.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  ReverseMovementDto,
  StockAdjustmentDto,
  StockEntryDto,
  StockReturnDto,
  TransferDto,
} from './dto';
import { StockMovementsService } from './stock-movements.service';

@UseGuards(JwtAuthGuard, AdminPermissionGuard)
@Controller()
export class StockController {
  constructor(private readonly stock: StockMovementsService) {}

  @Post('stock-movements/entry')
  @RequireAdminPermission('estoque.entrada')
  entry(@Body() dto: StockEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.entry(dto, user);
  }

  @Post('stock-movements/adjustment')
  @RequireAdminPermission('estoque.ajustar')
  adjustment(@Body() dto: StockAdjustmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.adjustment(dto, user);
  }

  @Post('stock-movements/return')
  @RequireAdminPermission('estoque.ajustar')
  returnStock(@Body() dto: StockReturnDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.returnStock(dto, user);
  }

  @Post('stock-movements/transfer')
  @RequireAdminPermission('estoque.transferir')
  transfer(@Body() dto: TransferDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.transfer(dto, user);
  }

  @Post('stock-movements/:id/reverse')
  @RequireAdminPermission('estoque.estornar')
  reverse(
    @Param('id') id: string,
    @Body() dto: ReverseMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stock.reverse(id, dto, user);
  }

  @Get('stock-movements')
  @RequireAdminPermission('estoque.consultar')
  list(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.list(user, query);
  }

  @Get('stock-movements/:id')
  @RequireAdminPermission('estoque.consultar')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.get(id, user);
  }

  @Get('resin-lots/:id/balance')
  @RequireAdminPermission('estoque.consultar')
  balance(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.balance(id, user);
  }

  @Get('resin-lots/:id/traceability')
  @RequireAdminPermission('estoque.rastrear')
  traceability(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.traceability(id, user);
  }

  @Get('resin-lots/available')
  @RequireAdminPermission('estoque.consultar')
  available(@CurrentUser() user: AuthenticatedUser) {
    return this.stock.available(user);
  }
}
