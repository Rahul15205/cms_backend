export declare class PaginatedResponseDto<T> {
    total: number;
    page: number;
    limit: number;
    data: T[];
}
