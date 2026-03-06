import { UserStatus, AccountType } from '@prisma/client';
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string;
    phone?: string;
    status: UserStatus;
    accountType: AccountType;
    department?: string;
    mfaEnabled: boolean;
    lastLogin?: Date;
    validFrom?: Date;
    validUntil?: Date;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
