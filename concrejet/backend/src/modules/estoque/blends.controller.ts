import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminPermissionGuard } from '../auth/admin-permission.guard';
import { RequireAdminPermission } from '../auth/require-admin-permission.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { BlendsService } from './blends.service';
import { CancelBlendDto, CreateBlendDto, FinishBlendDto, UpdateBlendDto } from './dto';

@UseGuards(JwtAuthGuard, AdminPermissionGuard)
@Controller('blends')
export class BlendsController {
  constructor(private readonly blends: BlendsService) {}

  @Post()
  @RequireAdminPermission('blendas.criar')
  create(@Body() dto: CreateBlendDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.create(dto, user);
  }

  @Get()
  @RequireAdminPermission('blendas.consultar')
  list(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.list(user, query);
  }

  @Get(':id')
  @RequireAdminPermission('blendas.consultar')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.get(id, user);
  }

  @Patch(':id')
  @RequireAdminPermission('blendas.alterar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.update(id, dto, user);
  }

  @Post(':id/calculate')
  @RequireAdminPermission('blendas.criar')
  calculate(@Body() dto: CreateBlendDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.calculate(dto, user);
  }

  @Post(':id/finish')
  @RequireAdminPermission('blendas.concluir')
  finish(
    @Param('id') id: string,
    @Body() dto: FinishBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.finish(id, dto, user);
  }

  @Post(':id/cancel')
  @RequireAdminPermission('blendas.cancelar')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.cancel(id, dto, user);
  }

  @Get(':id/traceability')
  @RequireAdminPermission('blendas.rastrear')
  traceability(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.traceability(id, user);
  }
}
