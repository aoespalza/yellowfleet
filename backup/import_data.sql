-- YellowFleet - Importar Datos
-- Ejecutar en pgAdmin o con psql

-- 1. Crear carpeta backup si no existe
-- Los archivos CSV deben estar en la carpeta backup/

-- 2. Importar datos (en orden correcto por dependencias)

-- Operadores
\copy Operator(id, name, "licenseNumber", phone, email, "hireDate", "isActive", notes, "photoUrl", empresa, arl, eps, "grupoSanguineo", "createdAt", "updatedAt") 
FROM 'C:\Users\aespalza\yellowfleet\backup\operators.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Maquinas
\copy Machine(id, name, brand, model, "serialNumber", "plateNumber", "year", "isActive", "hourlyRate", notes, "photoUrl", "currentOperatorId", "createdAt", "updatedAt") 
FROM 'C:\Users\aespalza\yellowfleet\backup\machines.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Empresas (Contracts)
\copy Company(id, name, rut, address, phone, email, contact, "isActive", "createdAt", "updatedAt") 
FROM 'C:\Users\aespalza\yellowfleet\backup\companies.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Contratos
\copy Contract(id, "companyId", "machineId", "startDate", "endDate", "monthlyRate", status, notes, "createdAt", "updatedAt") 
FROM 'C:\Users\aespalza\yellowfleet\backup\contracts.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Asignaciones Maquina-Operador
\copy "MachineOperatorAssignment"(id, "machineId", "operatorId", "startDate", "endDate", "isActive", notes) 
FROM 'C:\Users\aespalza\yellowfleet\backup\assignments.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Horarios de trabajo
\copy WorkLog(id, "machineId", "operatorId", date, "startHour", "endHour", "totalHours", "hourlyRate", notes, "createdAt") 
FROM 'C:\Users\aespalza\yellowfleet\backup\worklogs.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

SELECT 'Datos importados exitosamente!' as status;
