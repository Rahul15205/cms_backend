-- AlterTable
ALTER TABLE "ConsentTemplate" ADD COLUMN IF NOT EXISTS "requiresOtpVerification" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ConsentTemplate" ADD COLUMN IF NOT EXISTS "requiresAadhaarVerification" BOOLEAN NOT NULL DEFAULT false;
