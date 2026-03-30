import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  create(createApplicationDto: CreateApplicationDto, tenantId: string) {
    // Generate a secure API Key
    const apiKey = 'sk_test_' + crypto.randomBytes(24).toString('hex');
    
    return this.prisma.application.create({
      data: {
        ...createApplicationDto,
        apiKey,
        tenantId
      }
    });
  }

  async findAll(tenantId?: string, search?: string, limit?: number, offset?: number) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { apiKey: { contains: search, mode: 'insensitive' } } // Admins can search by API key prefixes
      ];
    }

    const take = limit ? Number(limit) : 50;
    const skip = offset ? Number(offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        deployments: { 
          include: { version: { select: { versionNumber: true, templateId: true } } }
        }
      }
    });

    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: updateApplicationDto
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.application.delete({
      where: { id }
    });
  }
  
  async rollApiKey(id: string) {
    await this.findOne(id);
    const apiKey = 'sk_test_' + crypto.randomBytes(24).toString('hex');
    return this.prisma.application.update({
      where: { id },
      data: { apiKey }
    });
  }
}
