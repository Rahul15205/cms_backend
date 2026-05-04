-- AlterTable
ALTER TABLE "ScannedWebsite" ADD COLUMN     "changeDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "complianceGrade" TEXT,
ADD COLUMN     "complianceScore" DOUBLE PRECISION,
ADD COLUMN     "cookiesDetected" INTEGER,
ADD COLUMN     "nextScheduledScan" TIMESTAMP(3),
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "pagesCrawled" INTEGER,
ADD COLUMN     "pocEmail" TEXT,
ADD COLUMN     "pocName" TEXT,
ADD COLUMN     "previousScore" DOUBLE PRECISION,
ADD COLUMN     "riskLevel" TEXT,
ADD COLUMN     "scanResults" JSONB,
ADD COLUMN     "thirdPartyScripts" JSONB;
