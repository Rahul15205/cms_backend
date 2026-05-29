-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_tenantId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ApiKey_key_key";

-- AlterTable (drop legacy fields and update structure)
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "name";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "key";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "scopes";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "lastUsed";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "status";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "updatedAt";

-- Add Phase 6 secure fields
ALTER TABLE "ApiKey" ADD COLUMN "keyHash" TEXT NOT NULL;
ALTER TABLE "ApiKey" ADD COLUMN "label" TEXT NOT NULL;
ALTER TABLE "ApiKey" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ApiKey" ADD COLUMN "lastUsedAt" TIMESTAMP(3);

-- Alter tenantId to be non-nullable
ALTER TABLE "ApiKey" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
