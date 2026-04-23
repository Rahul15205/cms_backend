-- AlterTable
ALTER TABLE "CookieConsentLog" ADD COLUMN     "websiteId" TEXT;

-- AddForeignKey
ALTER TABLE "CookieConsentLog" ADD CONSTRAINT "CookieConsentLog_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "ScannedWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
