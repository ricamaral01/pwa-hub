import { SetMetadata } from '@nestjs/common';

export const OPERATIONAL_PERMISSION_KEY = 'operationalPermission';

export const RequireOperationalPermission = (permission: string) =>
  SetMetadata(OPERATIONAL_PERMISSION_KEY, permission);
