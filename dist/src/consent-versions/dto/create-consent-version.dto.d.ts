export declare class CreateConsentVersionDto {
    content: string;
    templateId: string;
    changeSummary?: string;
    changedFields?: string[];
    changeReason?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    reconsentTriggered?: boolean;
}
