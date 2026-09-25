@echo off
rem ============================================================
rem  cki-lite desktop - smoke tests for core logic (no installs)
rem  Compiles a small harness with the built-in csc.exe and runs it.
rem ============================================================
setlocal

set FRAMEWORK_DIR=C:\Windows\Microsoft.NET\Framework64\v4.0.30319
if not exist "%FRAMEWORK_DIR%\csc.exe" (
  set FRAMEWORK_DIR=C:\Windows\Microsoft.NET\Framework\v4.0.30319
)
set TOOLCHAIN=%FRAMEWORK_DIR%\csc.exe

set WORK=work
set HARNESS=%WORK%\core-tests.cs
set OUT=%WORK%\core-tests.exe

if not exist "%WORK%" mkdir "%WORK%"

echo [test] compilando harness de testes...
"%TOOLCHAIN%" /nologo /target:exe /main:TestHarness /platform:anycpu /optimize+ ^
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll ^
  /r:System.Core.dll ^
  /out:"%OUT%" ^
  WinForms\cki-lite.cs "%HARNESS%"

if errorlevel 1 (
  echo [ERRO] falha ao compilar os testes.
  exit /b 1
)

echo [test] executando...
"%OUT%"
set RESULT=%ERRORLEVEL%

del "%OUT%" >NUL 2>&1

if %RESULT%==0 (
  echo [ok] TODOS OS TESTES PASSARAM
) else (
  echo [ERRO] testem falharam (codigo %RESULT%^)
)
exit /b %RESULT%
