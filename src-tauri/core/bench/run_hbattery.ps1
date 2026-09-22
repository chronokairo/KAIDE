# H-Battery runner: copies each fixed fixture to a temp workspace, runs the
# agent headlessly, then classifies the outcome against the fixed acceptance
# tests. Never builds in-place so fixtures stay pristine.
param(
    [string]$Model = "qwen2.5-coder:3b",
    [string[]]$Tasks = @("h1-orders", "h2-users", "h3-pool"),
    [string]$Bin = ""
)

$ErrorActionPreference = "Stop"
if (-not $Bin) {
    $Bin = Join-Path $PSScriptRoot "..\target\debug\ckc.exe"
}
# Never benchmark against a stale binary.
Push-Location (Join-Path $PSScriptRoot "..")
cargo build --quiet
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "cargo build failed" }
Pop-Location
$fixtures = Join-Path $PSScriptRoot "tests"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$root = Join-Path $env:TEMP "chronokairo-hbench-$stamp"
New-Item -ItemType Directory -Force -Path $root | Out-Null
$logDir = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$results = @()
foreach ($t in $Tasks) {
    $fixture = Join-Path $fixtures $t
    $work = Join-Path $root $t
    robocopy $fixture $work /MIR /NFL /NDL /NJH /NJS | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $t" }

    $taskText = (Get-Content (Join-Path $work "TASK.md") -Raw).Trim()
    Write-Host "`n=== [$t] running agent ($Model) ===" -ForegroundColor Cyan
    $agentLog = Join-Path $logDir "$t-$stamp.log"
    & $Bin --dir $work --model $Model exec $taskText --yes 2>&1 |
        Tee-Object -FilePath $agentLog | Out-Null
    $exit = $LASTEXITCODE
    $agentOutput = Get-Content $agentLog -Raw

    # Classification -------------------------------------------------------
    Push-Location $work
    try {
        $env:CARGO_TARGET_DIR = Join-Path $root "_target_$t"
        $cargoOut = cargo test 2>&1 | Out-String
        $cargoOk = ($LASTEXITCODE -eq 0) -and ($cargoOut -match "test result: ok")
        Pop-Location
    } catch { Pop-Location; $cargoOk = $false; $cargoOut = $_.ToString() }

    # tests/ must be untouched by the agent
    $testsDirty = $false
    foreach ($f in @("acceptance_test.rs", "baseline_test.rs")) {
        $orig = Get-Content (Join-Path $fixture "tests\$f") -Raw
        $now = Get-Content (Join-Path $work "tests\$f") -Raw
        if ($orig -ne $now) { $testsDirty = $true }
    }

    if ($cargoOk -and -not $testsDirty) {
        $status = "PASS"
    } elseif ($agentOutput -cmatch "Specification-Locked gate rejected|ORACLE LOCKED") {
        $status = if ($cargoOk) { "PASS" } else { "DRIFT-BLOCKED" }
    } else {
        $status = "FAIL"
    }
    if ($testsDirty) { $status = "VIOLATION(tests modified)" }

    $results += [pscustomobject]@{
        Task = $t; Model = $Model; Status = $status;
        ExitCode = $exit; Log = $agentLog
    }
    Write-Host "[$t] -> $status" -ForegroundColor $(if ($status -eq "PASS") { "Green" } else { "Yellow" })
}

Write-Host "`n=== SUMMARY ($stamp) ===" -ForegroundColor Cyan
$results | Format-Table Task, Model, Status, ExitCode -AutoSize
$summaryPath = Join-Path $logDir "summary-$stamp.json"
$results | ConvertTo-Json | Set-Content $summaryPath
Write-Host "Logs: $logDir"
