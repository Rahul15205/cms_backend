import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    logout(req: any): Promise<{
        message: string;
    }>;
    generateMfa(req: any): Promise<{
        secret: any;
        qrCodeUrl: string;
    }>;
    verifyMfa(req: any, body: {
        token: string;
    }): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
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
