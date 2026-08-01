import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HistoricalImportController } from './historical-import.controller';
import { HistoricalImportService } from './historical-import.service';

@Module({
  imports: [AuthModule],
  controllers: [HistoricalImportController],
  providers: [HistoricalImportService],
})
export class ImportacaoModule {}
