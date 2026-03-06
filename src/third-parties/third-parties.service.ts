import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThirdPartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createThirdPartyDto: CreateThirdPartyDto) {
    const { templateId, ...data } = createThirdPartyDto;

    const templateExists = await this.prisma.consentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!templateExists) {
      throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
    }

    return this.prisma.thirdParty.create({
      data: {
        ...data,
        template: {
          connect: { id: templateId },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.thirdParty.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const thirdParty = await this.prisma.thirdParty.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!thirdParty) {
      throw new NotFoundException(`ThirdParty with ID ${id} not found`);
    }

    return thirdParty;
  }

  async update(id: string, updateThirdPartyDto: UpdateThirdPartyDto) {
    const { templateId, ...updateData } = updateThirdPartyDto;

    await this.findOne(id);
    
    if (templateId) {
       const templateExists = await this.prisma.consentTemplate.findUnique({
         where: { id: templateId },
       });
       if (!templateExists) {
         throw new NotFoundException(`ConsentTemplate with ID ${templateId} not found`);
       }
    }

    return this.prisma.thirdParty.update({
      where: { id },
      data: {
        ...updateData,
        ...(templateId && { template: { connect: { id: templateId } } })
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.thirdParty.delete({
      where: { id },
    });
  }
}
