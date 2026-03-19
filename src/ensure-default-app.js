
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find a tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('No tenant found. Please seed the database.');
    return;
  }

  // Create or find a default application
  const app = await prisma.application.upsert({
    where: { id: 'app-default' },
    update: {},
    create: {
      id: 'app-default',
      name: 'Universal App',
      type: 'WEB',
      tenantId: tenant.id,
      apiKey: 'default-api-key-123',
      status: 'ACTIVE'
    }
  });

  console.log('--- DEFAULT APPLICATION ---');
  console.log(JSON.stringify(app, null, 2));
  console.log('--- END ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
