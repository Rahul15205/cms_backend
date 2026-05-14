import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateConsentWidgetDto } from './dto/create-consent-widget.dto';
import { UpdateConsentWidgetDto } from './dto/update-consent-widget.dto';
import { WidgetStatus, DeploymentStatus } from '@prisma/client';

@Injectable()
export class ConsentWidgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // ─── CRUD (Dashboard Admin) ─────────────────────────────

  async create(dto: CreateConsentWidgetDto, tenantId: string, createdBy: string) {
    // Verify application exists and belongs to tenant
    const application = await this.prisma.application.findUnique({ where: { id: dto.applicationId } });
    if (!application || application.tenantId !== tenantId) {
      throw new NotFoundException('Application not found');
    }

    // Verify template exists and belongs to tenant
    const template = await this.prisma.consentTemplate.findUnique({ where: { id: dto.templateId } });
    if (!template || template.tenantId !== tenantId) {
      throw new NotFoundException('Consent Template not found');
    }

    return this.prisma.consentWidgetConfig.create({
      data: {
        name: dto.name,
        applicationId: dto.applicationId,
        templateId: dto.templateId,
        displayMode: dto.displayMode,
        trigger: dto.trigger,
        position: dto.position,
        themeColor: dto.themeColor,
        backgroundColor: dto.backgroundColor,
        textColor: dto.textColor,
        buttonTextColor: dto.buttonTextColor,
        borderRadius: dto.borderRadius,
        fontSize: dto.fontSize,
        logoUrl: dto.logoUrl,
        heading: dto.heading,
        description: dto.description,
        collectName: dto.collectName,
        collectEmail: dto.collectEmail,
        collectPhone: dto.collectPhone,
        requireAllPurposes: dto.requireAllPurposes,
        showPrivacyLink: dto.showPrivacyLink,
        privacyPolicyUrl: dto.privacyPolicyUrl,
        acceptAllText: dto.acceptAllText,
        rejectAllText: dto.rejectAllText,
        savePrefsText: dto.savePrefsText,
        defaultLanguage: dto.defaultLanguage,
        supportedLanguages: dto.supportedLanguages,
        customCss: dto.customCss,
        tenantId,
        createdBy,
      },
      include: {
        application: { select: { name: true } },
        template: { select: { title: true, type: true } },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.consentWidgetConfig.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        application: { select: { name: true } },
        template: { select: { title: true, type: true, status: true } },
      },
    });
  }

  async findOne(id: string) {
    const widget = await this.prisma.consentWidgetConfig.findUnique({
      where: { id },
      include: {
        application: { select: { name: true } },
        template: {
          include: {
            purposes: true,
            dataCategories: true,
          },
        },
      },
    });

    if (!widget) throw new NotFoundException('Consent Widget not found');
    return widget;
  }

  async update(id: string, dto: UpdateConsentWidgetDto, tenantId: string) {
    const widget = await this.prisma.consentWidgetConfig.findUnique({ where: { id } });
    if (!widget || widget.tenantId !== tenantId) {
      throw new NotFoundException('Consent Widget not found');
    }

    // Strip out frontend-only fields that Prisma doesn't recognize
    const { applicationName, templateName, templateType, id: _id, tenantId: _tid, createdBy: _cb, createdAt: _ca, updatedAt: _ua, ...cleanDto } = dto as any;

    return this.prisma.consentWidgetConfig.update({
      where: { id },
      data: cleanDto,
      include: {
        application: { select: { name: true } },
        template: { select: { title: true, type: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const widget = await this.prisma.consentWidgetConfig.findUnique({ where: { id } });
    if (!widget || widget.tenantId !== tenantId) {
      throw new NotFoundException('Consent Widget not found');
    }

    // Soft delete → Archive
    return this.prisma.consentWidgetConfig.update({
      where: { id },
      data: { status: WidgetStatus.WIDGET_ARCHIVED },
    });
  }

  // ─── PUBLIC API (Embeddable Widget) ─────────────────────

  async getPublicWidgetConfig(applicationId: string) {
    // 1. Get the widget config
    const widget = await this.prisma.consentWidgetConfig.findFirst({
      where: {
        applicationId,
        status: WidgetStatus.WIDGET_ACTIVE,
      },
      include: {
        template: {
          include: {
            purposes: true,
            dataCategories: true,
            thirdParties: true,
          },
        },
        application: { 
          select: { 
            name: true,
            deployments: {
              where: { status: DeploymentStatus.DEPLOYED },
              orderBy: { deployedAt: 'desc' },
              take: 1,
              include: {
                version: true
              }
            }
          } 
        },
      },
    });

    if (!widget) return null;

    // 2. Check if there's an active deployment that should override the template data
    const activeDeployment = widget.application?.deployments?.[0];
    if (activeDeployment && activeDeployment.version) {
      try {
        const versionData = JSON.parse(activeDeployment.version.content);
        // Inject deployment data into the template object for the controller to use
        (widget.template as any).wizardFields = versionData;
        (widget.template as any).activeVersion = activeDeployment.version.versionNumber;
      } catch (e) {
        console.error('Failed to parse deployment version content', e);
      }
    }

    return widget;
  }

  async recordPublicConsent(applicationId: string, dto: any) {
    // 1. Get the active widget config
    const widget = await this.getPublicWidgetConfig(applicationId);
    if (!widget) return null;

    // 2. Find the latest version for this template
    const latestVersion = await this.prisma.consentVersion.findFirst({
      where: {
        templateId: widget.templateId,
        status: 'ACTIVE',
      },
      orderBy: { versionNumber: 'desc' },
    });

    if (!latestVersion) {
      throw new BadRequestException('No active consent version found for this template. Please publish a version first.');
    }

    // 3. Create the consent record with PII hashing
    const record = await this.prisma.consentRecord.create({
      data: {
        versionId: latestVersion.id,
        applicationId,
        endUserEmail: dto.email || null,
        endUserPhone: dto.phone || null,
        endUserIp: dto.ipAddress ? this.maskIp(dto.ipAddress) : null,
        endUserEmailHash: dto.email ? this.encryptionService.generateHash(dto.email) : null,
        endUserPhoneHash: dto.phone ? this.encryptionService.generateHash(dto.phone) : null,
        status: 'GRANTED',
        metadata: {
          purposes: dto.purposes || [],
          consentSource: 'widget',
          widgetId: widget.id,
          widgetName: widget.name,
          userName: dto.name || null,
          userAgent: dto.userAgent || null,
          language: dto.language || 'en',
          timestamp: new Date().toISOString(),
        },
      },
    });

    // 4. Create a usage record for analytics/traceability
    await this.prisma.consentUsageRecord.create({
      data: {
        userIdentifier: dto.email || dto.phone || 'anonymous',
        templateId: widget.templateId,
        version: latestVersion.versionNumber.toString(),
        purposeMapped: (dto.purposes || []).join(', ') || 'General',
        systemApp: widget.application?.name || 'Widget',
        consentDateTime: new Date(),
        consentStatus: 'ACTIVE',
      },
    }).catch(err => {
      console.error('Proteccio: Failed to create widget usage record:', err);
    });

    return {
      success: true,
      recordId: record.id,
      message: 'Consent recorded successfully',
    };
  }

  async checkConsentStatus(applicationId: string, identifier: string) {
    // Try matching by email hash first, then by phone hash
    const emailHash = this.encryptionService.generateHash(identifier);

    const record = await this.prisma.consentRecord.findFirst({
      where: {
        applicationId,
        status: 'GRANTED',
        OR: [
          { endUserEmailHash: emailHash },
          { endUserPhoneHash: emailHash },
        ],
      },
      orderBy: { grantedAt: 'desc' },
    });

    if (record) {
      return {
        hasConsent: true,
        status: record.status,
        grantedAt: record.grantedAt,
        purposes: (record.metadata as any)?.purposes || [],
      };
    }

    return { hasConsent: false, status: 'NONE', purposes: [] };
  }

  async withdrawConsent(applicationId: string, identifier: string) {
    const emailHash = this.encryptionService.generateHash(identifier);

    const result = await this.prisma.consentRecord.updateMany({
      where: {
        applicationId,
        status: 'GRANTED',
        OR: [
          { endUserEmailHash: emailHash },
          { endUserPhoneHash: emailHash },
        ],
      },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
      revokedCount: result.count,
      message: result.count > 0 ? 'Consent withdrawn successfully' : 'No active consent found',
    };
  }

  // ─── Analytics (for dashboard) ──────────────────────────

  async getWidgetAnalytics(widgetId: string) {
    const widget = await this.findOne(widgetId);

    const [totalRecords, grantedRecords, revokedRecords] = await Promise.all([
      this.prisma.consentRecord.count({
        where: {
          applicationId: widget.applicationId,
          metadata: { path: ['widgetId'], equals: widgetId },
        },
      }),
      this.prisma.consentRecord.count({
        where: {
          applicationId: widget.applicationId,
          status: 'GRANTED',
          metadata: { path: ['widgetId'], equals: widgetId },
        },
      }),
      this.prisma.consentRecord.count({
        where: {
          applicationId: widget.applicationId,
          status: 'REVOKED',
          metadata: { path: ['widgetId'], equals: widgetId },
        },
      }),
    ]);

    return {
      widgetId,
      widgetName: widget.name,
      totalRecords,
      grantedRecords,
      revokedRecords,
      consentRate: totalRecords > 0 ? Math.round((grantedRecords / totalRecords) * 100) : 0,
    };
  }

  // ─── Private Helpers ────────────────────────────────────

  private maskIp(ip: string): string {
    if (!ip || ip === '::1' || ip === '127.0.0.1') return 'Localhost';
    const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;
    if (cleanIp.includes('.')) {
      const parts = cleanIp.split('.');
      if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return cleanIp;
  }
}
