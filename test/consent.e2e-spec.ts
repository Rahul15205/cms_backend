import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserStatus, AccountType } from '@prisma/client';

describe('ConsentController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    
    prisma = app.get(PrismaService);

    const tenant = await prisma.tenant.upsert({
      where: { domain: 'e2e.com' },
      update: {},
      create: { name: 'E2E', domain: 'e2e.com' }
    });

    const hash = await bcrypt.hash('E2eSecret123!', 10);
    const user = await prisma.user.upsert({
      where: { email: 'consent_test@e2e.com' },
      update: { password: hash, status: UserStatus.ACTIVE },
      create: { 
        email: 'consent_test@e2e.com', 
        name: 'Tester', 
        password: hash, 
        status: UserStatus.ACTIVE, 
        accountType: AccountType.INTERNAL, 
        tenantId: tenant.id 
      }
    });

    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (adminRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
        update: {},
        create: { userId: user.id, roleId: adminRole.id }
      });
    }

    const res = await request(app.getHttpServer() as any)
      .post('/api/auth/login')
      .send({ email: 'consent_test@e2e.com', password: 'E2eSecret123!' });
      
    accessToken = res.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await prisma.user.delete({ where: { email: 'consent_test@e2e.com' } }).catch(() => {});
    await app.close();
  });

  it('/api/consent-templates (GET) - fails without token', () => {
    return request(app.getHttpServer() as any)
      .get('/api/consent-templates')
      .expect(401);
  });

  it('/api/consent-templates (GET) - succeeding with token', async () => {
    const res = await request(app.getHttpServer() as any)
      .get('/api/consent-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });
});
