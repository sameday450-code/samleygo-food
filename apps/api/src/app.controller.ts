import { Controller, Get, Inject } from '@nestjs/common';
import type { HealthCheckResponse } from '@food-delivery/types';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import { CacheService } from './cache/cache.service';

@Controller()
export class AppController {
  constructor(
    @Inject('DB') private db: NeonHttpDatabase<typeof schema>,
    private cacheService: CacheService,
  ) {}

  @Get('db-test')
  async dbTest() {
    const result = await this.db.select().from(schema.users);
    return { users: result, count: result.length };
  }

  @Get('health') // /api/health
  health(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }

  @Get('cache/flush')
  async flushCache() {
    await this.cacheService.flushAll();
    return { message: 'Cache flushed' };
  }
}
