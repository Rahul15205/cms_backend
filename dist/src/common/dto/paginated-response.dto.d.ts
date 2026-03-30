export declare class PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: PaginationMeta;
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T>;
