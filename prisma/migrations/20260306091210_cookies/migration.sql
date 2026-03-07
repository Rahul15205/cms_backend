-- CreateEnum
CREATE TYPE "CookieCategoryType" AS ENUM ('NECESSARY', 'ANALYTICS', 'FUNCTIONAL', 'ADVERTISING', 'UNCATEGORIZED');

-- CreateTable
CREATE TABLE "CookieCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CookieCategoryType" NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookieCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieInventory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "expiration" TEXT,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookieInventory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CookieCategory" ADD CONSTRAINT "CookieCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieInventory" ADD CONSTRAINT "CookieInventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CookieCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieInventory" ADD CONSTRAINT "CookieInventory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
