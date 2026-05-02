-- YellowFleet - Exportar Datos
-- Ejecutar en pgAdmin o con psql

-- 1. Tablas principales
SELECT 'Exportando datos...' as status;

-- Operadores
\copy Operator(id, name, "licenseNumber", phone, email, "hireDate", "isActive", notes, "photoUrl", empresa, arl, eps, "grupoSanguineo", "createdAt", "updatedAt") 
TO 'C:\Users\aespalza\yellowfleet\backup\operators.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Maquinas
\copy Machine(id, name, brand, model, "serialNumber", "plateNumber", "year", "isActive", "hourlyRate", "notes", "photoUrl", "currentOperatorId", "createdAt", "updatedAt") 
TO 'C:\Users\aespalza\yellowfleet\backup\machines.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Empresas (Contracts)
\copy Company(id, name, rut, address, phone, email, contact, "isActive", "createdAt", "updatedAt") 
TO 'C:\Users\aespalza\yellowfleet\backup\companies.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Contratos
\copy Contract(id, "companyId", "machineId", "startDate", "endDate", "monthlyRate", "status", notes, "createdAt", "updatedAt") 
TO 'C:\Users\aespalza\yellowfleet\backup\contracts.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Asignaciones Maquina-Operador
\copy "MachineOperatorAssignment"(id, "machineId", "operatorId", "startDate", "endDate", "isActive", notes) 
TO 'C:\Users\aespalza\yellowfleet\backup\assignments.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

-- Horarios de trabajo
\copy WorkLog(id, "machineId", "operatorId", date, "startHour", "endHour", "totalHours", "hourlyRate", notes, "createdAt") 
TO 'C:\Users\aespalza\yellowfleet\backup\worklogs.csv' 
WITH (FORMAT CSV, HEADER, NULL '');

SELECT 'Datos exportados exitosamente a la carpeta backup/' as status;
