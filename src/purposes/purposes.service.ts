import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePurposeDto } from './dto/create-purpose.dto';
import { UpdatePurposeDto } from './dto/update-purpose.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurposesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPurposeDto: CreatePurposeDto) {
    const { templateId, ...purposeData } = createPurposeDto;

    // Check if the related ConsentTemplate exists
    const templateExists = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!templateExists) {
      throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
    }

    return this.prisma.purpose.create({
      data: {
        ...purposeData,
        template: {
          connect: { id: templateId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.purpose.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const purpose = await this.prisma.purpose.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!purpose) {
      throw new NotFoundException(`Purpose with ID ${id} not found`);
    }

    return purpose;
  }

  async update(id: string, updatePurposeDto: UpdatePurposeDto) {
    const { templateId, ...updateData } = updatePurposeDto;

    // Ensure the purpose exists before updating
    await this.findOne(id);
    
    // If updating templateId, verify new template exists
    if (templateId) {
       const templateExists = await this.prisma.consentTemplate.findUnique({
         where: { id: templateId },
       });
       if (!templateExists) {
         throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
       }
    }

    return this.prisma.purpose.update({
      where: { id },
      data: {
        ...updateData,
        ...(templateId && { template: { connect: { id: templateId } } })
      },
    });
  }

  async remove(id: string) {
    // Ensure it exists first
    await this.findOne(id);

    return this.prisma.purpose.delete({
      where: { id },
    });
  }
}
