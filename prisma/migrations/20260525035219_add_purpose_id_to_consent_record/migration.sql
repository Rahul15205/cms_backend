-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "purposeId" TEXT;

-- CreateIndex
CREATE INDEX "ConsentRecord_applicationId_purposeId_endUserEmailHash_idx" ON "ConsentRecord"("applicationId", "purposeId", "endUserEmailHash");

-- CreateIndex
CREATE INDEX "ConsentRecord_applicationId_purposeId_endUserPhoneHash_idx" ON "ConsentRecord"("applicationId", "purposeId", "endUserPhoneHash");

-- CreateIndex
CREATE INDEX "ConsentRecord_purposeId_idx" ON "ConsentRecord"("purposeId");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE SET NULL ON UPDATE CASCADE;
