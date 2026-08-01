import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { RequireAdminPermission } from '../auth/require-admin-permission.decorator';
import { HistoricalImportService } from './historical-import.service';

@UseGuards(JwtAuthGuard, AdminPermissionGuard)
@Controller('imports')
export class HistoricalImportController {
  constructor(private readonly imports: HistoricalImportService) {}

  @Get()
  @RequireAdminPermission('importacao.consultar')
  list() {
    return this.imports.listBatches();
  }

  @Post()
  @RequireAdminPermission('importacao.criar')
  create(@Body() body: { nome: string; origem?: string }) {
    return this.imports.createBatch(body.nome, body.origem);
  }

  @Post('analyze')
  @RequireAdminPermission('importacao.validar')
  analyze(@Body() body: { path?: string; batchName?: string }) {
    return this.imports.analyzePath(body.path, body.batchName);
  }

  @Get(':id')
  @RequireAdminPermission('importacao.consultar')
  get(@Param('id') id: string) {
    return this.imports.getBatch(id);
  }

  @Post(':id/dry-run')
  @RequireAdminPermission('importacao.validar')
  dryRun(@Param('id') id: string) {
    return this.imports.dryRun(id);
  }

  @Post(':id/execute')
  @RequireAdminPermission('importacao.executar')
  execute(@Param('id') id: string) {
    return this.imports.execute(id);
  }

  @Post(':id/reconcile')
  @RequireAdminPermission('importacao.exportar_relatorio')
  reconcile(@Param('id') id: string) {
    return this.imports.reconcile(id);
  }

  @Post(':id/rollback')
  @RequireAdminPermission('importacao.reverter')
  rollback(@Param('id') id: string) {
    return this.imports.rollback(id);
  }

  @Get(':id/errors')
  @RequireAdminPermission('importacao.consultar')
  errors(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return { batchId: id, query };
  }

  @Get(':id/reconciliation')
  @RequireAdminPermission('importacao.exportar_relatorio')
  reconciliation(@Param('id') id: string) {
    return this.imports.reconcile(id);
  }
}
