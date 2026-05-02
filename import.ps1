# YellowFleet - Importar Datos
# Ejecutar en PowerShell

param(
    [string]$Host = "localhost",
    [string]$Port = "5432",
    [string]$User = "postgres",
    [string]$Database = "yellow_machinery_erp"
)

$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Cyan = [ConsoleColor]::Cyan
$Red = [ConsoleColor]::Red
$Red2 = [ConsoleColor]::DarkRed

Write-Host "=====================================" -ForegroundColor $Cyan
Write-Host "  YellowFleet - Importar Datos" -ForegroundColor $Cyan
Write-Host "=====================================" -ForegroundColor $Cyan
Write-Host ""
Write-Host "⚠ ADVERTENCIA: Esto eliminará los datos actuales!" -ForegroundColor $Red2
$confirm = Read-Host "Escriba 'SI' para continuar"
if ($confirm -ne "SI") {
    Write-Host "Operación cancelada." -ForegroundColor $Yellow
    exit
}

# Pedir contraseña
$dbPass = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

$backupDir = "$PSScriptRoot\backup"
if (-not (Test-Path $backupDir)) {
    Write-Host "✗ Carpeta backup no encontrada" -ForegroundColor $Red
    exit
}

$env:PGPASSWORD = $dbPassPlain

# Orden de importación (por dependencias)
$tables = @("Operator", "Machine", "Company", "Contract", "MachineOperatorAssignment", "WorkLog")

foreach ($table in $tables) {
    $file = "$backupDir\$table.csv"
    if (-not (Test-Path $file)) {
        Write-Host "  ⚠ $table.csv no encontrado, saltando..." -ForegroundColor $Yellow
        continue
    }
    
    Write-Host "Importando $table..." -ForegroundColor $Yellow
    
    $cmd = "psql -h $Host -p $Port -U $User -d $Database -c ""\COPY $table FROM '$file' WITH (FORMAT CSV, HEADER, NULL '')"")"
    Invoke-Expression $cmd 2>$null
    
    if ($?) {
        Write-Host "  ✓ $table" -ForegroundColor $Green
    } else {
        Write-Host "  ✗ Error importando $table" -ForegroundColor $Red
    }
}

Remove-Variable dbPassPlain -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Importación completada." -ForegroundColor $Cyan
