-- CreateEnum
CREATE TYPE "RightsRequestType" AS ENUM ('FILE_COMPLAINT', 'WITHDRAW_CONSENT', 'ACCESS', 'CORRECTION', 'ERASURE', 'GRIEVANCE_REDRESSAL', 'NOMINATE');

-- CreateEnum
CREATE TYPE "RightsRequestStatus" AS ENUM ('RECEIVED', 'IDENTITY_VERIFIED', 'ACKNOWLEDGED', 'IN_REVIEW', 'ACTION_TAKEN', 'RESPONSE_SENT', 'CLOSED', 'REJECTED', 'ESCALATED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RightsRequestPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VER_PENDING', 'VERIFIED', 'VER_FAILED', 'VER_EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('OTP', 'EMAIL_VERIFY', 'AADHAAR_EKYC', 'DIGILOCKER', 'KNOWLEDGE_BASED', 'AUTHORIZED_REP', 'MANUAL_VERIFY');

-- CreateEnum
CREATE TYPE "SubmissionChannel" AS ENUM ('WEB', 'API_CHANNEL', 'EMAIL_CHANNEL', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "WorkflowStepStatus" AS ENUM ('WF_PENDING', 'WF_IN_PROGRESS', 'WF_COMPLETED', 'WF_SKIPPED');

-- CreateEnum
CREATE TYPE "CaseNoteType" AS ENUM ('NOTE_INTERNAL', 'NOTE_EXTERNAL');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('IDENTITY_PROOF', 'DATA_EXTRACT', 'DELETION_CONFIRMATION', 'COMMUNICATION', 'ATT_OTHER');

-- CreateTable
CREATE TABLE "RightsRequest" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "type" "RightsRequestType" NOT NULL,
    "regulation" "Regulation" NOT NULL,
    "status" "RightsRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "RightsRequestPriority" NOT NULL DEFAULT 'NORMAL',
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT,
    "isAuthorizedRep" BOOLEAN NOT NULL DEFAULT false,
    "authorizedRepDetails" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'VER_PENDING',
    "verificationMethod" "VerificationMethod",
    "reVerificationRequired" BOOLEAN NOT NULL DEFAULT false,
    "fraudFlag" BOOLEAN NOT NULL DEFAULT false,
    "dataCategories" TEXT[],
    "description" TEXT NOT NULL,
    "relatedConsents" TEXT[],
    "relatedApplications" TEXT[],
    "submissionChannel" "SubmissionChannel" NOT NULL DEFAULT 'WEB',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "assignedTeam" TEXT,
    "currentStep" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "WorkflowStepStatus" NOT NULL DEFAULT 'WF_PENDING',
    "assignedRole" TEXT,
    "slaHours" INTEGER,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "CaseNoteType" NOT NULL DEFAULT 'NOTE_INTERNAL',
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachments" TEXT[],

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "category" "AttachmentCategory" NOT NULL DEFAULT 'ATT_OTHER',
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,

    CONSTRAINT "CaseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightsAuditEntry" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "systemApplication" TEXT,
    "ipAddress" TEXT,
    "consentVersion" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',

    CONSTRAINT "RightsAuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RightsRequest_caseNumber_key" ON "RightsRequest"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_requestId_order_key" ON "WorkflowStep"("requestId", "order");

-- AddForeignKey
ALTER TABLE "RightsRequest" ADD CONSTRAINT "RightsRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RightsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RightsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAttachment" ADD CONSTRAINT "CaseAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RightsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RightsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightsAuditEntry" ADD CONSTRAINT "RightsAuditEntry_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RightsRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
