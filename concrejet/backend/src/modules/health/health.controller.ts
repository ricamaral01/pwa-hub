import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

interface PackageJson {
  name: string;
  version: string;
}

function readPackageJson(): PackageJson {
  const path = join(__dirname, '..', '..', '..', 'package.json');
  return JSON.parse(readFileSync(path, 'utf-8')) as PackageJson;
}

@Controller()
export class HealthController {
  private readonly pkg = readPackageJson();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<{ status: 'ok'; database: 'up' }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
      });
    }
  }

  @Get('version')
  version(): { name: string; version: string } {
    return { name: this.pkg.name, version: this.pkg.version };
  }
}
