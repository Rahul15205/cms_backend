import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowConfigDto } from './dto/create-workflow-config.dto';

@Injectable()
export class WorkflowConfigsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateWorkflowConfigDto) {
    return this.prisma.workflowConfig.create({
      data: dto as any,
    });
  }

  findAll(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    return this.prisma.workflowConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const config = await this.prisma.workflowConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Workflow config not found');
    return config;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.workflowConfig.update({
      where: { id },
      data: dto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workflowConfig.delete({ where: { id } });
  }
}
