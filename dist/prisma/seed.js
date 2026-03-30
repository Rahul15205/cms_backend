"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const crypto = __importStar(require("crypto"));
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';
const ALGORITHM = 'aes-256-cbc';
const DERIVED_KEY = crypto.scryptSync(ENCRYPTION_KEY, 'system-salt', 32);
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
function generateHash(text) {
    if (!text)
        return '';
    return crypto
        .createHash('sha256')
        .update(text.toLowerCase().trim() + 'system-salt')
        .digest('hex');
}
async function main() {
    console.log('Seeding default tenant, roles, and admin user...');
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
    const rolesData = [
        { name: 'Admin', description: 'Full system access' },
        { name: 'DPO', description: 'Data Protection Officer - Compliance focus' },
        { name: 'Operator', description: 'Daily operations & consent management' },
        { name: 'Viewer', description: 'Read-only access across the board' },
        { name: 'Compliance', description: 'Audits and compliance reporting' },
        { name: 'Auditor', description: 'External/Internal security auditing' },
    ];
    const createdRoles = [];
    for (const roleDef of rolesData) {
        const role = await prisma.role.create({
            data: {
                name: roleDef.name,
                description: roleDef.description,
                isSystemRole: true,
                status: client_1.RoleStatus.ACTIVE,
                tenantId: tenant.id,
            }
        });
        createdRoles.push(role);
        const modules = Object.values(client_1.ModuleName);
        for (const mod of modules) {
            const isAdmin = role.name === 'Admin';
            const isViewer = role.name === 'Viewer' || role.name === 'Auditor';
            const isDPO = role.name === 'DPO';
            await prisma.permission.create({
                data: {
                    roleId: role.id,
                    module: mod,
                    view: true,
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
            status: client_1.UserStatus.ACTIVE,
            accountType: client_1.AccountType.INTERNAL,
            tenantId: tenant.id,
        }
    });
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id
        }
    });
    console.log('Creating sample Consent Template...');
    const template = await prisma.consentTemplate.create({
        data: {
            title: 'Marketing & Analytics Processing',
            description: 'Consent for marketing communications and behavioral analytics.',
            type: client_1.ConsentType.EXPLICIT,
            regulations: [client_1.Regulation.DPDP, client_1.Regulation.GDPR],
            status: client_1.TemplateStatus.PUBLISHED,
            noExpiry: true,
            targetUserCategory: [client_1.TargetUserCategory.CUSTOMER],
            consentGivenBy: client_1.ConsentGivenBy.SELF,
            mechanism: client_1.ConsentMechanism.CHECKBOX,
            tenantId: tenant.id,
            createdBy: adminUser.id,
            purposes: {
                create: [
                    {
                        name: 'Email Marketing',
                        description: 'Send promotional emails and newsletters.',
                        isPrimary: true,
                        necessity: client_1.PurposeNecessity.NON_ESSENTIAL,
                    },
                    {
                        name: 'Behavioral Analytics',
                        description: 'Track user behavior to improve services.',
                        isPrimary: false,
                        necessity: client_1.PurposeNecessity.NON_ESSENTIAL,
                        automatedProcessing: true,
                    }
                ]
            }
        }
    });
    console.log('Creating sample Rights Requests...');
    await prisma.rightsRequest.create({
        data: {
            caseNumber: 'RR-2026-000001',
            type: client_1.RightsRequestType.ERASURE,
            regulation: client_1.Regulation.DPDP,
            status: client_1.RightsRequestStatus.RECEIVED,
            currentStep: 'Received',
            priority: client_1.RightsRequestPriority.NORMAL,
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
            type: client_1.RightsRequestType.ACCESS,
            regulation: client_1.Regulation.GDPR,
            status: client_1.RightsRequestStatus.IN_REVIEW,
            priority: client_1.RightsRequestPriority.URGENT,
            requesterId: 'USR-002',
            requesterName: 'Jane Smith',
            requesterEmail: encrypt('jane.smith@example.com'),
            requesterEmailHash: generateHash('jane.smith@example.com'),
            description: 'Requesting access to all profile data.',
            tenantId: tenant.id,
        }
    });
    console.log('Creating sample Cookie Categories...');
    await prisma.cookieCategory.createMany({
        data: [
            {
                name: 'Strictly Necessary',
                category: client_1.CookieCategoryType.NECESSARY,
                description: 'Required for the website to function properly.',
                locked: true,
                tenantId: tenant.id,
            },
            {
                name: 'Analytics',
                category: client_1.CookieCategoryType.ANALYTICS,
                description: 'Used to gather statistics on website usage.',
                locked: false,
                tenantId: tenant.id,
            },
            {
                name: 'Marketing',
                category: client_1.CookieCategoryType.ADVERTISING,
                description: 'Used to deliver targeted advertisements.',
                locked: false,
                tenantId: tenant.id,
            }
        ]
    });
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
//# sourceMappingURL=seed.js.map