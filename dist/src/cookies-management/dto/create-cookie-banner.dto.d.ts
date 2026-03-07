export declare enum BannerPosition {
    BOTTOM = "BOTTOM",
    TOP = "TOP",
    CENTER = "CENTER",
    CORNER = "CORNER"
}
export declare enum BannerStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE"
}
export declare class CreateCookieBannerDto {
    name: string;
    theme: string;
    language?: string;
    position?: BannerPosition;
    status?: BannerStatus;
}
