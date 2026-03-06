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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let ApplicationsService = class ApplicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createApplicationDto, tenantId) {
        const apiKey = 'sk_test_' + crypto.randomBytes(24).toString('hex');
        return this.prisma.application.create({
            data: {
                ...createApplicationDto,
                apiKey,
                tenantId
            }
        });
    }
    async findAll(tenantId, search, limit, offset) {
        const where = {};
        if (tenantId)
            where.tenantId = tenantId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { apiKey: { contains: search, mode: 'insensitive' } }
            ];
        }
        const take = limit ? Number(limit) : 50;
        const skip = offset ? Number(offset) : 0;
        const [total, data] = await Promise.all([
            this.prisma.application.count({ where }),
            this.prisma.application.findMany({
                where,
                take,
                skip,
                orderBy: { createdAt: 'desc' }
            })
        ]);
        return {
            total,
            page: Math.floor(skip / take) + 1,
            limit: take,
            data
        };
    }
    async findOne(id) {
        const application = await this.prisma.application.findUnique({
            where: { id },
            include: {
                deployments: {
                    include: { version: { select: { versionNumber: true, templateId: true } } }
                }
            }
        });
        if (!application)
            throw new common_1.NotFoundException('Application not found');
        return application;
    }
    async update(id, updateApplicationDto) {
        await this.findOne(id);
        return this.prisma.application.update({
            where: { id },
            data: updateApplicationDto
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.application.delete({
            where: { id }
        });
    }
    async rollApiKey(id) {
        await this.findOne(id);
        const apiKey = 'sk_test_' + crypto.randomBytes(24).toString('hex');
        return this.prisma.application.update({
            where: { id },
            data: { apiKey }
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map