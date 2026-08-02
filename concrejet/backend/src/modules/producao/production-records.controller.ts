import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OperationalPermissionGuard } from '../auth/operational-permission.guard';
import { OperatorSessionGuard, type OperationalRequest } from '../auth/operator-session.guard';
import { RequireOperationalPermission } from '../auth/require-operational-permission.decorator';
import {
  CalculateProductionRecordDto,
  CancelProductionRecordDto,
  CreateProductionRecordDto,
  FinishProductionRecordDto,
  UpdateProductionRecordDto,
} from './dto';
import { CurrentOperationalUser } from './operational-user.decorator';
import { ProductionCalculationService } from './production-calculation.service';
import { ProductionRecordsService } from './production-records.service';

@Controller('production-records')
@UseGuards(OperatorSessionGuard, OperationalPermissionGuard)
export class ProductionRecordsController {
  constructor(
    private readonly records: ProductionRecordsService,
    private readonly calculations: ProductionCalculationService,
  ) {}

  @Post()
  @RequireOperationalPermission('apontamentos.criar')
  create(
    @Body() body: CreateProductionRecordDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.records.create(body, user, req.correlationId);
  }

  @Get()
  @RequireOperationalPermission('apontamentos.consultar')
  list(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Query() query: Record<string, unknown>,
  ) {
    return this.records.list(user, query);
  }

  @Get('current-by-device')
  @RequireOperationalPermission('apontamentos.consultar')
  currentByDevice(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.records.currentByDevice(user.dispositivoId, user);
  }

  @Post('calculate')
  calculate(@Body() body: CalculateProductionRecordDto) {
    return this.calculations.calculate(body);
  }

  @Get(':id')
  @RequireOperationalPermission('apontamentos.consultar')
  get(
    @Param('id') id: string,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.records.get(id, user);
  }

  @Patch(':id')
  @RequireOperationalPermission('apontamentos.alterar')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductionRecordDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.records.update(id, body, user, req.correlationId);
  }

  @Post(':id/start')
  @RequireOperationalPermission('apontamentos.iniciar')
  start(
    @Param('id') id: string,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.records.get(id, user);
  }

  @Post(':id/finish')
  @RequireOperationalPermission('apontamentos.concluir')
  finish(
    @Param('id') id: string,
    @Body() body: FinishProductionRecordDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.records.finish(id, body, user, req.correlationId);
  }

  @Post(':id/cancel')
  @RequireOperationalPermission('apontamentos.cancelar')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelProductionRecordDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.records.cancel(id, body, user, req.correlationId);
  }
}
