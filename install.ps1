# YellowFleet - Script de Instalación
# Ejecutar como administrador en PowerShell

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  YellowFleet - Instalación" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Colores
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan

# Función para verificar comando
function Test-Command($cmd) {
    $null = Get-Command $cmd -ErrorAction SilentlyContinue
    return $?
}

# 1. Verificar Node.js
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor $Cyan
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js instalado: $nodeVersion" -ForegroundColor $Green
} else {
    Write-Host "  ✗ Node.js NO encontrado. Instalar desde: https://nodejs.org/" -ForegroundColor $Red
    exit 1
}

# 2. Verificar PostgreSQL
Write-Host "[2/6] Verificando PostgreSQL..." -ForegroundColor $Cyan
if (Test-Command "psql") {
    Write-Host "  ✓ PostgreSQL instalado" -ForegroundColor $Green
} else {
    Write-Host "  ⚠ PostgreSQL NO encontrado. Instalación manual requerida." -ForegroundColor $Yellow
    Write-Host "    Descargar desde: https://www.postgresql.org/download/" -ForegroundColor $Yellow
}

# 3. Obtener información de la base de datos
Write-Host ""
Write-Host "[3/6] Configuración de Base de Datos" -ForegroundColor $Cyan
Write-Host "Ingrese los datos de conexión a PostgreSQL:"
$dbHost = Read-Host "  Host (default: localhost)"
if ($dbHost -eq "") { $dbHost = "localhost" }
$dbPort = Read-Host "  Puerto (default: 5432)"
if ($dbPort -eq "") { $dbPort = "5432" }
$dbUser = Read-Host "  Usuario (default: postgres)"
if ($dbUser -eq "") { $dbUser = "postgres" }
$dbPass = Read-Host "  Contraseña" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
$dbName = Read-Host "  Nombre de BD (default: yellow_machinery_erp)"
if ($dbName -eq "") { $dbName = "yellow_machinery_erp" }

# 4. Crear base de datos
Write-Host ""
Write-Host "[4/6] Creando base de datos..." -ForegroundColor $Cyan
$env:PGPASSWORD = $dbPassPlain
$createDbCmd = "CREATE DATABASE $dbName;"
$checkDbCmd = "SELECT 1 FROM pg_database WHERE datname = '$dbName'"

$dbExists = & psql -h $dbHost -p $dbPort -U $dbUser -d postgres -t -c $checkDbCmd 2>$null

if ($dbExists -match "1") {
    Write-Host "  ✓ Base de datos '$dbName' ya existe" -ForegroundColor $Yellow
} else {
    & psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c $createDbCmd 2>$null
    if ($?) {
        Write-Host "  ✓ Base de datos '$dbName' creada" -ForegroundColor $Green
    } else {
        Write-Host "  ✗ Error al crear la base de datos" -ForegroundColor $Red
    }
}

# 5. Crear archivo .env
Write-Host ""
Write-Host "[5/6] Configurando archivo .env..." -ForegroundColor $Cyan

$envContent = @"
# Database
DATABASE_URL="postgresql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}?schema=public"

# JWT
JWT_SECRET="yellowfleet-secret-key-change-in-production"

# Server
PORT=3000
"@

Set-Content -Path "$PSScriptRoot\backend\.env" -Value $envContent -Force
Write-Host "  ✓ Archivo .env creado" -ForegroundColor $Green

# 6. Instalar dependencias
Write-Host ""
Write-Host "[6/6] Instalando dependencias..." -ForegroundColor $Cyan

# Backend
Write-Host "  Instalando backend..." -ForegroundColor $Yellow
Set-Location "$PSScriptRoot\backend"
npm install 2>$null
if ($?) {
    Write-Host "    ✓ Backend instalado" -ForegroundColor $Green
} else {
    Write-Host "    ✗ Error en backend" -ForegroundColor $Red
}

# Frontend
Write-Host "  Instalando frontend..." -ForegroundColor $Yellow
Set-Location "$PSScriptRoot\frontend"
npm install 2>$null
if ($?) {
    Write-Host "    ✓ Frontend instalado" -ForegroundColor $Green
} else {
    Write-Host "    ✗ Error en frontend" -ForegroundColor $Red
}

# Sincronizar Prisma
Write-Host "  Sincronizando base de datos..." -ForegroundColor $Yellow
Set-Location "$PSScriptRoot\backend"
npx prisma db push 2>$null
if ($?) {
    Write-Host "    ✓ Base de datos sincronizada" -ForegroundColor $Green
} else {
    Write-Host "    ⚠ Sincronización manual requerida: npx prisma db push" -ForegroundColor $Yellow
}

# Limpiar
Remove-Variable dbPassPlain -ErrorAction SilentlyContinue

# Fin
Write-Host ""
Write-Host "=====================================" -ForegroundColor $Green
Write-Host "  Instalación completada!" -ForegroundColor $Green
Write-Host "=====================================" -ForegroundColor $Green
Write-Host ""
Write-Host "Para ejecutar el proyecto:" -ForegroundColor $Cyan
Write-Host "  Backend: cd backend > npm run dev" -ForegroundColor White
Write-Host "  Frontend: cd frontend > npm run dev" -ForegroundColor White
Write-Host ""
