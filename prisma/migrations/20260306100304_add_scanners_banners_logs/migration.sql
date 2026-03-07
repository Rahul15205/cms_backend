-- CreateEnum
CREATE TYPE "ScanFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScanDepth" AS ENUM ('STANDARD', 'DEEP');

-- CreateEnum
CREATE TYPE "BannerPosition" AS ENUM ('BOTTOM', 'TOP', 'CENTER', 'CORNER');

-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'ACTIVE');

-- CreateEnum
CREATE TYPE "ConsentLogStatus" AS ENUM ('ACCEPTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "ScannedWebsite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "frequency" "ScanFrequency" NOT NULL DEFAULT 'MONTHLY',
    "lastScan" TIMESTAMP(3),
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "depth" "ScanDepth" NOT NULL DEFAULT 'STANDARD',
    "email" TEXT,
    "autoCategorize" BOOLEAN NOT NULL DEFAULT false,
    "scanBehindLogin" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScannedWebsite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieBanner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "position" "BannerPosition" NOT NULL DEFAULT 'BOTTOM',
    "status" "BannerStatus" NOT NULL DEFAULT 'DRAFT',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookieBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" TEXT,
    "categories" TEXT[],
    "status" "ConsentLogStatus" NOT NULL DEFAULT 'ACCEPTED',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CookieConsentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScannedWebsite" ADD CONSTRAINT "ScannedWebsite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieBanner" ADD CONSTRAINT "CookieBanner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookieConsentLog" ADD CONSTRAINT "CookieConsentLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
