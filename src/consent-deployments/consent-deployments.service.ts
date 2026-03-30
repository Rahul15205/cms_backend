import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDeploymentDto } from './dto/create-consent-deployment.dto';
import { UpdateConsentDeploymentDto } from './dto/update-consent-deployment.dto';
import { DeploymentStatus } from '@prisma/client';

@Injectable()
export class ConsentDeploymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createConsentDeploymentDto: CreateConsentDeploymentDto, deployedBy?: string) {
    const { versionId, applicationId, activationDate, ...rest } = createConsentDeploymentDto;

    // Verify Version exists
    const version = await this.prisma.consentVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException('Consent Version not found');

    // Verify Application exists
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found');

    // Check unique constraint manually to return clean 409
    const existing = await this.prisma.consentDeployment.findUnique({
      where: {
        versionId_applicationId: { versionId, applicationId }
      }
    });

    if (existing) {
      throw new ConflictException('This version is already deployed to this application.');
    }

    return this.prisma.$transaction(async (prisma) => {
      const deployment = await prisma.consentDeployment.create({
        data: {
          versionId,
          applicationId,
          ...rest,
          activationDate: activationDate ? new Date(activationDate) : undefined,
          deployedBy,
          status: DeploymentStatus.DEPLOYED,
        }
      });

      // Create deployment log entry
      await prisma.deploymentLog.create({
        data: {
          deploymentId: deployment.id,
          action: 'Deployed',
          performedBy: deployedBy || 'system',
          details: `Deployed version to application ${application.name}`,
          status: 'SUCCESS',
        }
      });

      return deployment;
    });
  }

  async findAll(applicationId?: string, versionId?: string, limit?: number, offset?: number) {
    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (versionId) where.versionId = versionId;

    const take = limit ? Number(limit) : 50;
    const skip = offset ? Number(offset) : 0;

    const [total, data] = await Promise.all([
      this.prisma.consentDeployment.count({ where }),
      this.prisma.consentDeployment.findMany({
        where,
        take,
        skip,
        orderBy: { deployedAt: 'desc' },
        include: {
          version: { select: { versionNumber: true, templateId: true } },
          application: { select: { name: true } }
        }
      })
    ]);

    return paginate(data, total, Math.floor(skip / take) + 1, take);
  }

  async findOne(id: string) {
    const deployment = await this.prisma.consentDeployment.findUnique({
      where: { id },
      include: {
        version: { include: { template: { select: { title: true } } } },
        application: true,
        logs: { orderBy: { timestamp: 'desc' } }
      }
    });
    
    if (!deployment) throw new NotFoundException('Consent Deployment not found');
    return deployment;
  }

  async update(id: string, updateConsentDeploymentDto: UpdateConsentDeploymentDto) {
    await this.findOne(id);
    return this.prisma.consentDeployment.update({
      where: { id },
      data: updateConsentDeploymentDto
    });
  }

  async rollback(id: string, performedBy: string) {
    const deployment = await this.findOne(id);

    if (!deployment.rollbackAllowed) {
      throw new BadRequestException('Rollback is not allowed for this deployment');
    }

    if (deployment.status === DeploymentStatus.ROLLED_BACK) {
      throw new BadRequestException('This deployment has already been rolled back');
    }

    return this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.consentDeployment.update({
        where: { id },
        data: {
          status: DeploymentStatus.ROLLED_BACK,
          isActive: false,
        }
      });

      await prisma.deploymentLog.create({
        data: {
          deploymentId: id,
          action: 'Rolled back',
          performedBy,
          details: 'Deployment rolled back',
          status: 'SUCCESS',
        }
      });

      return updated;
    });
  }

  async getDeploymentLogs(deploymentId: string) {
    // Verify deployment exists
    await this.findOne(deploymentId);

    return this.prisma.deploymentLog.findMany({
      where: { deploymentId },
      orderBy: { timestamp: 'desc' }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.consentDeployment.delete({
      where: { id }
    });
  }
}
