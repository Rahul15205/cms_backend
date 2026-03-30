import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EncryptionService } from '../encryption/encryption.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private auditLogsService;
    private encryptionService;
    constructor(prisma: PrismaService, jwtService: JwtService, auditLogsService: AuditLogsService, encryptionService: EncryptionService);
    login(loginDto: LoginDto): Promise<{
        mfaRequired: boolean;
        message: string;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
    } | {
        accessToken: string;
        refreshToken: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: any;
            name: any;
            email: string;
            roles: any;
            permissions: any;
            tenant: any;
        };
        mfaRequired?: undefined;
        message?: undefined;
    }>;
    generateMfaSecret(userId: string): Promise<{
        secret: any;
        qrCodeUrl: string;
    }>;
    verifyAndEnableMfa(userId: string, token: string): Promise<{
        message: string;
    }>;
    refresh(refreshDto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: `${string}-${string}-${string}-${string}-${string}`;
        user: {
            id: string;
            name: string;
            email: string;
            roles: string[];
            permissions: any;
            tenant: string;
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        name: any;
        email: string;
        phone: string | null;
        status: any;
        accountType: any;
        department: any;
        mfaEnabled: any;
        aadhaarVerified: any;
        lastLogin: any;
        roles: any;
        permissions: any;
        tenant: {
            id: any;
            name: any;
        };
    }>;
}
