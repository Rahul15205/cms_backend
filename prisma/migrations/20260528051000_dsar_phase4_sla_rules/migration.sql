-- DropForeignKey
ALTER TABLE "SlaRule" DROP CONSTRAINT IF EXISTS "SlaRule_tenantId_fkey";

-- AlterTable
ALTER TABLE "SlaRule" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "SlaRule" ALTER COLUMN "regulation" SET NOT NULL;
ALTER TABLE "SlaRule" ALTER COLUMN "duration" DROP NOT NULL;
ALTER TABLE "SlaRule" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "SlaRule" ALTER COLUMN "priority" TYPE "RightsRequestPriority" USING (COALESCE("priority", 'NORMAL')::"RightsRequestPriority");
ALTER TABLE "SlaRule" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

-- Add new columns
ALTER TABLE "SlaRule" ADD COLUMN "requestType" "RightsRequestType";
ALTER TABLE "SlaRule" ADD COLUMN "slaDays" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "SlaRule" ADD COLUMN "extensionDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SlaRule" ADD COLUMN "clockPauseOnHold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SlaRule" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Drop default from slaDays
ALTER TABLE "SlaRule" ALTER COLUMN "slaDays" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "SlaRule_regulation_requestType_tenantId_key" ON "SlaRule"("regulation", "requestType", "tenantId");

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
