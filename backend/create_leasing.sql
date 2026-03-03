CREATE TABLE IF NOT EXISTS "Leasing" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "machineId" TEXT NOT NULL UNIQUE,
    "purchaseValue" DOUBLE PRECISION NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "entity" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPayments" INTEGER NOT NULL,
    "paidPayments" INTEGER NOT NULL,
    "remainingPayments" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Leasing" ADD CONSTRAINT "Leasing_machineId_fkey" 
FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE;
