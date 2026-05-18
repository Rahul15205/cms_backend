import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentTemplateDto } from './dto/create-consent-template.dto';
import { UpdateConsentTemplateDto } from './dto/update-consent-template.dto';
import { TemplateStatus } from '@prisma/client';

@Injectable()
export class ConsentTemplatesService {
  constructor(private prisma: PrismaService) {}

  create(createConsentTemplateDto: CreateConsentTemplateDto, tenantId: string, creatorId: string) {
    return this.prisma.consentTemplate.create({
      data: {
        ...(createConsentTemplateDto as any),
        tenantId,
        createdBy: creatorId
      }
    });
  }

  async findAll(filters?: {
    tenantId?: string;
    status?: TemplateStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const take = filters?.limit ? Number(filters.limit) : 50;
    const skip = filters?.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.consentTemplate.count({ where }),
      this.prisma.consentTemplate.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { 
          creator: { select: { name: true, email: true } },
          versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
        }
      })
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const template = await this.prisma.consentTemplate.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 10 }
      }
    });
    
    if (!template) throw new NotFoundException('Consent Template not found');
    return template;
  }

  async update(id: string, updateConsentTemplateDto: UpdateConsentTemplateDto, userId?: string) {
    const template = await this.findOne(id);
    
    // If template is PUBLISHED, we must create a new version to capture the changes
    if (template.status === TemplateStatus.PUBLISHED) {
      const latestVersion = template.versions[0];
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      await this.prisma.consentVersion.create({
        data: {
          templateId: id,
          versionNumber: nextVersionNumber,
          content: JSON.stringify(updateConsentTemplateDto.wizardFields || template.wizardFields),
          publishedBy: userId || template.createdBy,
          changeSummary: 'Automatic version update on template modification',
          status: 'ACTIVE'
        }
      });
    }

    // Update the template record and include the latest version
    const updatedTemplate = await this.prisma.consentTemplate.update({
      where: { id },
      data: updateConsentTemplateDto as any,
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 }
      }
    });

    return updatedTemplate;
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete strategy for Templates: moving them to ARCHIVED
    return this.prisma.consentTemplate.update({
      where: { id },
      data: { status: TemplateStatus.ARCHIVED }
    });
  }
}
