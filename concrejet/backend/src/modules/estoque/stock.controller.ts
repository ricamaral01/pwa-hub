import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  ReverseMovementDto,
  StockAdjustmentDto,
  StockEntryDto,
  StockReturnDto,
  TransferDto,
} from './dto';
import { StockMovementsService } from './stock-movements.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class StockController {
  constructor(private readonly stock: StockMovementsService) {}

  @Post('stock-movements/entry')
  entry(@Body() dto: StockEntryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.entry(dto, user);
  }

  @Post('stock-movements/adjustment')
  adjustment(@Body() dto: StockAdjustmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.adjustment(dto, user);
  }

  @Post('stock-movements/return')
  returnStock(@Body() dto: StockReturnDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.returnStock(dto, user);
  }

  @Post('stock-movements/transfer')
  transfer(@Body() dto: TransferDto, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.transfer(dto, user);
  }

  @Post('stock-movements/:id/reverse')
  reverse(
    @Param('id') id: string,
    @Body() dto: ReverseMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stock.reverse(id, dto, user);
  }

  @Get('stock-movements')
  list(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.list(user, query);
  }

  @Get('stock-movements/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.get(id, user);
  }

  @Get('resin-lots/:id/balance')
  balance(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.balance(id, user);
  }

  @Get('resin-lots/:id/traceability')
  traceability(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.stock.traceability(id, user);
  }

  @Get('resin-lots/available')
  available(@CurrentUser() user: AuthenticatedUser) {
    return this.stock.available(user);
  }
}
