/*
  Warnings:

  - Made the column `priority` on table `SlaRule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SlaRule" ALTER COLUMN "priority" SET NOT NULL;
