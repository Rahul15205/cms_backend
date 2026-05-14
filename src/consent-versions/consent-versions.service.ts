import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentVersionDto } from './dto/create-consent-version.dto';
import { TemplateStatus } from '@prisma/client';

@Injectable()
export class ConsentVersionsService {
  constructor(private prisma: PrismaService) {}

  async create(createConsentVersionDto: CreateConsentVersionDto, publisherId: string) {
    const { templateId, content, changeSummary, changedFields, changeReason, effectiveFrom, effectiveTo, reconsentTriggered } = createConsentVersionDto;

    // Verify template exists and isn't archived
    const template = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.status === TemplateStatus.ARCHIVED) {
      throw new BadRequestException('Cannot publish versions for an archived template');
    }

    // Determine the next version number
    const nextVersionNumber = template.versions.length > 0 ? template.versions[0].versionNumber + 1 : 1;

    // Use a transaction to publish the version and simultaneously lock the template status to PUBLISHED
    return this.prisma.$transaction(async (prisma) => {
      const version = await prisma.consentVersion.create({
        data: {
          versionNumber: nextVersionNumber,
          content,
          templateId,
          publishedBy: publisherId,
          changeSummary,
          changedFields: changedFields || [],
          changeReason,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
          effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
          reconsentTriggered: reconsentTriggered || false,
        }
      });

      if (template.status === TemplateStatus.DRAFT) {
        await prisma.consentTemplate.update({
          where: { id: templateId },
          data: { status: TemplateStatus.PUBLISHED }
        });
      }

      return version;
    });
  }

  async getStats(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.template = { tenantId };

    const [total, active, reconsent] = await Promise.all([
      this.prisma.consentVersion.count({ where }),
      this.prisma.consentVersion.count({ 
        where: { ...where, status: 'ACTIVE' } 
      }),
      this.prisma.consentVersion.count({ 
        where: { ...where, reconsentTriggered: true } 
      })
    ]);

    return { 
      total, 
      active, 
      reconsent,
      usersImpacted: 0 // Placeholder for now
    };
  }

  async findAll(templateId?: string, limit?: number, offset?: number) {
    const where: any = {};
    if (templateId) where.templateId = templateId;

    const take = limit ? Number(limit) : 50;
    const skip = offset ? Number(offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.consentVersion.count({ where }),
      this.prisma.consentVersion.findMany({
        where,
        take,
        skip,
        orderBy: [{ templateId: 'desc' }, { versionNumber: 'desc' }],
        include: { 
          template: { select: { title: true } },
          publisher: { select: { name: true, email: true } } 
        }
      })
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const version = await this.prisma.consentVersion.findUnique({
      where: { id },
      include: {
        template: true,
        publisher: { select: { name: true, email: true } }
      }
    });

    if (!version) throw new NotFoundException('Consent Version not found');
    return version;
  }
}
