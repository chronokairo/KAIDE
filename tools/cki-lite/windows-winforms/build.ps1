# ============================================================
#  cki-lite desktop - Windows build script (PowerShell)
#  Uses the built-in .NET Framework csc.exe compiler.
#  Usage: .\build.ps1
# ============================================================
$ErrorActionPreference = 'Stop'

$framework = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $framework)) {
    $framework = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

if (-not (Test-Path $framework)) {
    Write-Host "[ERRO] csc.exe nao encontrado no .NET Framework 4.x" -ForegroundColor Red
    exit 1
}

$outDir = Join-Path (Get-Location) "bin"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$iconPath = Join-Path (Get-Location) "WinForms\app.ico"
$outPath  = Join-Path $outDir "cki-lite.exe"
$source   = Join-Path (Get-Location) "WinForms\cki-lite.cs"

Write-Host "[build] compilando WinForms\cki-lite.cs com:" -ForegroundColor Cyan
Write-Host "        $framework"

& $framework /nologo /target:winexe /platform:anycpu /optimize+ `
   /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll `
   /r:System.Core.dll `
   /win32icon:$iconPath `
   /out:$outPath `
   $source

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] falha ao compilar cki-lite.exe" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[ok] gerado: bin\cki-lite.exe" -ForegroundColor Green
Write-Host "     Execute com: .\bin\cki-lite.exe"
