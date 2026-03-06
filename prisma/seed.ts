import 'dotenv/config';
import { PrismaClient, UserStatus, AccountType, RoleStatus, ModuleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding default tenant, roles, and admin user...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'default.cms.local' },
    update: {},
    create: {
      name: 'Default Organization',
      domain: 'default.cms.local',
      status: 'ACTIVE',
      settings: {},
    },
  });

  // 2. Roles Data
  const rolesData = [
    { name: 'Admin', description: 'Full system access' },
    { name: 'DPO', description: 'Data Protection Officer - Compliance focus' },
    { name: 'Operator', description: 'Daily operations & consent management' },
    { name: 'Viewer', description: 'Read-only access across the board' },
    { name: 'Compliance', description: 'Audits and compliance reporting' },
    { name: 'Auditor', description: 'External/Internal security auditing' },
  ];

  const createdRoles: any[] = [];
  
  for (const roleDef of rolesData) {
    const role = await prisma.role.create({
      data: {
        name: roleDef.name,
        description: roleDef.description,
        isSystemRole: true,
        status: RoleStatus.ACTIVE,
        tenantId: tenant.id,
      }
    });
    createdRoles.push(role);
    
    // Assign permissions for ALL modules based on role name (using some standard logic)
    const modules = Object.values(ModuleName);
    
    for (const mod of modules) {
      const isAdmin = role.name === 'Admin';
      const isViewer = role.name === 'Viewer' || role.name === 'Auditor';
      const isDPO = role.name === 'DPO';
      
      await prisma.permission.create({
        data: {
          roleId: role.id,
          module: mod,
          view: true, // Everyone can view baseline
          create: isAdmin || (isDPO && (mod === 'CONSENT_MANAGEMENT' || mod === 'NOTICES')),
          edit: isAdmin || (!isViewer),
          approve: isAdmin || isDPO,
          export: isAdmin || isDPO || role.name === 'Compliance' || role.name === 'Auditor',
          configure: isAdmin,
          admin: isAdmin
        }
      });
    }
  }

  // 3. Create Admin User
  const adminRole = createdRoles.find(r => r.name === 'Admin');
  const hashedPassword = bcrypt.hashSync('Consent@2024', 10);

  const adminEmail = 'admin@cms.local';
  
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Administrator',
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      accountType: AccountType.INTERNAL,
      tenantId: tenant.id,
    }
  });

  // Link Admin User to Admin Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole!.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole!.id
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
