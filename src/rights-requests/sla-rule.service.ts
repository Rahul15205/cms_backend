import { Injectable } from '@nestjs/common'; // PHASE 4 CHANGE
import { PrismaService } from '../prisma/prisma.service'; // PHASE 4 CHANGE
import { Regulation, RightsRequestType, RightsRequestPriority } from '@prisma/client'; // PHASE 4 CHANGE

// PHASE 4 CHANGE
export interface SlaRuleResult {
  slaDays: number;
  extensionDays: number;
  clockPauseOnHold: boolean;
  priority: RightsRequestPriority;
  source: 'DB_SPECIFIC' | 'DB_GENERAL' | 'BUILT_IN_DEFAULT';
}

@Injectable() // PHASE 4 CHANGE
export class SlaRuleService {
  constructor(private readonly prisma: PrismaService) {} // PHASE 4 CHANGE

  // Fetch the most specific SLA rule for a given type + regulation + tenantId
  // Priority: type-specific rule > regulation-wide rule > built-in default
  async getRule(
    regulation: Regulation,
    type: RightsRequestType,
    tenantId: string,
    isEscalated?: boolean // PHASE 4 CHANGE — support escalated check
  ): Promise<SlaRuleResult> {
    try {
      if (tenantId) {
        // 1. Specific type rule check in DB
        const specificRule = await this.prisma.slaRule.findFirst({
          where: {
            regulation,
            requestType: type,
            tenantId,
            isActive: true,
          },
        });
        if (specificRule) {
          return {
            slaDays: specificRule.slaDays,
            extensionDays: specificRule.extensionDays,
            clockPauseOnHold: specificRule.clockPauseOnHold,
            priority: specificRule.priority,
            source: 'DB_SPECIFIC',
          };
        }

        // 2. Regulation-wide general rule check in DB
        const generalRule = await this.prisma.slaRule.findFirst({
          where: {
            regulation,
            requestType: null,
            tenantId,
            isActive: true,
          },
        });
        if (generalRule) {
          return {
            slaDays: generalRule.slaDays,
            extensionDays: generalRule.extensionDays,
            clockPauseOnHold: generalRule.clockPauseOnHold,
            priority: generalRule.priority,
            source: 'DB_GENERAL',
          };
        }
      }
    } catch (e) {
      // getRule must NEVER throw
    }

    // 3. Fallback to built-in default
    return this.getBuiltInDefault(regulation, type, isEscalated);
  }

  // Calculate due date from submittedAt using the resolved rule
  calculateDueDate(submittedAt: Date, slaDays: number): Date {
    const due = new Date(submittedAt);
    due.setDate(due.getDate() + slaDays);
    return due;
  }

  // Determine if SLA clock should pause for this regulation
  shouldPauseClock(regulation: Regulation, clockPauseOnHold: boolean): boolean {
    return clockPauseOnHold;
  }

  // Built-in defaults (spec Section 10) — used as last fallback when no DB rule exists
  private getBuiltInDefault(
    regulation: Regulation,
    type: RightsRequestType,
    isEscalated?: boolean
  ): SlaRuleResult {
    // 1. Check if escalated
    if (isEscalated) {
      return {
        slaDays: 5,
        extensionDays: 0,
        clockPauseOnHold: false,
        priority: RightsRequestPriority.CRITICAL,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    // 2. Check for type-specific match
    if (regulation === Regulation.GDPR && type === RightsRequestType.FILE_COMPLAINT) {
      return {
        slaDays: 90,
        extensionDays: 90,
        clockPauseOnHold: true,
        priority: RightsRequestPriority.NORMAL,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    if (regulation === Regulation.DPDP) {
      if (type === RightsRequestType.ACCESS || type === RightsRequestType.CORRECTION) {
        return {
          slaDays: 30,
          extensionDays: 0,
          clockPauseOnHold: false,
          priority: RightsRequestPriority.NORMAL,
          source: 'BUILT_IN_DEFAULT',
        };
      }
      if (type === RightsRequestType.GRIEVANCE_REDRESSAL) {
        return {
          slaDays: 30,
          extensionDays: 0,
          clockPauseOnHold: false,
          priority: RightsRequestPriority.URGENT,
          source: 'BUILT_IN_DEFAULT',
        };
      }
    }

    // 3. Regulation-wide general match
    if (regulation === Regulation.GDPR) {
      return {
        slaDays: 30,
        extensionDays: 0,
        clockPauseOnHold: true,
        priority: RightsRequestPriority.NORMAL,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    if (regulation === Regulation.CCPA) {
      return {
        slaDays: 45,
        extensionDays: 45,
        clockPauseOnHold: true,
        priority: RightsRequestPriority.NORMAL,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    if (regulation === Regulation.LGPD) {
      return {
        slaDays: 15,
        extensionDays: 0,
        clockPauseOnHold: false,
        priority: RightsRequestPriority.URGENT,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    if (
      regulation === Regulation.TAPA ||
      regulation === Regulation.PDPL ||
      regulation === Regulation.PIPL ||
      regulation === Regulation.CUSTOM
    ) {
      return {
        slaDays: 30,
        extensionDays: 0,
        clockPauseOnHold: false,
        priority: RightsRequestPriority.NORMAL,
        source: 'BUILT_IN_DEFAULT',
      };
    }

    // 4. Ultimate fallback
    return {
      slaDays: 30,
      extensionDays: 0,
      clockPauseOnHold: false,
      priority: RightsRequestPriority.NORMAL,
      source: 'BUILT_IN_DEFAULT',
    };
  }
}
