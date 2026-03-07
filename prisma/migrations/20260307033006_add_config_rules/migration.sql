-- CreateEnum
CREATE TYPE "SLADurationUnit" AS ENUM ('HOURS', 'DAYS');

-- CreateEnum
CREATE TYPE "SLADayType" AS ENUM ('WORKING', 'CALENDAR');

-- CreateEnum
CREATE TYPE "SLAScope" AS ENUM ('RIGHTS', 'GRIEVANCES');

-- CreateEnum
CREATE TYPE "SLARuleStatus" AS ENUM ('SLA_ACTIVE', 'SLA_INACTIVE', 'SLA_ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('NOTIF_USER', 'NOTIF_ROLE', 'NOTIF_ADMIN', 'NOTIF_EXTERNAL');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('IMMEDIATE', 'BATCHED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "ConfigRuleStatus" AS ENUM ('CFG_ACTIVE', 'CFG_INACTIVE');

-- CreateEnum
CREATE TYPE "EscalationTrigger" AS ENUM ('SLA_BREACH', 'MANUAL_FLAG', 'RISK_SCORE', 'PRIORITY_CHANGE');

-- CreateEnum
CREATE TYPE "EscalationLevel" AS ENUM ('L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "EscalationAction" AS ENUM ('NOTIFY', 'REASSIGN', 'LOCK_CASE', 'ESCALATE_EXTERNAL');

-- CreateTable
CREATE TABLE "SlaRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regulation" "Regulation",
    "rightType" "RightsRequestType",
    "category" TEXT,
    "priority" TEXT,
    "duration" INTEGER NOT NULL,
    "durationUnit" "SLADurationUnit" NOT NULL DEFAULT 'DAYS',
    "dayType" "SLADayType" NOT NULL DEFAULT 'CALENDAR',
    "scope" "SLAScope" NOT NULL DEFAULT 'RIGHTS',
    "pauseConditions" TEXT[],
    "autoCloseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "breachActions" TEXT[],
    "status" "SLARuleStatus" NOT NULL DEFAULT 'SLA_ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "recipientType" "RecipientType" NOT NULL DEFAULT 'NOTIF_ROLE',
    "template" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "retryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerCondition" "EscalationTrigger" NOT NULL DEFAULT 'SLA_BREACH',
    "triggerThreshold" INTEGER,
    "escalationLevel" "EscalationLevel" NOT NULL DEFAULT 'L1',
    "recipientRole" TEXT NOT NULL,
    "recipientUser" TEXT,
    "action" "EscalationAction" NOT NULL DEFAULT 'NOTIFY',
    "maxLevels" INTEGER NOT NULL DEFAULT 3,
    "autoCloseOnResolution" BOOLEAN NOT NULL DEFAULT true,
    "status" "ConfigRuleStatus" NOT NULL DEFAULT 'CFG_ACTIVE',
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationRule" ADD CONSTRAINT "EscalationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
