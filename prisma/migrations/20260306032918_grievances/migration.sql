-- CreateEnum
CREATE TYPE "GrievanceCategory" AS ENUM ('DATA_ACCESS', 'CONSENT', 'PRIVACY', 'DATA_ERASURE', 'DATA_PORTABILITY', 'MINOR_CONSENT', 'NOTICE', 'SLA');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "GrievancePriority" AS ENUM ('GRV_LOW', 'GRV_MEDIUM', 'GRV_HIGH', 'GRV_CRITICAL');

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "category" "GrievanceCategory" NOT NULL,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'GRV_MEDIUM',
    "status" "GrievanceStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "assignedTeam" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrievanceComment" (
    "id" TEXT NOT NULL,
    "grievanceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrievanceComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grievance_caseNumber_key" ON "Grievance"("caseNumber");

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrievanceComment" ADD CONSTRAINT "GrievanceComment_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
