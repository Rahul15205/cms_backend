import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserStatus, AccountType } from '@prisma/client';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get(PrismaService);

    const tenant = await prisma.tenant.upsert({
      where: { domain: 'e2e.com' },
      update: {},
      create: { name: 'E2E', domain: 'e2e.com' }
    });

    const hash = await bcrypt.hash('E2eSecret123!', 10);
    await prisma.user.upsert({
      where: { email: 'test@e2e.com' },
      update: { password: hash, status: UserStatus.ACTIVE },
      create: { email: 'test@e2e.com', name: 'Tester', password: hash, status: UserStatus.ACTIVE, accountType: AccountType.INTERNAL, tenantId: tenant.id }
    });
  }, 30000);

  afterAll(async () => {
    await prisma.user.delete({ where: { email: 'test@e2e.com' } }).catch(() => {});
    await app.close();
  });

  it('/api/auth/login (POST) - should fail with bad credentials', () => {
    return request(app.getHttpServer() as any)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'bad' })
      .expect(401);
  });

  it('/api/auth/login (POST) - should login admin', async () => {
    const res = await request(app.getHttpServer() as any)
      .post('/api/auth/login')
      .send({ email: 'test@e2e.com', password: 'E2eSecret123!' })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('/api/auth/refresh (POST) - should issue new tokens', async () => {
    const res = await request(app.getHttpServer() as any)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);
      
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(refreshToken); // Token rotation
    refreshToken = res.body.refreshToken;
  });

  it('/api/auth/logout (POST) - should invalidate sessions', async () => {
    await request(app.getHttpServer() as any)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
