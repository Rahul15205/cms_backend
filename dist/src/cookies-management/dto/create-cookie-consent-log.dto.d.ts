export declare enum ConsentLogStatus {
    ACCEPTED = "ACCEPTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare class CreateCookieConsentLogDto {
    userId?: string;
    region?: string;
    categories: string[];
    status: ConsentLogStatus;
}
