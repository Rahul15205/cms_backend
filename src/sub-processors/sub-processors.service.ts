import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubProcessorDto } from './dto/create-sub-processor.dto';
import { UpdateSubProcessorDto } from './dto/update-sub-processor.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubProcessorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSubProcessorDto: CreateSubProcessorDto) {
    const { templateId, ...data } = createSubProcessorDto;

    const templateExists = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!templateExists) {
      throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
    }

    return this.prisma.subProcessor.create({
      data: {
        ...data,
        template: {
          connect: { id: templateId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.subProcessor.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const subProcessor = await this.prisma.subProcessor.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!subProcessor) {
      throw new NotFoundException(`SubProcessor with ID ${id} not found`);
    }

    return subProcessor;
  }

  async update(id: string, updateSubProcessorDto: UpdateSubProcessorDto) {
    const { templateId, ...updateData } = updateSubProcessorDto;

    await this.findOne(id);
    
    if (templateId) {
       const templateExists = await this.prisma.consentTemplate.findUnique({
         where: { id: templateId },
       });
       if (!templateExists) {
         throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
       }
    }

    return this.prisma.subProcessor.update({
      where: { id },
      data: {
        ...updateData,
        ...(templateId && { template: { connect: { id: templateId } } })
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.subProcessor.delete({
      where: { id },
    });
  }
}
