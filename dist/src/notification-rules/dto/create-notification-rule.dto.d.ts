import { NotificationChannel, RecipientType, NotificationFrequency, ConfigRuleStatus } from '@prisma/client';
export declare class CreateNotificationRuleDto {
    name: string;
    triggerEvent: string;
    channel?: NotificationChannel;
    recipientType?: RecipientType;
    template?: string;
    language?: string;
    frequency?: NotificationFrequency;
    retryEnabled?: boolean;
    maxRetries?: number;
    status?: ConfigRuleStatus;
    tenantId?: string;
}
