import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoricalImportService } from './historical-import.service';

@UseGuards(JwtAuthGuard)
@Controller('imports')
export class HistoricalImportController {
  constructor(private readonly imports: HistoricalImportService) {}

  @Get()
  list() {
    return this.imports.listBatches();
  }

  @Post()
  create(@Body() body: { nome: string; origem?: string }) {
    return this.imports.createBatch(body.nome, body.origem);
  }

  @Post('analyze')
  analyze(@Body() body: { path?: string; batchName?: string }) {
    return this.imports.analyzePath(body.path, body.batchName);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.imports.getBatch(id);
  }

  @Post(':id/dry-run')
  dryRun(@Param('id') id: string) {
    return this.imports.dryRun(id);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string) {
    return this.imports.execute(id);
  }

  @Post(':id/reconcile')
  reconcile(@Param('id') id: string) {
    return this.imports.reconcile(id);
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string) {
    return this.imports.rollback(id);
  }

  @Get(':id/errors')
  errors(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return { batchId: id, query };
  }

  @Get(':id/reconciliation')
  reconciliation(@Param('id') id: string) {
    return this.imports.reconcile(id);
  }
}
