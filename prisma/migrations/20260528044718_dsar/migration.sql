-- DropForeignKey
ALTER TABLE "WorkflowStep" DROP CONSTRAINT "WorkflowStep_templateStepId_fkey";

-- CreateIndex
CREATE INDEX "RightsRequest_tenantId_status_idx" ON "RightsRequest"("tenantId", "status");
