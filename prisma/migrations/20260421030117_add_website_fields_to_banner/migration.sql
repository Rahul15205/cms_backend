-- AlterTable
ALTER TABLE "CookieBanner" ADD COLUMN     "description" TEXT,
ADD COLUMN     "heading" TEXT,
ADD COLUMN     "themeColor" TEXT,
ADD COLUMN     "websiteId" TEXT;

-- AddForeignKey
ALTER TABLE "CookieBanner" ADD CONSTRAINT "CookieBanner_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "ScannedWebsite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
