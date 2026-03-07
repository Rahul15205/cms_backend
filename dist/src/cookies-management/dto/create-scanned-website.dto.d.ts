export declare enum ScanFrequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY"
}
export declare enum ScanDepth {
    STANDARD = "STANDARD",
    DEEP = "DEEP"
}
export declare class CreateScannedWebsiteDto {
    name: string;
    url: string;
    frequency?: ScanFrequency;
    depth?: ScanDepth;
    email?: string;
    autoCategorize?: boolean;
    scanBehindLogin?: boolean;
}
