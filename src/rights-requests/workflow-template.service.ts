import { Injectable } from '@nestjs/common'; // PHASE 2 CHANGE
import { PrismaService } from '../prisma/prisma.service'; // PHASE 2 CHANGE
import { RightsRequestType, Regulation, WorkflowTemplate, WorkflowTemplateStep } from '@prisma/client'; // PHASE 2 CHANGE
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator'; // PHASE 2 CHANGE

// PHASE 2 CHANGE
export class CreateTemplateStepDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  order!: number;

  @IsOptional()
  @IsString()
  assignedRole?: string;

  @IsOptional()
  @IsNumber()
  slaHours?: number;
}

@Injectable() // PHASE 2 CHANGE
export class WorkflowTemplateService {
  constructor(private readonly prisma: PrismaService) {} // PHASE 2 CHANGE

  // Fetches template for given type + regulation + tenantId
  // Falls back to built-in default if no tenant-specific template exists
  async getTemplate(
    type: RightsRequestType,
    regulation: Regulation,
    tenantId: string
  ): Promise<WorkflowTemplateStep[]> {
    try {
      if (tenantId) {
        const template = await this.prisma.workflowTemplate.findUnique({
          where: {
            type_regulation_tenantId: {
              type,
              regulation,
              tenantId,
            },
          },
          include: {
            steps: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        });

        if (template && template.steps.length > 0) {
          return template.steps;
        }
      }
    } catch (error) {
      // getTemplate must NEVER throw — always fall back to built-in default if DB lookup fails
    }

    // Fallback to built-in default
    const defaults = this.getBuiltInDefault(type, regulation);
    return defaults.map((d) => ({
      id: `default-${type}-${regulation}-${d.order}`,
      templateId: 'default-template',
      name: d.name,
      order: d.order,
      assignedRole: d.assignedRole ?? null,
      slaHours: d.slaHours ?? null,
    }));
  }

  // Returns built-in default steps when no DB template exists
  // These mirror the seed data defined below
  private getBuiltInDefault(
    type: RightsRequestType,
    regulation: Regulation
  ): Omit<WorkflowTemplateStep, 'id' | 'templateId'>[] {
    if (type === RightsRequestType.ERASURE && regulation === Regulation.GDPR) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Scope Assessment', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Data Deletion Triggered', order: 4, assignedRole: 'SYSTEM', slaHours: 72 },
        { name: 'Deletion Confirmed', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.ACCESS && regulation === Regulation.GDPR) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Data Compilation', order: 3, assignedRole: 'SYSTEM', slaHours: 72 },
        { name: 'DPO Review', order: 4, assignedRole: 'DPO', slaHours: 48 },
        { name: 'DSAR Pack Delivered', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.ACCESS && regulation === Regulation.DPDP) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Aadhaar Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Data Compilation', order: 3, assignedRole: 'SYSTEM', slaHours: 72 },
        { name: 'DPO Review', order: 4, assignedRole: 'DPO', slaHours: 48 },
        { name: 'DSAR Pack Delivered', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.ERASURE && regulation === Regulation.DPDP) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Aadhaar Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Scope Assessment', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Data Deletion Triggered', order: 4, assignedRole: 'SYSTEM', slaHours: 72 },
        { name: 'Deletion Confirmed', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.GRIEVANCE_REDRESSAL && regulation === Regulation.DPDP) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Grievance Team Assignment', order: 3, assignedRole: 'TEAM_LEAD', slaHours: 24 },
        { name: 'Investigation', order: 4, assignedRole: 'HANDLER', slaHours: 96 },
        { name: 'Resolution Drafted', order: 5, assignedRole: 'DPO', slaHours: 48 },
        { name: 'Response Delivered', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.FILE_COMPLAINT && regulation === Regulation.GDPR) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Complaint Investigation', order: 3, assignedRole: 'DPO', slaHours: 120 },
        { name: 'Legal Review', order: 4, assignedRole: 'DPO', slaHours: 72 },
        { name: 'Formal Response Issued', order: 5, assignedRole: 'DPO', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.CORRECTION && regulation === Regulation.GDPR) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Data Identification', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Correction Applied', order: 4, assignedRole: 'HANDLER', slaHours: 72 },
        { name: 'Requester Confirmation', order: 5, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Case Closed', order: 6, assignedRole: null, slaHours: null },
      ];
    }
    if (type === RightsRequestType.WITHDRAW_CONSENT && regulation === Regulation.GDPR) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Consent Records Located', order: 3, assignedRole: 'SYSTEM', slaHours: 24 },
        { name: 'Consent Revoked', order: 4, assignedRole: 'SYSTEM', slaHours: 48 },
        { name: 'Downstream Systems Notified', order: 5, assignedRole: 'SYSTEM', slaHours: 24 },
        { name: 'Confirmation Sent', order: 6, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }
    if (type === RightsRequestType.NOMINATE && regulation === Regulation.DPDP) {
      return [
        { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
        { name: 'Requester Identity Verified', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
        { name: 'Nominee Identity Verified', order: 3, assignedRole: 'HANDLER', slaHours: 48 },
        { name: 'Nomination Linked', order: 4, assignedRole: 'SYSTEM', slaHours: 24 },
        { name: 'Confirmation Sent', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
      ];
    }

    // Generic default fallback
    return [
      { name: 'Request Received', order: 1, assignedRole: null, slaHours: null },
      { name: 'Identity Verification', order: 2, assignedRole: 'HANDLER', slaHours: 24 },
      { name: 'In Review', order: 3, assignedRole: 'HANDLER', slaHours: 72 },
      { name: 'Action Taken', order: 4, assignedRole: 'HANDLER', slaHours: 168 },
      { name: 'Response Delivered', order: 5, assignedRole: 'HANDLER', slaHours: 24 },
    ];
  }

  // Admin endpoint support — creates or updates a tenant's custom template
  async upsertTemplate(
    tenantId: string,
    type: RightsRequestType,
    regulation: Regulation,
    steps: CreateTemplateStepDto[]
  ): Promise<WorkflowTemplate> {
    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.workflowTemplate.findUnique({
        where: {
          type_regulation_tenantId: {
            type,
            regulation,
            tenantId,
          },
        },
      });

      if (existing) {
        await prisma.workflowTemplateStep.deleteMany({
          where: {
            templateId: existing.id,
          },
        });

        await prisma.workflowTemplateStep.createMany({
          data: steps.map((s) => ({
            templateId: existing.id,
            name: s.name,
            order: s.order,
            assignedRole: s.assignedRole || null,
            slaHours: s.slaHours || null,
          })),
        });

        return prisma.workflowTemplate.findUniqueOrThrow({
          where: { id: existing.id },
          include: { steps: true },
        });
      } else {
        return prisma.workflowTemplate.create({
          data: {
            tenantId,
            type,
            regulation,
            isDefault: false,
            steps: {
              create: steps.map((s) => ({
                name: s.name,
                order: s.order,
                assignedRole: s.assignedRole || null,
                slaHours: s.slaHours || null,
              })),
            },
          },
          include: {
            steps: true,
          },
        });
      }
    });
  }
}
