import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CookiesManagementService } from './cookies-management.service';
import { ScanFrequency } from '@prisma/client';

@Injectable()
export class ScannerSchedulerService {
  private readonly logger = new Logger(ScannerSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cookiesManagementService: CookiesManagementService,
  ) {}

  // Run every hour to check for due scans
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Checking for scheduled cookie scans...');
    
    const websites = await this.prisma.scannedWebsite.findMany({
      where: {
        status: { not: 'IN_PROGRESS' }
      }
    });

    const now = new Date();

    for (const website of websites) {
      if (!website.lastScan) {
        // If never scanned, trigger now (though createWebsite already does this)
        await this.triggerScan(website.id, website.name);
        continue;
      }

      const diffInHours = (now.getTime() - website.lastScan.getTime()) / (1000 * 60 * 60);
      let isDue = false;

      switch (website.frequency) {
        case ScanFrequency.DAILY:
          isDue = diffInHours >= 24;
          break;
        case ScanFrequency.WEEKLY:
          isDue = diffInHours >= 24 * 7;
          break;
        case ScanFrequency.MONTHLY:
          isDue = diffInHours >= 24 * 30;
          break;
        case ScanFrequency.QUARTERLY:
          isDue = diffInHours >= 24 * 90;
          break;
      }

      if (isDue) {
        await this.triggerScan(website.id, website.name);
      }
    }
  }

  private async triggerScan(websiteId: string, websiteName: string) {
    this.logger.log(`Triggering scheduled scan for ${websiteName} (${websiteId})`);
    try {
      // We call the service method which adds it to the BullMQ queue
      // Note: We bypass tenant check here as it's a system process
      // But we use the existing queue logic
      await (this.cookiesManagementService as any).cookieScannerQueue.add('scan-website', { websiteId });
      
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { 
          status: 'PENDING',
          lastScan: new Date()
        }
      });
    } catch (error) {
      this.logger.error(`Failed to trigger scheduled scan for ${websiteId}: ${error.message}`);
    }
  }
}
