-- Insert roles without specifying all columns (use defaults)
INSERT INTO "Role" (id, name, description) VALUES 
('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administrador con todos los permisos'),
('a0000000-0000-0000-0000-000000000002', 'MANAGER', 'Gerente con permisos de gestión'),
('a0000000-0000-0000-0000-000000000003', 'OPERATOR', 'Operador con permisos básicos');

-- Update permissions for ADMIN
UPDATE "Role" SET 
canCreateMachine = true, canEditMachine = true, canDeleteMachine = true,
canUpdateHourMeter = true, canCreateContract = true, canEditContract = true,
canDeleteContract = true, canAssignMachine = true, canCreateWorkOrder = true,
canEditWorkOrder = true, canDeleteWorkOrder = true, canCloseWorkOrder = true,
canEditLegalDocuments = true, canCreateUser = true, canEditUser = true,
canDeleteUser = true, canManageRoles = true
WHERE name = 'ADMIN';

-- Update permissions for MANAGER
UPDATE "Role" SET 
canCreateMachine = true, canEditMachine = true, canDeleteMachine = false,
canUpdateHourMeter = true, canCreateContract = true, canEditContract = true,
canDeleteContract = false, canAssignMachine = true, canCreateWorkOrder = true,
canEditWorkOrder = true, canDeleteWorkOrder = true, canCloseWorkOrder = true,
canEditLegalDocuments = true, canCreateUser = false, canEditUser = false,
canDeleteUser = false, canManageRoles = false
WHERE name = 'MANAGER';

-- Update permissions for OPERATOR
UPDATE "Role" SET 
canCreateMachine = false, canEditMachine = false, canDeleteMachine = false,
canUpdateHourMeter = true, canCreateContract = false, canEditContract = false,
canDeleteContract = false, canAssignMachine = false, canCreateWorkOrder = false,
canEditWorkOrder = false, canDeleteWorkOrder = false, canCloseWorkOrder = false,
canEditLegalDocuments = false, canCreateUser = false, canEditUser = false,
canDeleteUser = false, canManageRoles = false
WHERE name = 'OPERATOR';
