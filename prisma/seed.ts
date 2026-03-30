import 'dotenv/config';
import { 
  PrismaClient, UserStatus, AccountType, RoleStatus, ModuleName,
  TemplateStatus, ConsentType, Regulation, TargetUserCategory, 
  ConsentGivenBy, ConsentMechanism, PurposeNecessity,
  RightsRequestType, RightsRequestStatus, RightsRequestPriority,
  CookieCategoryType
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import * as crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Encryption Helpers for Seed
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';
const ALGORITHM = 'aes-256-cbc';
const DERIVED_KEY = crypto.scryptSync(ENCRYPTION_KEY, 'system-salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function generateHash(text: string): string {
  if (!text) return '';
  return crypto
    .createHash('sha256')
    .update(text.toLowerCase().trim() + 'system-salt')
    .digest('hex');
}

async function main() {
  console.log('Seeding default tenant, roles, and admin user...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'acme.com' },
    update: {},
    create: {
      name: 'Acme Corp',
      domain: 'acme.com',
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

  const adminEmail = 'admin@acme.com';
  
  const adminUser = await prisma.user.upsert({
    where: { emailHash: generateHash(adminEmail) },
    update: {},
    create: {
      email: encrypt(adminEmail),
      emailHash: generateHash(adminEmail),
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
  // 4. Create Sample Consent Template
  console.log('Creating sample Consent Template...');
  const template = await prisma.consentTemplate.create({
    data: {
      title: 'Marketing & Analytics Processing',
      description: 'Consent for marketing communications and behavioral analytics.',
      type: ConsentType.EXPLICIT,
      regulations: [Regulation.DPDP, Regulation.GDPR],
      status: TemplateStatus.PUBLISHED,
      noExpiry: true,
      targetUserCategory: [TargetUserCategory.CUSTOMER],
      consentGivenBy: ConsentGivenBy.SELF,
      mechanism: ConsentMechanism.CHECKBOX,
      tenantId: tenant.id,
      createdBy: adminUser.id,
      purposes: {
        create: [
          {
            name: 'Email Marketing',
            description: 'Send promotional emails and newsletters.',
            isPrimary: true,
            necessity: PurposeNecessity.NON_ESSENTIAL,
          },
          {
            name: 'Behavioral Analytics',
            description: 'Track user behavior to improve services.',
            isPrimary: false,
            necessity: PurposeNecessity.NON_ESSENTIAL,
            automatedProcessing: true,
          }
        ]
      }
    }
  });

  // 5. Create Sample Rights Requests
  console.log('Creating sample Rights Requests...');
  await prisma.rightsRequest.create({
    data: {
      caseNumber: 'RR-2026-000001',
      type: RightsRequestType.ERASURE,
      regulation: Regulation.DPDP,
      status: RightsRequestStatus.RECEIVED,
      currentStep: 'Received',
      priority: RightsRequestPriority.NORMAL,
      requesterId: 'USR-001',
      requesterName: 'John Doe',
      requesterEmail: encrypt('john.doe@example.com'),
      requesterEmailHash: generateHash('john.doe@example.com'),
      description: 'Requesting erasure of personal marketing data.',
      tenantId: tenant.id,
    }
  });

  await prisma.rightsRequest.create({
    data: {
      caseNumber: 'RR-2026-000002',
      type: RightsRequestType.ACCESS,
      regulation: Regulation.GDPR,
      status: RightsRequestStatus.IN_REVIEW,
      priority: RightsRequestPriority.URGENT,
      requesterId: 'USR-002',
      requesterName: 'Jane Smith',
      requesterEmail: encrypt('jane.smith@example.com'),
      requesterEmailHash: generateHash('jane.smith@example.com'),
      description: 'Requesting access to all profile data.',
      tenantId: tenant.id,
    }
  });

  // 6. Create Sample Cookie Categories
  console.log('Creating sample Cookie Categories...');
  await prisma.cookieCategory.createMany({
    data: [
      {
        name: 'Strictly Necessary',
        category: CookieCategoryType.NECESSARY,
        description: 'Required for the website to function properly.',
        locked: true,
        tenantId: tenant.id,
      },
      {
        name: 'Analytics',
        category: CookieCategoryType.ANALYTICS,
        description: 'Used to gather statistics on website usage.',
        locked: false,
        tenantId: tenant.id,
      },
      {
        name: 'Marketing',
        category: CookieCategoryType.ADVERTISING,
        description: 'Used to deliver targeted advertisements.',
        locked: false,
        tenantId: tenant.id,
      }
    ]
  });
  // 7. Create Sample Notice Languages
  console.log('Creating sample Notice Languages...');
  await prisma.noticeLanguage.createMany({
    data: [
      {
        code: 'en',
        name: 'English',
        isDefault: true,
        completion: 100,
        tenantId: tenant.id,
      },
      {
        code: 'hi',
        name: 'Hindi',
        isDefault: false,
        completion: 100,
        tenantId: tenant.id,
      }
    ]
  });

  // 8. Create Sample Notice Types
  console.log('Creating sample Notice Types...');
  await prisma.noticeType.createMany({
    data: [
      {
        name: 'Privacy Policy',
        description: 'Main privacy policy governing data collection.',
        required: true,
        tenantId: tenant.id,
      },
      {
        name: 'Terms of Service',
        description: 'Rules governing the use of our services.',
        required: true,
        tenantId: tenant.id,
      },
      {
        name: 'Cookie Policy',
        description: 'Details about how we use cookies.',
        required: false,
        tenantId: tenant.id,
      }
    ]
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
