-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "auditLogging" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoArchive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "enforceAcknowledgement" BOOLEAN NOT NULL DEFAULT false;
