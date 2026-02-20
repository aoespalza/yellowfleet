-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('POLIZA', 'SOAT', 'TECNICO_MECANICA');

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "insuranceName" TEXT,
    "policyNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_machineId_type_key" ON "LegalDocument"("machineId", "type");

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
