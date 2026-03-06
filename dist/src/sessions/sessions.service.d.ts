import { PrismaService } from '../prisma/prisma.service';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAllForUser(userId: string): Promise<{
        id: string;
        device: string | null;
        browser: string | null;
        ipAddress: string | null;
        location: string | null;
        loginTime: Date;
        lastActivity: Date;
        isCurrentSession: boolean;
        sessionType: import("@prisma/client").$Enums.SessionType;
    }[]>;
    remove(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        refreshToken: string | null;
        device: string | null;
        browser: string | null;
        ipAddress: string | null;
        location: string | null;
        loginTime: Date;
        lastActivity: Date;
        isCurrentSession: boolean;
        sessionType: import("@prisma/client").$Enums.SessionType;
    }>;
}
