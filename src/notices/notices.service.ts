import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { CreateNoticeTypeDto } from './dto/create-notice-type.dto';
import { NoticeStatus } from '@prisma/client';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // NOTICES CRUD
  // ==========================================

  create(dto: CreateNoticeDto, userId?: string) {
    return this.prisma.notice.create({
      data: {
        ...dto,
        createdBy: userId,
      } as any,
      include: { type: true },
    });
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

    return { total, page: Math.floor(skip / take) + 1, limit: take, data };
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
}
