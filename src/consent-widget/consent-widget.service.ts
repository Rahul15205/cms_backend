import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateConsentWidgetDto } from './dto/create-consent-widget.dto';
import { UpdateConsentWidgetDto } from './dto/update-consent-widget.dto';
import { WidgetStatus, DeploymentStatus, ConsentStatus, Purpose } from '@prisma/client';
import * as crypto from 'crypto';
import { ConsentOtpService } from './consent-otp.service';
import { ConsentParentalService, ParentalConsentContext } from './consent-parental.service';
import { AadhaarService } from '../aadhaar/aadhaar.service';

@Injectable()
export class ConsentWidgetService {
  private readonly logger = new Logger(ConsentWidgetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly consentOtpService: ConsentOtpService,
    private readonly consentParentalService: ConsentParentalService,
    private readonly aadhaarService: AadhaarService,
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

  async getPublicWidgetConfig(id: string) {
    // 1. Try to find the widget config by Widget ID first
    let widget = await this.prisma.consentWidgetConfig.findFirst({
      where: {
        id: id,
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

  async recordPublicConsent(id: string, dto: any) {
    const widget = await this.getPublicWidgetConfig(id);
    if (!widget) return null;

    const latestVersion = await this.prisma.consentVersion.findFirst({
      where: { templateId: widget.templateId, status: 'ACTIVE' },
      orderBy: { versionNumber: 'desc' },
    });

    if (!latestVersion) {
      throw new BadRequestException(
        'No active consent version found for this template. Please publish a version first.',
      );
    }

    const template = widget.template as any;
    const parental = this.consentParentalService.resolveContext(template, dto);

    if (parental.needsGuardianOtp) {
      await this.consentOtpService.assertVerified(
        widget.applicationId,
        parental.guardianEmail,
        undefined,
      );
    } else if (this.consentOtpService.isOtpRequired(template)) {
      await this.consentOtpService.assertVerified(widget.applicationId, dto.email, dto.phone);
    }

    if (this.aadhaarService.isAadhaarRequiredForConsent(template)) {
      if (!dto.aadhaarNumber) {
        throw new BadRequestException('Aadhaar number is required for this consent form.');
      }
      await this.aadhaarService.assertConsentAadhaarVerified(
        widget.applicationId,
        dto.aadhaarNumber,
      );
    }

    const recordDto = this.applyParentalToDto(dto, parental);
    if (dto.aadhaarNumber) {
      recordDto.aadhaarMeta = this.aadhaarService.buildAadhaarConsentMetadata(dto.aadhaarNumber);
    }
    const separateConsents = this.isSeparateConsentsEnabled(template);

    if (separateConsents && (template.purposes?.length ?? 0) > 0) {
      if (!recordDto.email && !recordDto.phone) {
        throw new BadRequestException(
          'Email or phone is required when separate consents per purpose is enabled.',
        );
      }
      return this.recordSeparatePurposeConsents(
        widget,
        latestVersion,
        recordDto,
        template.purposes,
        parental,
      );
    }

    return this.recordCombinedConsent(widget, latestVersion, recordDto, parental);
  }

  async checkConsentStatus(id: string, identifier: string) {
    const widget = await this.getPublicWidgetConfig(id);
    if (!widget) return { hasConsent: false, status: 'NONE', purposes: [], separateConsents: false };

    const template = widget.template as any;
    const separateConsents = this.isSeparateConsentsEnabled(template);
    const userWhere = this.buildSubjectWhere(identifier);

    if (separateConsents && (template.purposes?.length ?? 0) > 0) {
      const purposeStatuses = await Promise.all(
        template.purposes.map(async (purpose: Purpose) => {
          const record = await this.prisma.consentRecord.findFirst({
            where: {
              applicationId: widget.applicationId,
              purposeId: purpose.id,
              ...userWhere,
            },
            orderBy: { grantedAt: 'desc' },
          });
          return {
            id: purpose.id,
            name: purpose.name,
            status: record?.status ?? 'NONE',
            grantedAt: record?.grantedAt ?? null,
            granted: record?.status === ConsentStatus.GRANTED,
          };
        }),
      );

      const granted = purposeStatuses.filter((p) => p.granted);
      return {
        hasConsent: granted.length > 0,
        status: granted.length > 0 ? 'GRANTED' : 'NONE',
        separateConsents: true,
        purposes: purposeStatuses,
        grantedPurposes: granted.map((p) => p.name),
      };
    }

    const record = await this.prisma.consentRecord.findFirst({
      where: {
        applicationId: widget.applicationId,
        purposeId: null,
        status: ConsentStatus.GRANTED,
        ...userWhere,
      },
      orderBy: { grantedAt: 'desc' },
    });

    if (record) {
      return {
        hasConsent: true,
        status: record.status,
        grantedAt: record.grantedAt,
        separateConsents: false,
        purposes: (record.metadata as any)?.purposes || [],
      };
    }

    return { hasConsent: false, status: 'NONE', purposes: [], separateConsents: false };
  }

  async withdrawConsent(id: string, identifier: string, dto?: { purposes?: string[]; purposeIds?: string[] }) {
    const widget = await this.getPublicWidgetConfig(id);
    if (!widget) return { success: false, message: 'Widget not found' };

    const template = widget.template as any;
    const userWhere = this.buildSubjectWhere(identifier);
    const where: any = {
      applicationId: widget.applicationId,
      status: ConsentStatus.GRANTED,
      ...userWhere,
    };

    if (dto?.purposeIds?.length || dto?.purposes?.length) {
      const purposeIds = this.resolvePurposeIdsForWithdraw(template.purposes || [], dto);
      if (purposeIds.length === 0) {
        return { success: false, revokedCount: 0, message: 'No matching purposes to revoke' };
      }
      where.purposeId = { in: purposeIds };
    } else if (this.isSeparateConsentsEnabled(template)) {
      where.purposeId = { not: null };
    } else {
      where.purposeId = null;
    }

    const result = await this.prisma.consentRecord.updateMany({
      where,
      data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
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

  private isSeparateConsentsEnabled(template: any): boolean {
    if (template?.separateConsents === true) return true;
    const wizard = template?.wizardFields;
    return wizard?.separateConsents === true;
  }

  private buildSubjectWhere(identifier: string) {
    const hash = this.encryptionService.generateHash(identifier);
    return {
      OR: [{ endUserEmailHash: hash }, { endUserPhoneHash: hash }],
    };
  }

  private resolveSelectedPurposeNames(dto: any, allPurposes: Purpose[]): Set<string> {
    const selected = new Set<string>();
    if (Array.isArray(dto.purposes)) {
      dto.purposes.forEach((name: string) => selected.add(name));
    }
    if (Array.isArray(dto.purposeIds)) {
      allPurposes.forEach((p) => {
        if (dto.purposeIds.includes(p.id)) selected.add(p.name);
      });
    }
    return selected;
  }

  private resolvePurposeIdsForWithdraw(
    allPurposes: Purpose[],
    dto: { purposes?: string[]; purposeIds?: string[] },
  ): string[] {
    const names = new Set<string>();
    dto.purposes?.forEach((n) => names.add(n));
    dto.purposeIds?.forEach((id) => {
      const p = allPurposes.find((x) => x.id === id);
      if (p) names.add(p.name);
    });
    return allPurposes.filter((p) => names.has(p.name)).map((p) => p.id);
  }

  private applyParentalToDto(dto: any, parental: ParentalConsentContext) {
    return {
      ...dto,
      email: parental.recordEmail ?? dto.email,
      phone: parental.recordPhone ?? dto.phone,
    };
  }

  private buildVerificationMeta(
    template: any,
    parental: ParentalConsentContext,
    dto?: any,
  ) {
    if (dto?.aadhaarMeta) {
      return dto.aadhaarMeta;
    }
    const otpUsed =
      parental.needsGuardianOtp || this.consentOtpService.isOtpRequired(template);
    return {
      verificationMethod: otpUsed ? 'OTP' : null,
      verifiedAt: otpUsed ? new Date().toISOString() : null,
    };
  }

  private async recordCombinedConsent(
    widget: any,
    latestVersion: any,
    dto: any,
    parental: ParentalConsentContext,
  ) {
    const template = widget.template as any;
    const record = await this.prisma.consentRecord.create({
      data: {
        versionId: latestVersion.id,
        applicationId: widget.applicationId,
        endUserEmail: dto.email || null,
        endUserPhone: dto.phone || null,
        endUserIp: dto.ipAddress ? this.maskIp(dto.ipAddress) : null,
        endUserEmailHash: dto.email ? this.encryptionService.generateHash(dto.email) : null,
        endUserPhoneHash: dto.phone ? this.encryptionService.generateHash(dto.phone) : null,
        status: ConsentStatus.GRANTED,
        metadata: {
          purposes: dto.purposes || [],
          consentSource: 'widget',
          widgetId: widget.id,
          widgetName: widget.name,
          userName: dto.name || null,
          userAgent: dto.userAgent || null,
          language: dto.language || 'en',
          timestamp: new Date().toISOString(),
          separateConsents: false,
          ...this.buildVerificationMeta(template, parental, dto),
          ...parental.metadata,
        },
      },
    });

    await this.createUsageRecord(widget, latestVersion, dto, (dto.purposes || []).join(', ') || 'General');

    return {
      success: true,
      recordId: record.id,
      recordIds: [record.id],
      separateConsents: false,
      consentGivenBy: parental.consentGivenBy,
      message: 'Consent recorded successfully',
    };
  }

  private async recordSeparatePurposeConsents(
    widget: any,
    latestVersion: any,
    dto: any,
    allPurposes: Purpose[],
    parental: ParentalConsentContext,
  ) {
    const template = widget.template as any;
    const selectedNames = this.resolveSelectedPurposeNames(dto, allPurposes);
    const submissionId = crypto.randomUUID();
    const emailHash = dto.email ? this.encryptionService.generateHash(dto.email) : null;
    const phoneHash = dto.phone ? this.encryptionService.generateHash(dto.phone) : null;
    const userWhere =
      emailHash || phoneHash
        ? {
            OR: [
              ...(emailHash ? [{ endUserEmailHash: emailHash }] : []),
              ...(phoneHash ? [{ endUserPhoneHash: phoneHash }] : []),
            ],
          }
        : null;

    const recordIds: string[] = [];
    const purposeResults: Array<{ id: string; name: string; status: string; recordId?: string }> = [];

    for (const purpose of allPurposes) {
      const isSelected = selectedNames.has(purpose.name);

      if (isSelected) {
        const active = userWhere
          ? await this.prisma.consentRecord.findFirst({
              where: {
                applicationId: widget.applicationId,
                purposeId: purpose.id,
                status: ConsentStatus.GRANTED,
                ...userWhere,
              },
            })
          : null;

        if (active) {
          recordIds.push(active.id);
          purposeResults.push({ id: purpose.id, name: purpose.name, status: 'GRANTED', recordId: active.id });
          await this.createUsageRecord(widget, latestVersion, dto, purpose.name);
          continue;
        }

        const record = await this.prisma.consentRecord.create({
          data: {
            versionId: latestVersion.id,
            applicationId: widget.applicationId,
            purposeId: purpose.id,
            endUserEmail: dto.email || null,
            endUserPhone: dto.phone || null,
            endUserIp: dto.ipAddress ? this.maskIp(dto.ipAddress) : null,
            endUserEmailHash: emailHash,
            endUserPhoneHash: phoneHash,
            status: ConsentStatus.GRANTED,
            metadata: {
              purposeName: purpose.name,
              purposeNecessity: purpose.necessity,
              submissionId,
              consentSource: 'widget',
              widgetId: widget.id,
              widgetName: widget.name,
              userName: dto.name || null,
              userAgent: dto.userAgent || null,
              language: dto.language || 'en',
              timestamp: new Date().toISOString(),
              separateConsents: true,
              ...this.buildVerificationMeta(template, parental, dto),
              ...parental.metadata,
            },
          },
        });

        recordIds.push(record.id);
        purposeResults.push({ id: purpose.id, name: purpose.name, status: 'GRANTED', recordId: record.id });
        await this.createUsageRecord(widget, latestVersion, dto, purpose.name);
      } else if (userWhere) {
        const revoked = await this.prisma.consentRecord.updateMany({
          where: {
            applicationId: widget.applicationId,
            purposeId: purpose.id,
            status: ConsentStatus.GRANTED,
            ...userWhere,
          },
          data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
        });
        purposeResults.push({
          id: purpose.id,
          name: purpose.name,
          status: revoked.count > 0 ? 'REVOKED' : 'NONE',
        });
      } else {
        purposeResults.push({ id: purpose.id, name: purpose.name, status: 'NONE' });
      }
    }

    return {
      success: true,
      recordId: recordIds[0] ?? null,
      recordIds,
      separateConsents: true,
      consentGivenBy: parental.consentGivenBy,
      purposes: purposeResults,
      message: `Consent recorded for ${purposeResults.filter((p) => p.status === 'GRANTED').length} purpose(s)`,
    };
  }

  private async createUsageRecord(widget: any, latestVersion: any, dto: any, purposeMapped: string) {
    const userIdentifier =
      dto.email ||
      dto.phone ||
      dto.userId ||
      dto.name ||
      'anonymous';

    try {
      await this.prisma.consentUsageRecord.create({
        data: {
          userIdentifier,
          ipAddress: dto.ipAddress ? this.maskIp(dto.ipAddress) : undefined,
          templateId: widget.templateId,
          version: String(latestVersion.versionNumber),
          purposeMapped,
          systemApp: widget.application?.name || 'Consent Widget',
          consentDateTime: new Date(),
          consentStatus: 'ACTIVE',
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to create usage record for template ${widget.templateId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

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
