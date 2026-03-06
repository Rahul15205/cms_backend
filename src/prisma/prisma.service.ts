import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private configService: ConfigService) {
    // ConfigService is not available before super() is called in TypeScript.
    // However, Prisma requires the adapter to be passed in super({ adapter }).
    // Workaround: Read process.env directly for the PrismaClient constructor.
    super({
      adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }))
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
