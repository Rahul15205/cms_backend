-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetOtpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetOtpHash" TEXT,
ADD COLUMN     "passwordResetOtpRequestedAt" TIMESTAMP(3);
