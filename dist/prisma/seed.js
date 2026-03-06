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
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding default tenant, roles, and admin user...');
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
    const adminEmail = 'admin@cms.local';
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
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