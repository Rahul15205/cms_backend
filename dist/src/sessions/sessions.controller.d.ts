import { SessionsService } from './sessions.service';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    findAll(req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
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
