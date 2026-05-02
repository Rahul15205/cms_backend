-- AlterTable
ALTER TABLE "NoticeAcknowledgement" ADD COLUMN     "visitId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NoticeAcknowledgement_visitId_key" ON "NoticeAcknowledgement"("visitId");
