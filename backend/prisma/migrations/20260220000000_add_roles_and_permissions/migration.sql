-- Create Role table
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canCreateMachine" BOOLEAN NOT NULL DEFAULT false,
    "canEditMachine" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteMachine" BOOLEAN NOT NULL DEFAULT false,
    "canUpdateHourMeter" BOOLEAN NOT NULL DEFAULT false,
    "canCreateContract" BOOLEAN NOT NULL DEFAULT false,
    "canEditContract" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteContract" BOOLEAN NOT NULL DEFAULT false,
    "canAssignMachine" BOOLEAN NOT NULL DEFAULT false,
    "canCreateWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "canEditWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "canCloseWorkOrder" BOOLEAN NOT NULL DEFAULT false,
    "canEditLegalDocuments" BOOLEAN NOT NULL DEFAULT false,
    "canCreateUser" BOOLEAN NOT NULL DEFAULT false,
    "canEditUser" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteUser" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Insert default roles
INSERT INTO "Role" ("id", "name", "description", "canCreateMachine", "canEditMachine", "canDeleteMachine", "canUpdateHourMeter", "canCreateContract", "canEditContract", "canDeleteContract", "canAssignMachine", "canCreateWorkOrder", "canEditWorkOrder", "canDeleteWorkOrder", "canCloseWorkOrder", "canEditLegalDocuments", "canCreateUser", "canEditUser", "canDeleteUser", "canManageRoles", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administrador con todos los permisos', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000002', 'MANAGER', 'Gerente con permisos de gestión', true, true, false, true, true, true, false, true, true, true, true, true, false, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('a0000000-0000-0000-0000-000000000003', 'OPERATOR', 'Operador con permisos básicos', false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Alter User table to change role to String
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';

-- Add foreign key to Role
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("name") ON DELETE SET DEFAULT ON UPDATE CASCADE;
