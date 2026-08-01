import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  CalculateProductionRecordDto,
  CancelProductionRecordDto,
  CreateProductionRecordDto,
  FinishProductionRecordDto,
  UpdateProductionRecordDto,
} from './dto';
import { ProductionCalculationService } from './production-calculation.service';
import { ProductionRecordsService } from './production-records.service';

@Controller('production-records')
@UseGuards(JwtAuthGuard)
export class ProductionRecordsController {
  constructor(
    private readonly records: ProductionRecordsService,
    private readonly calculations: ProductionCalculationService,
  ) {}

  @Post()
  create(
    @Body() body: CreateProductionRecordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.records.create(body, user, req.correlationId);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, unknown>) {
    return this.records.list(user, query);
  }

  @Get('current-by-device')
  currentByDevice(@CurrentUser() user: AuthenticatedUser, @Query('dispositivoId') dispositivoId: string) {
    return this.records.currentByDevice(dispositivoId, user);
  }

  @Post('calculate')
  calculate(@Body() body: CalculateProductionRecordDto) {
    return this.calculations.calculate(body);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.records.get(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductionRecordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.records.update(id, body, user, req.correlationId);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.records.get(id, user);
  }

  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @Body() body: FinishProductionRecordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.records.finish(id, body, user, req.correlationId);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelProductionRecordDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.records.cancel(id, body, user, req.correlationId);
  }
}
