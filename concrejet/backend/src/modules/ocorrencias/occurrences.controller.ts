import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OperationalPermissionGuard } from '../auth/operational-permission.guard';
import { OperatorSessionGuard, type OperationalRequest } from '../auth/operator-session.guard';
import { RequireOperationalPermission } from '../auth/require-operational-permission.decorator';
import { CurrentOperationalUser } from '../producao/operational-user.decorator';
import {
  ApproveOccurrenceDto,
  CancelOccurrenceDto,
  CreateOccurrenceDto,
  FinishOccurrenceDto,
  UpdateOccurrenceDto,
} from './dto';
import { OccurrencesService } from './occurrences.service';

@Controller('occurrences')
@UseGuards(OperatorSessionGuard, OperationalPermissionGuard)
export class OccurrencesController {
  constructor(private readonly occurrences: OccurrencesService) {}

  @Post()
  @RequireOperationalPermission('ocorrencias.criar')
  create(
    @Body() body: CreateOccurrenceDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.occurrences.create(body, user, req.correlationId);
  }

  @Get()
  @RequireOperationalPermission('ocorrencias.consultar')
  list(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Query() query: Record<string, unknown>,
  ) {
    return this.occurrences.list(user, query);
  }

  @Get('current-by-device')
  @RequireOperationalPermission('ocorrencias.consultar')
  currentByDevice(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.occurrences.currentByDevice(user);
  }

  @Get(':id')
  @RequireOperationalPermission('ocorrencias.consultar')
  get(
    @Param('id') id: string,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.occurrences.get(id, user);
  }

  @Patch(':id')
  @RequireOperationalPermission('ocorrencias.alterar')
  update(
    @Param('id') id: string,
    @Body() body: UpdateOccurrenceDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.occurrences.update(id, body, user, req.correlationId);
  }

  @Post(':id/start')
  @RequireOperationalPermission('ocorrencias.iniciar')
  start(
    @Param('id') id: string,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
  ) {
    return this.occurrences.get(id, user);
  }

  @Post(':id/finish')
  @RequireOperationalPermission('ocorrencias.encerrar')
  finish(
    @Param('id') id: string,
    @Body() body: FinishOccurrenceDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.occurrences.finish(id, body, user, req.correlationId);
  }

  @Post(':id/cancel')
  @RequireOperationalPermission('ocorrencias.cancelar')
  cancel(
    @Param('id') id: string,
    @Body() body: CancelOccurrenceDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.occurrences.cancel(id, body, user, req.correlationId);
  }

  @Post(':id/approve')
  @RequireOperationalPermission('ocorrencias.aprovar')
  approve(
    @Param('id') id: string,
    @Body() body: ApproveOccurrenceDto,
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Req() req: Request,
  ) {
    return this.occurrences.approve(id, body, user, req.correlationId);
  }
}
