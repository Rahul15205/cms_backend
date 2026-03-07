-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('CRM', 'ANALYTICS', 'CUSTOM', 'ERP', 'COMMUNICATION', 'IDENTITY', 'STORAGE', 'GATEWAY', 'CONNECTOR');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'PENDING', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('AUDIT', 'CONSENT', 'RIGHTS', 'GRIEVANCE', 'SECURITY', 'SYSTEM');

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL DEFAULT 'CUSTOM',
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "icon" TEXT,
    "lastSync" TIMESTAMP(3),
    "apiCalls" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "errorMessage" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptionConfig" (
    "id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "keyRotationDays" INTEGER NOT NULL DEFAULT 90,
    "lastRotation" TIMESTAMP(3),
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "provider" TEXT NOT NULL DEFAULT 'KMS',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncryptionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogRetentionRule" (
    "id" TEXT NOT NULL,
    "logType" "LogType" NOT NULL,
    "retentionPeriod" INTEGER NOT NULL DEFAULT 365,
    "retentionUnit" TEXT NOT NULL DEFAULT 'days',
    "regulation" TEXT,
    "autoArchive" BOOLEAN NOT NULL DEFAULT true,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogRetentionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'csv',
    "scheduleFrequency" TEXT NOT NULL DEFAULT 'on-demand',
    "scheduledTime" TEXT,
    "recipients" TEXT[],
    "dataMaskingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "brandingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "lastExecuted" TIMESTAMP(3),
    "nextExecution" TIMESTAMP(3),
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AadhaarConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "verificationMode" TEXT NOT NULL DEFAULT 'otp',
    "usageScopes" TEXT[],
    "consentRequired" BOOLEAN NOT NULL DEFAULT true,
    "consentText" TEXT,
    "consentRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "autoPurgeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoPurgeDays" INTEGER NOT NULL DEFAULT 7,
    "serviceProviderName" TEXT,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AadhaarConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptionConfig_tenantId_key" ON "EncryptionConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AadhaarConfig_tenantId_key" ON "AadhaarConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptionConfig" ADD CONSTRAINT "EncryptionConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogRetentionRule" ADD CONSTRAINT "LogRetentionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportConfig" ADD CONSTRAINT "ExportConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AadhaarConfig" ADD CONSTRAINT "AadhaarConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowConfig" ADD CONSTRAINT "WorkflowConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
