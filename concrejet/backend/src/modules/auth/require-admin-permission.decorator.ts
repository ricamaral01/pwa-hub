import { SetMetadata } from '@nestjs/common';

export const ADMIN_PERMISSION_KEY = 'adminPermission';

export const RequireAdminPermission = (permission: string) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);
