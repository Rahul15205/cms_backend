import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Total number of records' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Records per page' })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages!: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty() data!: T[];
  @ApiProperty({ type: PaginationMeta }) meta!: PaginationMeta;
}

/**
 * Helper utility to build a standard paginated response.
 * Usage in services:
 *   return paginate(data, total, page, limit);
 */
export function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
