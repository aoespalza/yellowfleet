-- First, remove the default value
ALTER TABLE "Leasing" ALTER COLUMN "status" DROP DEFAULT;

-- Now change the type
ALTER TABLE "Leasing" ALTER COLUMN "status" TYPE "LeasingStatus" USING "status"::"LeasingStatus";

-- Add default back
ALTER TABLE "Leasing" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
