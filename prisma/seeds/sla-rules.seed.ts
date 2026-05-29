import 'dotenv/config'; // PHASE 4 CHANGE
import { PrismaClient, Regulation, RightsRequestType, RightsRequestPriority } from '@prisma/client'; // PHASE 4 CHANGE
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); // PHASE 4 CHANGE

// PHASE 4 CHANGE
const defaultRules = [
  // GDPR general + specific
  { regulation: Regulation.GDPR, requestType: null, slaDays: 30, extensionDays: 0, clockPauseOnHold: true, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.GDPR, requestType: RightsRequestType.FILE_COMPLAINT, slaDays: 90, extensionDays: 90, clockPauseOnHold: true, priority: RightsRequestPriority.NORMAL },

  // DPDP specific
  { regulation: Regulation.DPDP, requestType: RightsRequestType.ACCESS, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.DPDP, requestType: RightsRequestType.CORRECTION, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.DPDP, requestType: RightsRequestType.GRIEVANCE_REDRESSAL, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.URGENT },
  
  // General regulation rules
  { regulation: Regulation.CCPA, requestType: null, slaDays: 45, extensionDays: 45, clockPauseOnHold: true, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.LGPD, requestType: null, slaDays: 15, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.URGENT },
  { regulation: Regulation.TAPA, requestType: null, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.PDPL, requestType: null, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.PIPL, requestType: null, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
  { regulation: Regulation.CUSTOM, requestType: null, slaDays: 30, extensionDays: 0, clockPauseOnHold: false, priority: RightsRequestPriority.NORMAL },
];

async function main() {
  console.log('Seeding SLA rules...');

  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Acme Corp',
        domain: 'acme.com',
        status: 'ACTIVE',
        settings: {},
      },
    });
  }

  for (const rule of defaultRules) {
    console.log(`Upserting SLA rule: ${rule.regulation} (Type: ${rule.requestType ?? 'ALL'})...`);
    
    const existing = await prisma.slaRule.findFirst({
      where: {
        regulation: rule.regulation,
        requestType: rule.requestType,
        tenantId: tenant.id,
      },
    });

    if (existing) {
      await prisma.slaRule.update({
        where: { id: existing.id },
        data: {
          slaDays: rule.slaDays,
          extensionDays: rule.extensionDays,
          clockPauseOnHold: rule.clockPauseOnHold,
          priority: rule.priority,
          isActive: true,
        },
      });
    } else {
      await prisma.slaRule.create({
        data: {
          regulation: rule.regulation,
          requestType: rule.requestType,
          tenantId: tenant.id,
          slaDays: rule.slaDays,
          extensionDays: rule.extensionDays,
          clockPauseOnHold: rule.clockPauseOnHold,
          priority: rule.priority,
          isActive: true,
        },
      });
    }
  }

  console.log('SLA rules seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
