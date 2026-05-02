# YellowFleet - Exportar Datos
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

Write-Host "=====================================" -ForegroundColor $Cyan
Write-Host "  YellowFleet - Exportar Datos" -ForegroundColor $Cyan
Write-Host "=====================================" -ForegroundColor $Cyan
Write-Host ""

# Pedir contraseña
$dbPass = Read-Host "Contraseña de PostgreSQL" -AsSecureString
$dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

# Crear carpeta backup
$backupDir = "$PSScriptRoot\backup"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$env:PGPASSWORD = $dbPassPlain

# Tablas a exportar
$tables = @("Operator", "Machine", "Company", "Contract", "MachineOperatorAssignment", "WorkLog")

foreach ($table in $tables) {
    $file = "$backupDir\$table.csv"
    Write-Host "Exportando $table..." -ForegroundColor $Yellow
    
    $cmd = "psql -h $Host -p $Port -U $User -d $Database -c ""\COPY $table TO '$file' WITH (FORMAT CSV, HEADER, NULL '')"")"
    Invoke-Expression $cmd 2>$null
    
    if ($?) {
        Write-Host "  ✓ $table.csv" -ForegroundColor $Green
    } else {
        Write-Host "  ✗ Error exportando $table" -ForegroundColor $Red
    }
}

Remove-Variable dbPassPlain -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Exportación completada. Archivos en: $backupDir" -ForegroundColor $Cyan
