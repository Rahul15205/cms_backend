import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CookiesManagementService } from './cookies-management.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScanFrequency } from '@prisma/client';

@Injectable()
export class ScannerSchedulerService {
  private readonly logger = new Logger(ScannerSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cookie-scanner') private readonly cookieScannerQueue: Queue,
  ) {}

  // Run every hour to check for due scans
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Checking for scheduled cookie scans...');
    
    // FIX: Only fetch websites that are NOT currently scanning
    // FIX: Paginate with `take` to prevent scheduler stampede at scale
    // FIX: Order by lastScan ASC so oldest-scanned websites get priority
    const websites = await this.prisma.scannedWebsite.findMany({
      where: {
        status: { notIn: ['IN_PROGRESS', 'PENDING'] }
      },
      orderBy: { lastScan: 'asc' },
      take: 25,  // Max 25 per hour to spread load across the day
    });

    const now = new Date();
    let triggered = 0;

    for (const website of websites) {
      if (!website.lastScan) {
        // If never scanned, trigger a full scan now
        await this.triggerScan(website.id, website.name, 'FULL');
        triggered++;
        continue;
      }

      const diffInHours = (now.getTime() - website.lastScan.getTime()) / (1000 * 60 * 60);
      let isDue = false;
      let scanType: 'FULL' | 'QUICK' = 'QUICK';  // Default to quick for scheduled re-scans

      switch (website.frequency) {
        case ScanFrequency.DAILY:
          isDue = diffInHours >= 24;
          scanType = 'QUICK';  // Daily = always quick re-scan
          break;
        case ScanFrequency.WEEKLY:
          isDue = diffInHours >= 24 * 7;
          scanType = 'FULL';   // Weekly = full scan (enough interval)
          break;
        case ScanFrequency.MONTHLY:
          isDue = diffInHours >= 24 * 30;
          scanType = 'FULL';
          break;
        case ScanFrequency.QUARTERLY:
          isDue = diffInHours >= 24 * 90;
          scanType = 'FULL';
          break;
      }

      if (isDue) {
        await this.triggerScan(website.id, website.name, scanType);
        triggered++;
      }
    }

    if (triggered > 0) {
      this.logger.log(`Triggered ${triggered} scheduled scan(s).`);
    }
  }

  private async triggerScan(websiteId: string, websiteName: string, scanType: 'FULL' | 'QUICK') {
    this.logger.log(`Triggering scheduled ${scanType} scan for ${websiteName} (${websiteId})`);
    try {
      // FIX: Use jobId to prevent duplicate scans for the same website
      // FIX: Add retry with exponential backoff for resilience
      // FIX: Set priority (manual scans should jump ahead of scheduled ones)
      await this.cookieScannerQueue.add('scan-website', 
        { websiteId, scanType }, 
        { 
          jobId: `scheduled-scan-${websiteId}`,  // Prevents duplicate jobs
          attempts: 3,                            // Retry up to 3 times on failure
          backoff: { type: 'exponential', delay: 60000 },  // 1min, 2min, 4min
          removeOnComplete: 200,                  // Keep last 200 completed jobs for debugging
          removeOnFail: 100,                      // Keep last 100 failed jobs
          priority: scanType === 'FULL' ? 5 : 10, // Full scans get slight priority
        }
      );
      
      // FIX: Only set status to PENDING, do NOT set lastScan here.
      // lastScan should only be set when the scan actually COMPLETES (in the processor).
      // Old code set lastScan here, which caused a bug: if the scan failed,
      // the website wouldn't be re-scanned until the next frequency interval.
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: 'PENDING' },
      });
    } catch (error) {
      this.logger.error(`Failed to trigger scheduled scan for ${websiteId}: ${error.message}`);
    }
  }
}
