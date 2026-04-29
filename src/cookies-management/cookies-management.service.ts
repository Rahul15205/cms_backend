import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCookieCategoryDto } from './dto/create-cookie-category.dto';
import { CreateCookieInventoryDto } from './dto/create-cookie-inventory.dto';
import { CreateScannedWebsiteDto } from './dto/create-scanned-website.dto';
import { CreateCookieBannerDto } from './dto/create-cookie-banner.dto';
import { CreateCookieConsentLogDto } from './dto/create-cookie-consent-log.dto';
import * as geoip from 'geoip-lite';

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

  private maskIp(ip?: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return 'Localhost';
    
    // Handle IPv4-mapped IPv6 (e.g., ::ffff:192.168.1.1)
    if (ip.startsWith('::ffff:')) {
      const ipv4Part = ip.substring(7);
      const parts = ipv4Part.split('.');
      if (parts.length === 4) {
        return `::ffff:${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }

    if (ip.includes(':')) {
      // Standard IPv6
      const parts = ip.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = 'xxxx';
        return parts.join(':');
      }
    } else {
      // Standard IPv4
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    return ip;
  }

  private getLocation(ip?: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost')) return 'Localhost';
    
    // Clean IP for geoip-lite (remove ::ffff: if present)
    const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    
    // Check for private/internal IP ranges
    const isPrivate = 
      cleanIp.startsWith('10.') || 
      cleanIp.startsWith('192.168.') || 
      (cleanIp.startsWith('172.') && parseInt(cleanIp.split('.')[1]) >= 16 && parseInt(cleanIp.split('.')[1]) <= 31);
    
    if (isPrivate) return 'Private Network';
    
    try {
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        const city = geo.city || 'Unknown City';
        const country = geo.country || 'Unknown Country';
        return `${city}, ${country}`;
      }
    } catch (e) {
      console.error('Proteccio: GeoIP lookup failed', e);
    }
    
    return 'Unknown';
  }

  async recordPublicConsent(websiteId: string, dto: any) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId }
    });

    if (!website) return null;

    let status: any = 'ACCEPTED';
    const rawStatus = (dto.status || '').toUpperCase();
    if (rawStatus === 'REJECTED') status = 'REJECTED';
    else if (rawStatus === 'WITHDRAWN') status = 'WITHDRAWN';

    const location = this.getLocation(dto.ipAddress);

    return this.prisma.cookieConsentLog.create({
      data: {
        userId: dto.userId || `USER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        region: location,
        categories: dto.categories,
        status: status,
        ipAddress: this.maskIp(dto.ipAddress),
        websiteId: websiteId,
        tenantId: website.tenantId,
      },
    });
  }

  async checkConsentStatus(websiteId: string, userId: string) {
    const log = await this.prisma.cookieConsentLog.findFirst({
      where: {
        websiteId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: log?.status || 'NONE',
      categories: log?.categories || [],
    };
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

    // Get trend data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendLogs = await this.prisma.cookieConsentLog.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    const trendMap = new Map<string, { accepted: number, withdrawn: number, rejected: number }>();
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      trendMap.set(dateStr, { accepted: 0, withdrawn: 0, rejected: 0 });
    }

    trendLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      const stats = trendMap.get(dateStr);
      if (stats) {
        if (log.status === 'ACCEPTED') stats.accepted++;
        else if (log.status === 'WITHDRAWN') stats.withdrawn++;
        else if (log.status === 'REJECTED') stats.rejected++;
      }
    });

    const trends = Array.from(trendMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .reverse(); // Chronological order

    return {
      totalCookies,
      categories: categoriesCount,
      activeConsents: acceptedCount,
      optOutRate: totalLogs > 0 ? Math.round((withdrawnCount / totalLogs) * 100) : 0,
      distribution,
      trends,
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
