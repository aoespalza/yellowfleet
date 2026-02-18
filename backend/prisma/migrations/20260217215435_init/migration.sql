-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('AVAILABLE', 'IN_CONTRACT', 'IN_WORKSHOP', 'IN_TRANSFER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkOrderType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "hourMeter" DOUBLE PRECISION NOT NULL,
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionValue" DOUBLE PRECISION NOT NULL,
    "usefulLifeHours" DOUBLE PRECISION NOT NULL,
    "status" "MachineStatus" NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" "WorkOrderType" NOT NULL,
    "status" "WorkOrderStatus" NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "sparePartsCost" DOUBLE PRECISION NOT NULL,
    "laborCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "downtimeHours" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "status" "ContractStatus" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineAssignment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "workedHours" DOUBLE PRECISION NOT NULL,
    "maintenanceCost" DOUBLE PRECISION NOT NULL,
    "generatedIncome" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MachineAssignment_machineId_contractId_key" ON "MachineAssignment"("machineId", "contractId");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineAssignment" ADD CONSTRAINT "MachineAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineAssignment" ADD CONSTRAINT "MachineAssignment_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
