-- DSAR Phase 1: Status Enum Refactor & New Fields
-- PHASE 1 CHANGE — Migration for RightsRequestStatus enum overhaul

-- ============================================================
-- Step 1: Add NEW enum values to the existing PostgreSQL type
-- ============================================================
ALTER TYPE "RightsRequestStatus" ADD VALUE IF NOT EXISTS 'IN_VERIFICATION';   -- PHASE 1 CHANGE
ALTER TYPE "RightsRequestStatus" ADD VALUE IF NOT EXISTS 'PARTIAL_FULFILMENT'; -- PHASE 1 CHANGE
ALTER TYPE "RightsRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';          -- PHASE 1 CHANGE

-- Force the transaction to see the new enum values
-- (PostgreSQL requires COMMIT before new enum values are usable in DML in the same txn,
--  so we use a separate step via column swap below.)

-- ============================================================
-- Step 2: Migrate existing rows from old → new status values
--         Using a safe column-swap pattern since PostgreSQL
--         cannot drop enum values in-place.
-- ============================================================

-- 2a. Create a temporary text column to hold status values
ALTER TABLE "RightsRequest" ADD COLUMN "status_tmp" TEXT; -- PHASE 1 CHANGE

-- 2b. Copy current status values into the temp column, mapping old → new
UPDATE "RightsRequest" SET "status_tmp" = CASE "status"::TEXT
    WHEN 'IDENTITY_VERIFIED' THEN 'IN_VERIFICATION'     -- PHASE 1 CHANGE
    WHEN 'ACKNOWLEDGED'      THEN 'IN_REVIEW'           -- PHASE 1 CHANGE
    WHEN 'RESPONSE_SENT'     THEN 'ACTION_TAKEN'        -- PHASE 1 CHANGE
    WHEN 'CLOSED'            THEN 'COMPLETED'            -- PHASE 1 CHANGE
    ELSE "status"::TEXT                                   -- Keep all other values as-is
END;

-- 2c. Drop the old status column (which carries the old enum type)
ALTER TABLE "RightsRequest" DROP COLUMN "status"; -- PHASE 1 CHANGE

-- 2d. Rebuild the enum type without the removed values.
--     PostgreSQL doesn't support ALTER TYPE DROP VALUE, so we recreate.
ALTER TYPE "RightsRequestStatus" RENAME TO "RightsRequestStatus_old"; -- PHASE 1 CHANGE

CREATE TYPE "RightsRequestStatus" AS ENUM (
    'RECEIVED',
    'IN_VERIFICATION',
    'IN_REVIEW',
    'ON_HOLD',
    'ACTION_TAKEN',
    'PARTIAL_FULFILMENT',
    'ESCALATED',
    'COMPLETED',
    'REJECTED'
); -- PHASE 1 CHANGE

-- 2e. Re-add the status column using the new clean enum type
ALTER TABLE "RightsRequest" ADD COLUMN "status" "RightsRequestStatus" NOT NULL DEFAULT 'RECEIVED'; -- PHASE 1 CHANGE

-- 2f. Populate from the temp column
UPDATE "RightsRequest" SET "status" = "status_tmp"::"RightsRequestStatus"; -- PHASE 1 CHANGE

-- 2g. Drop temp column and old enum type
ALTER TABLE "RightsRequest" DROP COLUMN "status_tmp"; -- PHASE 1 CHANGE
DROP TYPE "RightsRequestStatus_old";                  -- PHASE 1 CHANGE

-- ============================================================
-- Step 3: Create the new RejectionReason enum
-- ============================================================
CREATE TYPE "RejectionReason" AS ENUM (
    'INSUFFICIENT_ID',
    'DUPLICATE',
    'OUT_OF_SCOPE',
    'FRAUDULENT',
    'OTHER'
); -- PHASE 1 CHANGE

-- ============================================================
-- Step 4: Add new columns to RightsRequest table
-- ============================================================

-- SLA tracking columns
ALTER TABLE "RightsRequest" ADD COLUMN "slaBreached"       BOOLEAN   NOT NULL DEFAULT false; -- PHASE 1 CHANGE
ALTER TABLE "RightsRequest" ADD COLUMN "slaBreachedAt"     TIMESTAMP(3);                     -- PHASE 1 CHANGE
ALTER TABLE "RightsRequest" ADD COLUMN "slaPausedAt"       TIMESTAMP(3);                     -- PHASE 1 CHANGE

-- Escalation tracking columns
ALTER TABLE "RightsRequest" ADD COLUMN "escalatedTo"       TEXT;                              -- PHASE 1 CHANGE
ALTER TABLE "RightsRequest" ADD COLUMN "escalationReason"  TEXT;                              -- PHASE 1 CHANGE

-- Rejection tracking columns
ALTER TABLE "RightsRequest" ADD COLUMN "rejectionReason"   "RejectionReason";                 -- PHASE 1 CHANGE
ALTER TABLE "RightsRequest" ADD COLUMN "rejectionComment"  TEXT;                              -- PHASE 1 CHANGE

-- Fulfilment tracking columns
ALTER TABLE "RightsRequest" ADD COLUMN "partialFulfilment" JSONB;                             -- PHASE 1 CHANGE
ALTER TABLE "RightsRequest" ADD COLUMN "completedAt"       TIMESTAMP(3);                     -- PHASE 1 CHANGE
