import { CookiesManagementService } from './cookies-management.service';
import { CreateCookieCategoryDto } from './dto/create-cookie-category.dto';
import { CreateCookieInventoryDto } from './dto/create-cookie-inventory.dto';
import { CreateScannedWebsiteDto } from './dto/create-scanned-website.dto';
import { CreateCookieBannerDto } from './dto/create-cookie-banner.dto';
import { CreateCookieConsentLogDto } from './dto/create-cookie-consent-log.dto';
export declare class CookiesManagementController {
    private readonly cookiesManagementService;
    constructor(cookiesManagementService: CookiesManagementService);
    createCategory(dto: CreateCookieCategoryDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        category: import("@prisma/client").$Enums.CookieCategoryType;
        enabled: boolean;
        locked: boolean;
    }>;
    getCategories(req: any): Promise<({
        _count: {
            cookies: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        category: import("@prisma/client").$Enums.CookieCategoryType;
        enabled: boolean;
        locked: boolean;
    })[]>;
    updateCategory(id: string, dto: Partial<CreateCookieCategoryDto>, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        category: import("@prisma/client").$Enums.CookieCategoryType;
        enabled: boolean;
        locked: boolean;
    }>;
    deleteCategory(id: string, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        category: import("@prisma/client").$Enums.CookieCategoryType;
        enabled: boolean;
        locked: boolean;
    }>;
    createCookie(dto: CreateCookieInventoryDto, req: any): Promise<{
        id: string;
        domain: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        expiration: string | null;
        categoryId: string;
    }>;
    getInventory(req: any): Promise<({
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tenantId: string | null;
            category: import("@prisma/client").$Enums.CookieCategoryType;
            enabled: boolean;
            locked: boolean;
        };
    } & {
        id: string;
        domain: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        expiration: string | null;
        categoryId: string;
    })[]>;
    updateCookie(id: string, dto: Partial<CreateCookieInventoryDto>, req: any): Promise<{
        id: string;
        domain: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        expiration: string | null;
        categoryId: string;
    }>;
    deleteCookie(id: string, req: any): Promise<{
        id: string;
        domain: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        tenantId: string | null;
        expiration: string | null;
        categoryId: string;
    }>;
    createWebsite(dto: CreateScannedWebsiteDto, req: any): Promise<{
        url: string;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ScanStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string | null;
        frequency: import("@prisma/client").$Enums.ScanFrequency;
        depth: import("@prisma/client").$Enums.ScanDepth;
        autoCategorize: boolean;
        scanBehindLogin: boolean;
        lastScan: Date | null;
    }>;
    getWebsites(req: any): Promise<{
        url: string;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ScanStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string | null;
        frequency: import("@prisma/client").$Enums.ScanFrequency;
        depth: import("@prisma/client").$Enums.ScanDepth;
        autoCategorize: boolean;
        scanBehindLogin: boolean;
        lastScan: Date | null;
    }[]>;
    updateWebsite(id: string, dto: Partial<CreateScannedWebsiteDto>, req: any): Promise<{
        url: string;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ScanStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string | null;
        frequency: import("@prisma/client").$Enums.ScanFrequency;
        depth: import("@prisma/client").$Enums.ScanDepth;
        autoCategorize: boolean;
        scanBehindLogin: boolean;
        lastScan: Date | null;
    }>;
    deleteWebsite(id: string, req: any): Promise<{
        url: string;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ScanStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string | null;
        frequency: import("@prisma/client").$Enums.ScanFrequency;
        depth: import("@prisma/client").$Enums.ScanDepth;
        autoCategorize: boolean;
        scanBehindLogin: boolean;
        lastScan: Date | null;
    }>;
    startScan(id: string, req: any): Promise<{
        url: string;
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.ScanStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        email: string | null;
        frequency: import("@prisma/client").$Enums.ScanFrequency;
        depth: import("@prisma/client").$Enums.ScanDepth;
        autoCategorize: boolean;
        scanBehindLogin: boolean;
        lastScan: Date | null;
    }>;
    createBanner(dto: CreateCookieBannerDto, req: any): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.BannerStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        theme: string;
        language: string;
        position: import("@prisma/client").$Enums.BannerPosition;
    }>;
    getBanners(req: any): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.BannerStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        theme: string;
        language: string;
        position: import("@prisma/client").$Enums.BannerPosition;
    }[]>;
    updateBanner(id: string, dto: Partial<CreateCookieBannerDto>, req: any): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.BannerStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        theme: string;
        language: string;
        position: import("@prisma/client").$Enums.BannerPosition;
    }>;
    deleteBanner(id: string, req: any): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.BannerStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        theme: string;
        language: string;
        position: import("@prisma/client").$Enums.BannerPosition;
    }>;
    recordConsentLog(dto: CreateCookieConsentLogDto, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ConsentLogStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        userId: string | null;
        region: string | null;
        categories: string[];
        date: Date;
    }>;
    getConsentLogs(req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ConsentLogStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        userId: string | null;
        region: string | null;
        categories: string[];
        date: Date;
    }[]>;
    getComplianceMetrics(req: any): Promise<{
        banners: {
            total: number;
            active: number;
        };
        consentLogs: {
            total: number;
            accepted: number;
            withdrawn: number;
        };
        websites: number;
        complianceScore: number;
    }>;
}
