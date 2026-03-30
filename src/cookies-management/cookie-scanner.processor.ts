import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { classifyCookie } from './cookie-dictionary.util';
import { ScanStatus } from '@prisma/client';

export interface CookieScanJobData {
  websiteId: string;
}

@Processor('cookie-scanner')
export class CookieScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(CookieScannerProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<CookieScanJobData>): Promise<any> {
    const { websiteId } = job.data;
    this.logger.log(`Scanning website: ${websiteId}`);

    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error(`Website not found: ${websiteId}`);
    }

    try {
      // 1. Update status to IN_PROGRESS
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.IN_PROGRESS }
      });

      // 2. Fetch website headers
      // Note: External sites might block simple Axios 
      const response = await axios.get(website.url, {
        headers: { 'User-Agent': 'Proteccio-Cookie-Scanner/1.0' },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on 404/500
      });

      const setCookieHeaders = response.headers['set-cookie'] || [];
      this.logger.log(`Found ${setCookieHeaders.length} cookies in headers for ${website.url}`);

      // 3. Process Cookies
      const results: any[] = [];
      for (const rawCookie of setCookieHeaders) {
        const parts = rawCookie.split(';');
        const [nameValue] = parts;
        const [name, value] = nameValue.split('=');
        
        if (!name) continue;

        const info = classifyCookie(name.trim());
        
        // Find or create category record for this tenant
        let category = await this.prisma.cookieCategory.findFirst({
          where: { 
            category: info.category,
            tenantId: website.tenantId 
          }
        });

        if (!category) {
          category = await this.prisma.cookieCategory.create({
            data: {
              name: info.category,
              category: info.category,
              tenantId: website.tenantId
            }
          });
        }

        // Find existing record to upsert (Prisma doesn't have a composite unique on inventory)
        const existing = await this.prisma.cookieInventory.findFirst({
           where: { 
               name: name.trim(), 
               domain: website.url, 
               tenantId: website.tenantId 
           }
        });

        if (existing) {
            await this.prisma.cookieInventory.update({
                where: { id: existing.id },
                data: {
                    categoryId: category.id,
                    description: info.description
                }
            });
        } else {
            const inventory = await this.prisma.cookieInventory.create({
                data: {
                  name: name.trim(),
                  domain: website.url,
                  categoryId: category.id,
                  description: info.description,
                  tenantId: website.tenantId
                }
            });
            results.push(inventory);
        }
      }

      // 4. Finalize Scan
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { 
            status: ScanStatus.COMPLETED,
            lastScan: new Date()
        }
      });

      this.logger.log(`Scan completed for ${website.url}. New cookies recorded: ${results.length}`);
      return { cookiesFound: results.length };
    } catch (error) {
      this.logger.error(`Scan failed for ${website.url}: ${error.message}`);
      await this.prisma.scannedWebsite.update({
        where: { id: websiteId },
        data: { status: ScanStatus.FAILED }
      });
      throw error;
    }
  }
}
