const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const tenants = await prisma.tenant.findMany({
      select: { name: true, domain: true }
    });
    console.log('--- TENANTS IN DATABASE ---');
    console.log(JSON.stringify(tenants, null, 2));
    console.log('---------------------------');
  } catch (err) {
    console.error('Error fetching tenants:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
