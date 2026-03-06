-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('EXPLICIT', 'IMPLICIT', 'OPTIONAL', 'MANDATORY', 'GRANULAR', 'PARENTAL');

-- CreateEnum
CREATE TYPE "Regulation" AS ENUM ('DPDP', 'GDPR', 'TAPA', 'PDPL', 'CUSTOM', 'CCPA', 'LGPD', 'PIPL');

-- CreateEnum
CREATE TYPE "TargetUserCategory" AS ENUM ('CUSTOMER', 'EMPLOYEE', 'VENDOR', 'MINOR', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "ConsentGivenBy" AS ENUM ('SELF', 'GUARDIAN', 'REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "ConsentMechanism" AS ENUM ('CHECKBOX', 'TOGGLE', 'SIGNATURE', 'CLICK_TO_CONFIRM', 'AUDIO_VIDEO');

-- CreateEnum
CREATE TYPE "PurposeNecessity" AS ENUM ('ESSENTIAL', 'NON_ESSENTIAL');

-- CreateEnum
CREATE TYPE "DataCategory" AS ENUM ('IDENTITY', 'CONTACT', 'FINANCIAL', 'HEALTH', 'BIOMETRIC', 'BEHAVIORAL', 'LOCATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('DIRECT', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "ThirdPartyRole" AS ENUM ('DATA_PROCESSOR', 'JOINT_CONTROLLER', 'SUB_PROCESSOR');

-- AlterTable
ALTER TABLE "ConsentTemplate" ADD COLUMN     "ageThreshold" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "auditTrailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "consentGivenBy" "ConsentGivenBy" NOT NULL DEFAULT 'SELF',
ADD COLUMN     "dataSharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "mechanism" "ConsentMechanism" NOT NULL DEFAULT 'CHECKBOX',
ADD COLUMN     "noExpiry" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacyNoticeRef" TEXT,
ADD COLUMN     "regulations" "Regulation"[],
ADD COLUMN     "separateConsents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportedLanguages" TEXT[],
ADD COLUMN     "targetUserCategory" "TargetUserCategory"[],
ADD COLUMN     "type" "ConsentType" NOT NULL DEFAULT 'EXPLICIT',
ADD COLUMN     "validityEnd" TIMESTAMP(3),
ADD COLUMN     "validityStart" TIMESTAMP(3),
ADD COLUMN     "withdrawVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Purpose" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "necessity" "PurposeNecessity" NOT NULL,
    "automatedProcessing" BOOLEAN NOT NULL DEFAULT false,
    "profilingUsage" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCategoryConfig" (
    "id" TEXT NOT NULL,
    "category" "DataCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,
    "source" "DataSource" NOT NULL DEFAULT 'DIRECT',
    "description" TEXT,
    "country" TEXT,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataCategoryConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdParty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ThirdPartyRole" NOT NULL,
    "purpose" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "crossBorderTransfer" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubProcessor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "changeNotification" TEXT,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubProcessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetention" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "postWithdrawalRules" TEXT,
    "expireConsentOnRetentionEnd" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityMeasures" (
    "id" TEXT NOT NULL,
    "encryptionAtRest" BOOLEAN NOT NULL DEFAULT false,
    "encryptionInTransit" BOOLEAN NOT NULL DEFAULT false,
    "accessControls" TEXT,
    "monitoringLogging" TEXT,
    "incidentResponse" TEXT,
    "certifications" TEXT[],
    "additionalMeasures" TEXT[],
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityMeasures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalInfo" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "rightsLink" TEXT,
    "processingTimeline" TEXT,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataRetention_templateId_key" ON "DataRetention"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityMeasures_templateId_key" ON "SecurityMeasures"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalInfo_templateId_key" ON "WithdrawalInfo"("templateId");

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategoryConfig" ADD CONSTRAINT "DataCategoryConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdParty" ADD CONSTRAINT "ThirdParty_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubProcessor" ADD CONSTRAINT "SubProcessor_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRetention" ADD CONSTRAINT "DataRetention_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityMeasures" ADD CONSTRAINT "SecurityMeasures_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalInfo" ADD CONSTRAINT "WithdrawalInfo_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ConsentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
