# YellowFleet - Traslado a Nuevo Equipo

## Pasos para ejecutar

### 1. Copiar proyecto
Copia toda la carpeta `yellowfleet` al nuevo equipo.

### 2. Instalar PostgreSQL
Descarga desde: https://www.postgresql.org/download/

### 3. Ejecutar instalación
Abre PowerShell como **administrador** y ejecuta:

```powershell
cd C:\ruta\a\yellowfleet
.\install.ps1
```

El script te pedira:
- Host de PostgreSQL (default: localhost)
- Puerto (default: 5432)
- Usuario (default: postgres)
- Contraseña
- Nombre de BD (default: yellow_machinery_erp)

### 4. (Opcional) Importar datos
Si tienes datos en el equipo anterior, exportalos e importalos:

**En el equipo anterior:**
```powershell
.\export.ps1
```
Copia la carpeta `backup` al nuevo equipo.

**En el nuevo equipo:**
```powershell
.\import.ps1
```

## Ejecutar el proyecto

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## Estructura de archivos

```
yellowfleet/
├── install.ps1      # Script de instalación
├── export.ps1       # Exportar datos
├── import.ps1       # Importar datos
├── backup/          # Datos exportados
│   ├── operators.csv
│   ├── machines.csv
│   └── ...
├── backend/         # Código del backend
└── frontend/       # Código del frontend
```
