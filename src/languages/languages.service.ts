import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LanguagesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.noticeLanguage.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const language = await this.prisma.noticeLanguage.findUnique({
      where: { id },
    });
    if (!language) throw new NotFoundException('Language not found');
    return language;
  }

  async create(data: any) {
    return this.prisma.noticeLanguage.create({
      data: {
        code: data.code,
        name: data.name,
        isDefault: data.isDefault ?? data.primary ?? false,
        completion: data.completion ?? 0,
        tenantId: data.tenantId,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.noticeLanguage.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        isDefault: data.isDefault ?? data.primary,
        completion: data.completion,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.noticeLanguage.delete({
      where: { id },
    });
  }
}
