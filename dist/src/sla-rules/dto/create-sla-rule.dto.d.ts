import { SLADurationUnit, SLADayType, SLAScope, SLARuleStatus, Regulation, RightsRequestType } from '@prisma/client';
export declare class CreateSlaRuleDto {
    name: string;
    regulation?: Regulation;
    rightType?: RightsRequestType;
    category?: string;
    priority?: string;
    duration: number;
    durationUnit?: SLADurationUnit;
    dayType?: SLADayType;
    scope?: SLAScope;
    pauseConditions?: string[];
    autoCloseEnabled?: boolean;
    breachActions?: string[];
    status?: SLARuleStatus;
    version?: number;
    tenantId?: string;
}
