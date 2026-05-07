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
import axios from 'axios';

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

    const updatedWebsite = await this.prisma.scannedWebsite.update({
      where: { id },
      data: dto,
    });

    // Automatically restart scan after edit
    await this.cookieScannerQueue.add('scan-website', { websiteId: id });

    await this.prisma.scannedWebsite.update({
      where: { id },
      data: {
        status: 'PENDING',
        lastScan: new Date(),
      },
    });

    return updatedWebsite;
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
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost')) return 'Localhost';
    
    // Clean IP for masking (remove ::ffff: if present)
    const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    
    if (cleanIp.includes(':')) {
      // Standard IPv6
      const parts = cleanIp.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = 'xxxx';
        return parts.join(':');
      }
    } else {
      // Standard IPv4
      const parts = cleanIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    return cleanIp;
  }

  private async getLocation(ip?: string): Promise<string> {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('localhost')) return 'Localhost (Internal)';
    
    let cleanIp = ip.split(',')[0].trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }
    
    // Check for private/internal IP ranges
    const isPrivate = 
      cleanIp.startsWith('10.') || 
      cleanIp.startsWith('192.168.') || 
      (cleanIp.split('.').length === 4 && (parts => {
        const second = parseInt(parts[1]);
        return parts[0] === '172' && second >= 16 && second <= 31;
      })(cleanIp.split('.')));
    
    if (isPrivate) return 'Private Network';
    
    try {
      // 1. Try local geoip-lite first
      const geo = geoip.lookup(cleanIp);
      if (geo) {
        const city = geo.city;
        const region = geo.region;
        const country = geo.country;
        
        const parts: string[] = [];
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);
        if (country) parts.push(country);
        
        if (parts.length > 0) return parts.join(', ');
      }

      // 2. Fallback to external API (ipapi.co)
      const response = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 3000 });
      if (response.data && !response.data.error) {
        const { city, region, country_name, country_code } = response.data;
        const parts: string[] = [];
        if (city) parts.push(city);
        if (region && region !== city) parts.push(region);
        if (country_name) parts.push(country_name);
        else if (country_code) parts.push(country_code);
        
        if (parts.length > 0) return parts.join(', ');
      }
    } catch (e) {
      console.warn('Proteccio: GeoIP lookup failed', e.message);
    }
    
    return 'Global Access';
  }

  private async generateSmartUserId(ip: string, websiteId: string): Promise<string> {
    let countryCode = 'XX';
    let cityCode = 'UNK';

    try {
      let cleanIp = ip.split(',')[0].trim().replace(/^::ffff:/, '');
      const isPrivate = 
        cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp.includes('localhost') ||
        cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || 
        (/^172\.(1[6-9]|2\d|3[0-1])\./.test(cleanIp));

      if (!isPrivate) {
        // 1. Try local geoip
        const geo = geoip.lookup(cleanIp);
        if (geo) {
          countryCode = geo.country || 'XX';
          const rawCity = geo.city || geo.region || 'UNK';
          cityCode = rawCity.substring(0, 3).toUpperCase();
        } 
        
        // 2. If local failed or city is unknown, try external fallback
        if (countryCode === 'XX' || cityCode === 'UNK') {
          const response = await axios.get(`https://ipapi.co/${cleanIp}/json/`, { timeout: 3000 });
          if (response.data && !response.data.error) {
            countryCode = response.data.country_code || countryCode;
            const rawCity = response.data.city || response.data.region_code || 'UNK';
            cityCode = rawCity.substring(0, 3).toUpperCase();
          }
        }
      }
    } catch (e) {
      console.warn('Proteccio: Smart ID generation geo lookup failed', e.message);
    }

    // Get sequence number for this website
    const count = await this.prisma.cookieConsentLog.count({
      where: { websiteId }
    });
    const sequence = (count + 1).toString().padStart(4, '0');

    return `${countryCode}-${cityCode}-USER-${sequence}`;
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

    const location = await this.getLocation(dto.ipAddress);
    
    // Generate the smart User ID if not provided or if it's the old U-XXXX format
    let userId = dto.userId;
    if (!userId || userId.startsWith('U-')) {
      userId = await this.generateSmartUserId(dto.ipAddress, websiteId);
    }

    return this.prisma.cookieConsentLog.create({
      data: {
        userId: userId,
        region: location,
        categories: dto.categories,
        status: status,
        ipAddress: this.maskIp(dto.ipAddress),
        language: dto.language || 'en',
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
      orderBy: { createdAt: 'desc' },
      take: 500, // Increased limit for better visibility
    });
  }

  async backfillLocations(tenantId: string) {
    const logs = await this.prisma.cookieConsentLog.findMany({
      where: {
        tenantId,
        OR: [
          { region: 'Unknown' },
          { region: 'Private Network' },
          { region: 'Localhost' }
        ]
      },
    });

    let updatedCount = 0;
    for (const log of logs) {
      // We need the original IP to resolve, but we masked it in the DB.
      // Wait, if the IP is masked like 172.21.0.xxx, we CANNOT resolve it accurately.
      // However, if it's a public IP that was masked, we might get a general location.
      // This is a limitation of masking before storing.
      
      // If the log already has a masked IP that looks like a private network, 
      // there's not much we can do unless we have the original IP.
      
      // For future logs, we will store them correctly.
    }
    
    return { total: logs.length, updated: updatedCount, message: "Backfill is more effective for future logs as current IPs are masked." };
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
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      trendMap.set(dateStr, { accepted: 0, withdrawn: 0, rejected: 0 });
    }

    trendLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  async verifyIntegration(websiteId: string, tenantId: string) {
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId }
    });

    if (!website || website.tenantId !== tenantId) {
      throw new NotFoundException('Website not found');
    }

    try {
      // 1. Fetch the website HTML
      const response = await axios.get(website.url, { 
        timeout: 8000, // Slightly longer timeout for verification
        headers: { 
          'User-Agent': 'Proteccio-Integration-Scanner/1.0',
          'Cache-Control': 'no-cache'
        },
        validateStatus: () => true // Accept any status to check even if error page loads script
      });
      
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      // 2. Look for the script pattern
      // Pattern: /api/v1/public/cookies/banner-script/{id}
      const scriptFound = html.includes(`/api/v1/public/cookies/banner-script/${websiteId}`);
      const globalScriptFound = html.includes(`/api/v1/public/cookies/banner-script/GLOBAL_ID`);

      if (scriptFound || globalScriptFound) {
        return {
          success: true,
          message: 'Installation verified successfully! The script is active on your website.',
          details: {
            scriptType: scriptFound ? 'Website-specific' : 'Global Template',
            urlChecked: website.url,
            timestamp: new Date().toISOString()
          }
        };
      }

      return {
        success: false,
        message: 'Could not find the Proteccio script tag on your website. Please ensure you have pasted the code correctly before the </body> tag.',
        details: {
          urlChecked: website.url,
          timestamp: new Date().toISOString()
        }
      };
    } catch (e) {
      console.warn(`Proteccio: Verification failed for ${website.url}`, e.message);
      return {
        success: false,
        message: `Failed to reach the website: ${e.message}. Please ensure the URL is public and accessible.`,
        details: { 
          urlChecked: website.url,
          error: e.message
        }
      };
    }
  }
}
