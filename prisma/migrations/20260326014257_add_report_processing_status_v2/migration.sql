/*
  Warnings:

  - You are about to drop the column `errorMessage` on the `GeneratedReport` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `GeneratedReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'RPT_PROCESSING';

-- AlterTable
ALTER TABLE "GeneratedReport" DROP COLUMN "errorMessage",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedReport" ADD CONSTRAINT "GeneratedReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
