import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OperationalRequest } from '../auth/operator-session.guard';

export const CurrentOperationalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<OperationalRequest>().operationalUser,
);
