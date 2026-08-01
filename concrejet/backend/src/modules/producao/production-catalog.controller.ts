import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperatorSessionGuard, type OperationalRequest } from '../auth/operator-session.guard';
import { OperationalPermissionGuard } from '../auth/operational-permission.guard';
import { RequireOperationalPermission } from '../auth/require-operational-permission.decorator';
import { CurrentOperationalUser } from './operational-user.decorator';
import { ProductionCatalogService } from './production-catalog.service';

@Controller('production-catalog')
@UseGuards(OperatorSessionGuard, OperationalPermissionGuard)
@RequireOperationalPermission('apontamentos.consultar')
export class ProductionCatalogController {
  constructor(private readonly catalog: ProductionCatalogService) {}

  @Get()
  getCatalog(@CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>) {
    return this.catalog.getCatalog(user);
  }

  @Get('molds')
  molds(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Query('itemId') itemId: string,
  ) {
    return this.catalog.getMoldsForItem(user, itemId);
  }

  @Get('current-configuration')
  currentConfiguration(
    @CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>,
    @Query('itemId') itemId: string,
    @Query('moldeId') moldeId: string,
  ) {
    return this.catalog.getCurrentConfiguration(user, itemId, moldeId);
  }

  @Get('occurrence-types')
  occurrenceTypes(@CurrentOperationalUser() user: NonNullable<OperationalRequest['operationalUser']>) {
    return this.catalog.getOccurrenceTypes(user);
  }
}
