-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('CONSENT', 'RIGHTS', 'COMPLIANCE', 'AUDIT');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'JSON', 'XLSX');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RPT_PENDING', 'RPT_COMPLETED', 'RPT_FAILED');

-- CreateEnum
CREATE TYPE "SystemLogCategory" AS ENUM ('LOG_CONSENT', 'LOG_RIGHTS', 'LOG_SECURITY', 'LOG_SYSTEM', 'LOG_AUDIT', 'LOG_COMPLIANCE');

-- CreateTable
CREATE TABLE "GeneratedReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL DEFAULT 'CSV',
    "status" "ReportStatus" NOT NULL DEFAULT 'RPT_PENDING',
    "generatedBy" TEXT NOT NULL,
    "filePath" TEXT,
    "fileSize" INTEGER,
    "parameters" JSONB,
    "errorMessage" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "category" "SystemLogCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "userName" TEXT,
    "target" TEXT,
    "ipAddress" TEXT,
    "details" JSONB,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidgetConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidgetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "integrationMode" TEXT NOT NULL,
    "authMethod" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "description" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardWidgetConfig_userId_key" ON "DashboardWidgetConfig"("userId");
