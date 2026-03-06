-- CreateEnum
CREATE TYPE "ConsentVersionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "DeploymentMode" AS ENUM ('MANUAL', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('DEPLOYED', 'PENDING', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "DeploymentLogStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "ConsentUsageStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApplicationUsageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "ApplicationUsageType" AS ENUM ('CRM', 'HRMS', 'WEBSITE', 'API', 'MOBILE', 'ERP', 'INTERNAL');

-- AlterTable
ALTER TABLE "ConsentDeployment" ADD COLUMN     "activationDate" TIMESTAMP(3),
ADD COLUMN     "affectedUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "deployedBy" TEXT,
ADD COLUMN     "deploymentMode" "DeploymentMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "lockedAfterActivation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platform" TEXT[],
ADD COLUMN     "region" TEXT,
ADD COLUMN     "rollbackAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rollbackConditions" TEXT,
ADD COLUMN     "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "userSegment" TEXT;

-- AlterTable
ALTER TABLE "ConsentVersion" ADD COLUMN     "approvalTimestamp" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "changeSummary" TEXT,
ADD COLUMN     "changedFields" TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "reconsentTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "ConsentVersionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "usersImpacted" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DeploymentLog" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT NOT NULL,
    "details" TEXT,
    "status" "DeploymentLogStatus" NOT NULL DEFAULT 'SUCCESS',

    CONSTRAINT "DeploymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentUsageRecord" (
    "id" TEXT NOT NULL,
    "userIdentifier" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "purposeMapped" TEXT NOT NULL,
    "systemApp" TEXT NOT NULL,
    "consentDateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentStatus" "ConsentUsageStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastValidation" TIMESTAMP(3),

    CONSTRAINT "ConsentUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationUsage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "applicationName" TEXT NOT NULL,
    "applicationType" "ApplicationUsageType" NOT NULL,
    "systemOwner" TEXT,
    "purposeUsed" TEXT NOT NULL,
    "lastValidation" TIMESTAMP(3),
    "status" "ApplicationUsageStatus" NOT NULL DEFAULT 'ACTIVE',
    "usersConsented" INTEGER NOT NULL DEFAULT 0,
    "violations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApplicationUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeploymentLog" ADD CONSTRAINT "DeploymentLog_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "ConsentDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentUsageRecord" ADD CONSTRAINT "ConsentUsageRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationUsage" ADD CONSTRAINT "ApplicationUsage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
