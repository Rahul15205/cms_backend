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

  async recordPublicConsent(websiteId: string, dto: any) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId }
    });

    if (!website) return null;

    return this.prisma.cookieConsentLog.create({
      data: {
        userId: dto.userId || `USER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        region: dto.region || 'Unknown',
        categories: dto.categories,
        status: dto.status === 'accepted' ? 'ACCEPTED' : 'WITHDRAWN',
        websiteId: websiteId,
        tenantId: website.tenantId,
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

  async getComplianceMetrics(tenantId: string, websiteId?: string) {
    const whereClause: any = { tenantId };
    if (websiteId && websiteId !== 'all') {
      whereClause.websiteId = websiteId;
    }

    // Filter cookies by website
    const cookieWhere: any = { tenantId };
    if (websiteId && websiteId !== 'all') {
      const website = await this.prisma.scannedWebsite.findUnique({ where: { id: websiteId } });
      if (website) {
        cookieWhere.domain = { contains: new URL(website.url).hostname };
      }
    }

    const totalCookies = await this.prisma.cookieInventory.count({
      where: cookieWhere,
    });

    const categoriesCount = await this.prisma.cookieCategory.count({
      where: { tenantId, enabled: true },
    });

    const totalLogs = await this.prisma.cookieConsentLog.count({
      where: whereClause,
    });

    const acceptedCount = await this.prisma.cookieConsentLog.count({
      where: { ...whereClause, status: 'ACCEPTED' },
    });

    const withdrawnCount = await this.prisma.cookieConsentLog.count({
      where: { ...whereClause, status: 'WITHDRAWN' },
    });

    // Get distribution by category
    const inventory = await this.prisma.cookieInventory.findMany({
      where: cookieWhere,
      include: { category: true }
    });

    // Get all enabled categories for this tenant
    const allCategories = await this.prisma.cookieCategory.findMany({
      where: { tenantId, enabled: true },
    });

    const distributionMap = new Map<string, number>();
    allCategories.forEach(cat => {
      distributionMap.set(cat.name, 0);
    });
    
    // Also include Uncategorized as a potential bucket
    distributionMap.set('Uncategorized', 0);

    inventory.forEach(item => {
      const catName = item.category?.name || 'Uncategorized';
      distributionMap.set(catName, (distributionMap.get(catName) || 0) + 1);
    });

    // Filter out Uncategorized if it has 0 cookies to keep it clean, 
    // but keep defined categories even if they are 0
    if (distributionMap.get('Uncategorized') === 0) {
      distributionMap.delete('Uncategorized');
    }

    const palette = [
      '#10b981', // Emerald
      '#3b82f6', // Blue
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#ef4444', // Red
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#f97316', // Orange
      '#14b8a6', // Teal
      '#6366f1', // Indigo
    ];

    let colorIndex = 0;
    const distribution = Array.from(distributionMap.entries()).map(([name, value]) => {
      let color;
      if (name.toUpperCase() === 'UNCATEGORIZED') {
        color = '#94a3b8'; // Slate/Gray for uncategorized
      } else {
        color = palette[colorIndex % palette.length];
        colorIndex++;
      }
      return { name, value, color };
    });

    return {
      totalCookies,
      categories: categoriesCount,
      activeConsents: acceptedCount,
      optOutRate: totalLogs > 0 ? Math.round((withdrawnCount / totalLogs) * 100) : 0,
      distribution,
      consentLogs: {
        total: totalLogs,
        accepted: acceptedCount,
        withdrawn: withdrawnCount,
      },
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
        website: true,
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

    let finalBanner = banner;

    if (!finalBanner) {
      // Fallback to global banner if no website-specific active banner
      finalBanner = await this.prisma.cookieBanner.findFirst({
        where: {
          websiteId: null,
          status: 'ACTIVE',
        },
        include: {
          website: true,
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

    if (finalBanner && (finalBanner as any).website) {
      try {
        const websiteUrl = (finalBanner as any).website.url;
        const hostname = new URL(websiteUrl).hostname.replace('www.', '');
        
        // Filter cookies in each category to only show those for this domain
        (finalBanner as any).tenant.cookieCategories.forEach(cat => {
          cat.cookies = cat.cookies.filter(cookie => {
            const cookieDomain = cookie.domain.toLowerCase().replace('www.', '');
            return cookieDomain.includes(hostname) || hostname.includes(cookieDomain);
          });
        });
      } catch (e) {
        console.error('Proteccio: Error filtering cookies by domain', e);
      }
    }

    return finalBanner;
  }
}
