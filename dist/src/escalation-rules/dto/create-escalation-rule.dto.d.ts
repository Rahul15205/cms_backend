import { EscalationTrigger, EscalationLevel, EscalationAction, ConfigRuleStatus } from '@prisma/client';
export declare class CreateEscalationRuleDto {
    name: string;
    triggerCondition?: EscalationTrigger;
    triggerThreshold?: number;
    escalationLevel?: EscalationLevel;
    recipientRole: string;
    recipientUser?: string;
    action?: EscalationAction;
    maxLevels?: number;
    autoCloseOnResolution?: boolean;
    status?: ConfigRuleStatus;
    tenantId?: string;
}
