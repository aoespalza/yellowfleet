-- Insert roles with all required fields
INSERT INTO "Role" (id, name, description, "canCreateMachine", "canEditMachine", "canDeleteMachine", 
  "canUpdateHourMeter", "canCreateContract", "canEditContract", "canDeleteContract", "canAssignMachine",
  "canCreateWorkOrder", "canEditWorkOrder", "canDeleteWorkOrder", "canCloseWorkOrder", 
  "canEditLegalDocuments", "canCreateUser", "canEditUser", "canDeleteUser", "canManageRoles",
  "createdAt", "updatedAt") VALUES 
('a0000000-0000-0000-0000-000000000001', 'ADMIN', 'Administrador con todos los permisos',
  true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
  NOW(), NOW()),
('a0000000-0000-0000-0000-000000000002', 'MANAGER', 'Gerente con permisos de gestión',
  true, true, false, true, true, true, false, true, true, true, true, true, false, false, false, false,
  NOW(), NOW()),
('a0000000-0000-0000-0000-000000000003', 'OPERATOR', 'Operador con permisos básicos',
  false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false,
  NOW(), NOW());