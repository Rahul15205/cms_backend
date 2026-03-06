import { UserStatus, AccountType } from '@prisma/client';
export declare class CreateUserDto {
    email: string;
    password: string;
    name: string;
    phone?: string;
    status: UserStatus;
    accountType: AccountType;
    department?: string;
    mfaEnabled?: boolean;
    validFrom?: Date;
    validUntil?: Date;
    roles: string[];
}
