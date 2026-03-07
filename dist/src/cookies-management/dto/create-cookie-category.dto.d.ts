export declare enum CookieCategoryType {
    NECESSARY = "NECESSARY",
    ANALYTICS = "ANALYTICS",
    FUNCTIONAL = "FUNCTIONAL",
    ADVERTISING = "ADVERTISING",
    UNCATEGORIZED = "UNCATEGORIZED"
}
export declare class CreateCookieCategoryDto {
    name: string;
    category: CookieCategoryType;
    description?: string;
    enabled?: boolean;
    locked?: boolean;
}
