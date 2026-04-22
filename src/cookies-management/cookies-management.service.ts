import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCookieCategoryDto } from './dto/create-cookie-category.dto';
import { CreateCookieInventoryDto } from './dto/create-cookie-inventory.dto';
import { CreateScannedWebsiteDto } from './dto/create-scanned-website.dto';
import { CreateCookieBannerDto } from './dto/create-cookie-banner.dto';
import { CreateCookieConsentLogDto } from './dto/create-cookie-consent-log.dto';

@Injectable()
export class CookiesManagementService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cookie-scanner') private readonly cookieScannerQueue: Queue
  ) {}

  // ---------------------------------------------------------
  // Cookie Categories
  // ---------------------------------------------------------

  async createCategory(dto: CreateCookieCategoryDto, tenantId: string) {
    return this.prisma.cookieCategory.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getCategories(tenantId: string) {
    return this.prisma.cookieCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { cookies: true },
        },
      },
    });
  }

  async updateCategory(id: string, dto: Partial<CreateCookieCategoryDto>, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
    if (!category || category.tenantId !== tenantId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.cookieCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({ where: { id } });
    if (!category || category.tenantId !== tenantId) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.cookieCategory.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Cookie Inventory
  // ---------------------------------------------------------

  async createCookie(dto: CreateCookieInventoryDto, tenantId: string) {
    const category = await this.prisma.cookieCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Cookie category not found');
    }

    return this.prisma.cookieInventory.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getInventory(tenantId: string) {
    return this.prisma.cookieInventory.findMany({
      where: { tenantId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCookie(id: string, dto: Partial<CreateCookieInventoryDto>, tenantId: string) {
    const cookie = await this.prisma.cookieInventory.findUnique({
      where: { id },
    });

    if (!cookie || cookie.tenantId !== tenantId) {
      throw new NotFoundException('Cookie not found');
    }

    return this.prisma.cookieInventory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCookie(id: string, tenantId: string) {
    const cookie = await this.prisma.cookieInventory.findUnique({ where: { id } });
    if (!cookie || cookie.tenantId !== tenantId) {
      throw new NotFoundException('Cookie not found');
    }
    return this.prisma.cookieInventory.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Website Scanner (Phase 2)
  // ---------------------------------------------------------

  async createWebsite(dto: CreateScannedWebsiteDto, tenantId: string) {
    const website = await this.prisma.scannedWebsite.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    // Automatically trigger first scan
    await this.cookieScannerQueue.add('scan-website', { websiteId: website.id });

    return website;
  }

  async getWebsites(tenantId: string) {
    return this.prisma.scannedWebsite.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateWebsite(id: string, dto: Partial<CreateScannedWebsiteDto>, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    return this.prisma.scannedWebsite.update({
      where: { id },
      data: dto,
    });
  }

  async startScan(id: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id },
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    // Dispatch the scan job
    await this.cookieScannerQueue.add('scan-website', { websiteId: id });

    return this.prisma.scannedWebsite.update({
      where: { id },
      data: {
        status: 'PENDING',
        lastScan: new Date(),
      },
    });
  }

  async deleteWebsite(id: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({ where: { id } });
    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }
    return this.prisma.scannedWebsite.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Cookie Banners (Phase 3)
  // ---------------------------------------------------------

  async createBanner(dto: CreateCookieBannerDto, tenantId: string) {
    return this.prisma.cookieBanner.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getBanners(tenantId: string) {
    return this.prisma.cookieBanner.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBanner(id: string, dto: Partial<CreateCookieBannerDto>, tenantId: string) {
    const banner = await this.prisma.cookieBanner.findUnique({
      where: { id },
    });

    if (!banner || banner.tenantId !== tenantId) {
      throw new NotFoundException('Banner not found');
    }

    return this.prisma.cookieBanner.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBanner(id: string, tenantId: string) {
    const banner = await this.prisma.cookieBanner.findUnique({ where: { id } });
    if (!banner || banner.tenantId !== tenantId) {
      throw new NotFoundException('Banner not found');
    }
    return this.prisma.cookieBanner.delete({ where: { id } });
  }

  // ---------------------------------------------------------
  // Consent Logs & Compliance (Phase 4)
  // ---------------------------------------------------------

  async recordConsentLog(dto: CreateCookieConsentLogDto, tenantId: string) {
    return this.prisma.cookieConsentLog.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getConsentLogs(tenantId: string) {
    return this.prisma.cookieConsentLog.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 100, // Limit to recent logs
    });
  }

  async getComplianceMetrics(tenantId: string) {
    const banners = await this.prisma.cookieBanner.count({
      where: { tenantId },
    });

    const activeBanners = await this.prisma.cookieBanner.count({
      where: { tenantId, status: 'ACTIVE' },
    });

    const totalLogs = await this.prisma.cookieConsentLog.count({
      where: { tenantId },
    });

    const acceptedCount = await this.prisma.cookieConsentLog.count({
      where: { tenantId, status: 'ACCEPTED' },
    });

    const withdrawnCount = await this.prisma.cookieConsentLog.count({
      where: { tenantId, status: 'WITHDRAWN' },
    });

    const websiteCount = await this.prisma.scannedWebsite.count({
      where: { tenantId },
    });

    return {
      banners: {
        total: banners,
        active: activeBanners,
      },
      consentLogs: {
        total: totalLogs,
        accepted: acceptedCount,
        withdrawn: withdrawnCount,
      },
      websites: websiteCount,
      complianceScore: totalLogs > 0 ? Math.round((acceptedCount / totalLogs) * 100) : 100,
    };
  }

  async getPublicBanner(websiteId: string) {
    const banner = await this.prisma.cookieBanner.findFirst({
      where: {
        websiteId,
        status: 'ACTIVE',
      },
      include: {
        tenant: {
          include: {
            cookieCategories: {
              where: { enabled: true },
              include: {
                cookies: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!banner) {
      // Fallback to global banner if no website-specific active banner
      return this.prisma.cookieBanner.findFirst({
        where: {
          websiteId: null,
          status: 'ACTIVE',
        },
        include: {
          tenant: {
            include: {
              cookieCategories: {
                where: { enabled: true },
                include: {
                  cookies: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return banner;
  }
}
