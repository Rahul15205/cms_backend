import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDataCategoryDto } from './dto/create-data-category.dto';
import { UpdateDataCategoryDto } from './dto/update-data-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDataCategoryDto: CreateDataCategoryDto) {
    const { templateId, ...data } = createDataCategoryDto;

    const templateExists = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!templateExists) {
      throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
    }

    return this.prisma.dataCategoryConfig.create({
      data: {
        ...data,
        template: {
          connect: { id: templateId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.dataCategoryConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const dataCategory = await this.prisma.dataCategoryConfig.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!dataCategory) {
      throw new NotFoundException(`DataCategoryConfig with ID ${id} not found`);
    }

    return dataCategory;
  }

  async update(id: string, updateDataCategoryDto: UpdateDataCategoryDto) {
    const { templateId, ...updateData } = updateDataCategoryDto;

    await this.findOne(id);
    
    if (templateId) {
       const templateExists = await this.prisma.consentTemplate.findUnique({
         where: { id: templateId },
       });
       if (!templateExists) {
         throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
       }
    }

    return this.prisma.dataCategoryConfig.update({
      where: { id },
      data: {
        ...updateData,
        ...(templateId && { template: { connect: { id: templateId } } })
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.dataCategoryConfig.delete({
      where: { id },
    });
  }
}
