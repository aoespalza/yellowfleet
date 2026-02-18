/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Machine` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Machine" ALTER COLUMN "year" DROP NOT NULL,
ALTER COLUMN "serialNumber" DROP NOT NULL,
ALTER COLUMN "hourMeter" DROP NOT NULL,
ALTER COLUMN "acquisitionDate" DROP NOT NULL,
ALTER COLUMN "acquisitionValue" DROP NOT NULL,
ALTER COLUMN "usefulLifeHours" DROP NOT NULL,
ALTER COLUMN "currentLocation" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");
