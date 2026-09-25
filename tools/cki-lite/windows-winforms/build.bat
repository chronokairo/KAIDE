@echo off
rem ============================================================
rem  cki-lite desktop - Windows build script (no installs needed)
rem  Uses the built-in .NET Framework csc.exe compiler.
rem ============================================================
setlocal

set FRAMEWORK_DIR=C:\Windows\Microsoft.NET\Framework64\v4.0.30319
if not exist "%FRAMEWORK_DIR%\csc.exe" (
  set FRAMEWORK_DIR=C:\Windows\Microsoft.NET\Framework\v4.0.30319
)

set TOOLCHAIN=%FRAMEWORK_DIR%\csc.exe
set OUT_DIR=bin

if not exist "%TOOLCHAIN%" (
  echo [ERRO] csc.exe nao encontrado no .NET Framework 4.x.
  exit /b 1
)

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo [build] compilando WinForms\cki-lite.cs com:
echo         %TOOLCHAIN%

"%TOOLCHAIN%" /nologo /target:winexe /platform:anycpu /optimize+ ^
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll ^
  /r:System.Core.dll ^
  /win32icon:WinForms\app.ico ^
  /out:"%OUT_DIR%\cki-lite.exe" ^
  WinForms\cki-lite.cs

if errorlevel 1 (
  echo [ERRO] falha ao compilar cki-lite.exe
  exit /b 1
)

echo.
echo [ok] gerado: %OUT_DIR%\cki-lite.exe
echo      Execute com: %OUT_DIR%\cki-lite.exe
endlocal
