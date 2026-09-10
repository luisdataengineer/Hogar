# =============================================================
# backup.ps1  ·  Backup del proyecto Supabase enlazado
#
# Uso:      pwsh scripts/backup.ps1
# Requiere: - CLI de Supabase
#           - proyecto enlazado (supabase link --project-ref ...)
#           - variable de entorno SUPABASE_DB_PASSWORD con la
#             contrasena de la BD del proyecto
#
# Genera en backups/<fecha>/ tres archivos:
#   roles.sql   - roles del cluster
#   schema.sql  - estructura (tablas, RLS, funciones, triggers) del esquema public
#   data.sql    - datos del esquema public (COPY)
#
# Cubre TUS datos (esquema public). No incluye auth.users: eso lo
# gestiona Supabase y su backup de plataforma lo cubre.
#
# Restaurar en una base vacia (en orden):
#   psql "<connection string>" -f roles.sql
#   psql "<connection string>" -f schema.sql
#   psql "<connection string>" -f data.sql
#
# Programar (Windows): Task Scheduler > tarea basica > diaria >
#   Programa: pwsh   Argumentos: -File "W:\Hogar\scripts\backup.ps1"
#   (definir SUPABASE_DB_PASSWORD como variable de entorno del sistema)
# =============================================================
$ErrorActionPreference = "Stop"

$raiz = Split-Path $PSScriptRoot -Parent
$fecha = Get-Date -Format "yyyy-MM-dd_HHmm"
$destino = Join-Path $raiz "backups\$fecha"

$pass = $env:SUPABASE_DB_PASSWORD
if (-not $pass) {
  throw "Falta la variable de entorno SUPABASE_DB_PASSWORD"
}

New-Item -ItemType Directory -Force -Path $destino | Out-Null
Push-Location $raiz
try {
  supabase db dump --linked -p $pass --role-only -f "$destino\roles.sql"
  supabase db dump --linked -p $pass -f "$destino\schema.sql"
  supabase db dump --linked -p $pass --data-only --use-copy -f "$destino\data.sql"
}
finally {
  Pop-Location
}

Write-Host "Backup guardado en $destino"
