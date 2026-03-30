-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "endUserEmailHash" TEXT,
ADD COLUMN     "endUserPhone" TEXT,
ADD COLUMN     "endUserPhoneHash" TEXT;

-- CreateIndex
CREATE INDEX "ConsentRecord_endUserEmailHash_idx" ON "ConsentRecord"("endUserEmailHash");

-- CreateIndex
CREATE INDEX "ConsentRecord_endUserPhoneHash_idx" ON "ConsentRecord"("endUserPhoneHash");
