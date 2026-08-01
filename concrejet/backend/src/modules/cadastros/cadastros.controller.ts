import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CadastrosService } from './cadastros.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class CadastrosController {
  constructor(private readonly service: CadastrosService) {}

  @Get(':resource')
  list(
    @Param('resource') resource: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: Record<string, unknown>,
  ) {
    return this.service.list(resource, user, query);
  }

  @Get(':resource/:id')
  get(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.get(resource, id, user);
  }

  @Post(':resource')
  create(
    @Param('resource') resource: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.service.create(resource, body, user, correlationId);
  }

  @Patch(':resource/:id')
  update(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.service.update(resource, id, body, user, correlationId);
  }

  @Patch(':resource/:id/inactivate')
  inactivate(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.service.setActive(resource, id, false, user, correlationId);
  }

  @Patch(':resource/:id/reactivate')
  reactivate(
    @Param('resource') resource: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.service.setActive(resource, id, true, user, correlationId);
  }

  @Patch('production-orders/:id/cancel')
  cancelProductionOrder(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.service.cancelProductionOrder(id, body, user, correlationId);
  }
}
