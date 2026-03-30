/*
  Warnings:

  - A unique constraint covering the columns `[emailHash]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Grievance" ADD COLUMN     "userEmailHash" TEXT;

-- AlterTable
ALTER TABLE "RightsRequest" ADD COLUMN     "aadhaarHash" TEXT,
ADD COLUMN     "aadhaarNumber" TEXT,
ADD COLUMN     "requesterEmailHash" TEXT,
ADD COLUMN     "requesterPhoneHash" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhaarHash" TEXT,
ADD COLUMN     "aadhaarNumber" TEXT,
ADD COLUMN     "emailHash" TEXT,
ADD COLUMN     "phoneHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
