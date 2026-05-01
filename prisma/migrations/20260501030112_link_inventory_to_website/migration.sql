-- AlterTable
ALTER TABLE "CookieInventory" ADD COLUMN     "websiteId" TEXT;

-- AddForeignKey
ALTER TABLE "CookieInventory" ADD CONSTRAINT "CookieInventory_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "ScannedWebsite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
