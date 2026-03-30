-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhaarVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aadhaarVerifiedAt" TIMESTAMP(3);
