import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { BlendsService } from './blends.service';
import { CancelBlendDto, CreateBlendDto, FinishBlendDto, UpdateBlendDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('blends')
export class BlendsController {
  constructor(private readonly blends: BlendsService) {}

  @Post()
  create(@Body() dto: CreateBlendDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.create(dto, user);
  }

  @Get()
  list(@Query() query: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.list(user, query);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.get(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.update(id, dto, user);
  }

  @Post(':id/calculate')
  calculate(@Body() dto: CreateBlendDto, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.calculate(dto, user);
  }

  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @Body() dto: FinishBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.finish(id, dto, user);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBlendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.blends.cancel(id, dto, user);
  }

  @Get(':id/traceability')
  traceability(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.blends.traceability(id, user);
  }
}
