-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "nearBreachAlertSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaAlertSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RightsRequest" ADD COLUMN     "nearBreachAlertSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaAlertSent" BOOLEAN NOT NULL DEFAULT false;
