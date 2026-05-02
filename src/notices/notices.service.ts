import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { CreateNoticeTypeDto } from './dto/create-notice-type.dto';
import { NoticeStatus } from '@prisma/client';

import { TranslationService } from '../translation/translation.service';

@Injectable()
export class NoticesService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService
  ) {}

  // ==========================================
  // NOTICES CRUD
  // ==========================================

  async create(dto: CreateNoticeDto, userId?: string) {
    const notice = await this.prisma.notice.create({
      data: {
        ...dto,
        createdBy: userId,
        currentVersion: 1,
      } as any,
      include: { type: true },
    });

    // Auto-create v1 snapshot for global history
    await this.prisma.noticeVersion.create({
      data: {
        noticeId: notice.id,
        version: 1,
        title: notice.title,
        content: notice.content || '',
        changes: 'Initial version',
        author: userId,
      },
    });

    return notice;
  }

  async findAll(filters: {
    status?: NoticeStatus;
    typeId?: string;
    tenantId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.typeId) where.typeId = filters.typeId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const take = filters.limit ? Number(filters.limit) : 50;
    const skip = filters.offset ? Number(filters.offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        take,
        skip,
        orderBy: { updatedAt: 'desc' },
        include: {
          type: true,
          _count: { select: { acknowledgements: true, versions: true } },
        },
      }),
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        type: true,
        versions: { orderBy: { version: 'desc' } },
        _count: { select: { acknowledgements: true } },
      },
    });
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async update(id: string, dto: UpdateNoticeDto, userId?: string) {
    const existing = await this.findOne(id);

    // If content or title changed, auto-create a new version snapshot
    const shouldVersion =
      (dto.content !== undefined && dto.content !== existing.content) ||
      (dto.title !== undefined && dto.title !== existing.title);

    const updated = await this.prisma.notice.update({
      where: { id },
      data: dto as any,
      include: { type: true },
    });

    if (shouldVersion) {
      const nextVersion = existing.currentVersion + 1;
      await this.prisma.noticeVersion.create({
        data: {
          noticeId: id,
          version: nextVersion,
          title: updated.title,
          content: updated.content,
          changes: `Updated: ${[dto.title ? 'title' : '', dto.content ? 'content' : ''].filter(Boolean).join(', ')}`,
          author: userId,
        },
      });

      await this.prisma.notice.update({
        where: { id },
        data: { currentVersion: nextVersion },
      });
    }

    return updated;
  }

  // ==========================================
  // VERSION HISTORY
  // ==========================================

  async getHistory(noticeId: string) {
    await this.findOne(noticeId); // Validate notice exists
    return this.prisma.noticeVersion.findMany({
      where: { noticeId },
      orderBy: { version: 'desc' },
    });
  }

  async getGlobalHistory() {
    return this.prisma.noticeVersion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50 globally
      // Include notice details if needed for title, but noticeVersion already has 'title'
    });
  }

  // ==========================================
  // LANGUAGES
  // ==========================================

  getLanguages(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.noticeLanguage.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  createLanguage(dto: { code: string; name: string; isDefault?: boolean; tenantId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.noticeLanguage.updateMany({
          where: dto.tenantId ? { tenantId: dto.tenantId } : {},
          data: { isDefault: false },
        });
      }

      return tx.noticeLanguage.create({
        data: {
          code: dto.code,
          name: dto.name,
          isDefault: dto.isDefault ?? false,
          tenantId: dto.tenantId,
        },
      });
    });
  }

  updateLanguage(id: string, dto: { isDefault?: boolean; completion?: number; name?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.noticeLanguage.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Notice language not found');

      if (dto.isDefault) {
        await tx.noticeLanguage.updateMany({
          where: existing.tenantId ? { tenantId: existing.tenantId } : {},
          data: { isDefault: false },
        });
      }

      return tx.noticeLanguage.update({
        where: { id },
        data: dto,
      });
    });
  }

  async deleteLanguage(id: string) {
    const existing = await this.prisma.noticeLanguage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notice language not found');
    return this.prisma.noticeLanguage.delete({ where: { id } });
  }

  // ==========================================
  // NOTICE TYPES
  // ==========================================

  createType(dto: CreateNoticeTypeDto) {
    return this.prisma.noticeType.create({
      data: dto as any,
    });
  }

  async getTypes(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.noticeType.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { notices: true } } },
    });
  }

  // ==========================================
  // PUBLIC INTEGRATION
  // ==========================================

  async getPublicNotices(websiteId: string) {
    try {
      // Find the website to get the tenantId
      const website = await this.prisma.scannedWebsite.findUnique({
        where: { id: websiteId },
        select: { tenantId: true },
      });

      if (!website || !website.tenantId) {
        console.warn(`Proteccio: No valid tenant found for website ID: ${websiteId}`);
        return [];
      }

      // Return active notices for this tenant
      return await this.prisma.notice.findMany({
        where: {
          tenantId: website.tenantId,
          status: NoticeStatus.NOTICE_ACTIVE,
        },
        include: {
          type: true,
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      console.error('Proteccio: Error in getPublicNotices:', error);
      return [];
    }
  }

  async recordNoticeAcknowledgement(noticeId: string, dto: any) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) throw new NotFoundException('Notice not found');

    return this.prisma.noticeAcknowledgement.create({
      data: {
        noticeId,
        version: notice.currentVersion,
        userEmail: dto.userEmail || null,
        userId: dto.userId || null,
        ipAddress: dto.ipAddress || null,
      },
    });
  }

  async getPublicNoticeByType(websiteId: string, typeName: string, lang?: string) {
    // Find the website to get the tenantId
    const website = await this.prisma.scannedWebsite.findUnique({
      where: { id: websiteId },
      select: { tenantId: true },
    });

    if (!website || !website.tenantId) {
      throw new NotFoundException(`No valid website/tenant found for ID: ${websiteId}`);
    }

    // Return the active notice of this type for this tenant
    const notice = await this.prisma.notice.findFirst({
      where: {
        tenantId: website.tenantId,
        status: NoticeStatus.NOTICE_ACTIVE,
        OR: [
          { type: { name: { equals: typeName, mode: 'insensitive' } } },
          { title: { equals: typeName, mode: 'insensitive' } }
        ]
      },
      include: {
        type: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!notice) {
      throw new NotFoundException(`No active notice found for type: ${typeName}`);
    }

    // Auto-translate if lang is provided and not English
    if (lang && lang.toLowerCase() !== 'en') {
      try {
        const translatedTitle = await this.translationService.translate(
          [notice.title],
          'en',
          lang.toLowerCase()
        );
        
        const translatedContent = await this.translationService.translateHtml(
          notice.content || '',
          'en',
          lang.toLowerCase()
        );
        
        return {
          ...notice,
          title: translatedTitle[0],
          content: translatedContent,
        };
      } catch (error) {
        console.error('Proteccio: Notice translation failed', error);
      }
    }

    return notice;
  }
}
