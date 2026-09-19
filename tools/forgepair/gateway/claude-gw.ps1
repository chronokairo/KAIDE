$ErrorActionPreference = 'Stop'

$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

$KiloPort = 4096
if ($env:CLAUDEGW_KILO_PORT) { $KiloPort = [int]$env:CLAUDEGW_KILO_PORT }
$OpencodePort = 4097
if ($env:CLAUDEGW_OPENCODE_PORT) { $OpencodePort = [int]$env:CLAUDEGW_OPENCODE_PORT }
$GatewayPort = 8787
if ($env:CLAUDEGW_GATEWAY_PORT) { $GatewayPort = [int]$env:CLAUDEGW_GATEWAY_PORT }
$Model = $env:CLAUDEGW_MODEL
$lastModelFile = Join-Path $env:TEMP 'claudefree-lastmodel.txt'

$gatewayDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $env:TEMP 'claude-gateway'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Port([int]$port) {
  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

function Start-Hidden([string]$exe, [string]$exeArgs, [string]$log) {
  Write-Host "iniciando $exe ..."
  Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "$exe $exeArgs > `"$log`" 2>&1" `
    -WindowStyle Hidden | Out-Null
}

function Wait-Health([string]$url, [int]$seconds = 60) {
  $deadline = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-RestMethod -Uri $url -TimeoutSec 2 | Out-Null
      return $true
    } catch { Start-Sleep -Milliseconds 800 }
  }
  return $false
}

function Select-Model([object[]]$models) {
  Write-Host ""
  Write-Host "=== seletor de modelo ==="
  Write-Host "digite um filtro (ex.: free, sonnet, big-pickle) ou Enter para listar tudo. q = sair."
  while ($true) {
    $f = (Read-Host "filtro").Trim()
    if ($f -eq 'q') { exit 1 }
    $list = @($models | Where-Object { $_.id -like "*$f*" } | Sort-Object id)
    if (-not $list.Count) { Write-Host "nenhum modelo encontrado"; continue }
    if (-not [Console]::IsInputRedirected) {
      [Console]::CursorVisible = $false
    }
    $page = 0
    $pageSize = 30
    while ($true) {
      $start = $page * $pageSize
      $end = [Math]::Min($start + $pageSize - 1, $list.Count - 1)
      for ($i = $start; $i -le $end; $i++) {
        Write-Host ("{0,4}) {1}" -f ($i + 1), $list[$i].id)
      }
      Write-Host ("mostrando $($start + 1)-$($end + 1) de $($list.Count) | numero = escolher, Enter = proxima pagina, filtro = refinar")
      $sel = (Read-Host "> ").Trim()
      if ([Console]::IsInputRedirected -eq $false) {
        [Console]::CursorVisible = $true
      }
      if ($sel -match '^\d+$' -and [int]$sel -ge 1 -and [int]$sel -le $list.Count) {
        return $list[[int]$sel - 1].id
      }
      if ($sel -match '/') {
        $exact = $models | Where-Object { $_.id -eq $sel }
        if ($exact) { return $exact[0].id }
      }
      if ($sel -eq '') {
        if (($page + 1) * $pageSize -lt $list.Count) { $page++ } else { $page = 0 }
        continue
      }
      break
    }
  }
}

if (-not (Test-Port $KiloPort)) {
  Start-Hidden "kilo" "serve --port $KiloPort" (Join-Path $logDir 'kilo.log')
} else { Write-Host "kilo serve ja rodando na porta $KiloPort" }

if (-not (Test-Port $OpencodePort)) {
  Start-Hidden "opencode" "serve --port $OpencodePort" (Join-Path $logDir 'opencode.log')
} else { Write-Host "opencode serve ja rodando na porta $OpencodePort" }

if (-not (Test-Port $GatewayPort)) {
  Start-Hidden "node" "`"$gatewayDir\gateway.js`"" (Join-Path $logDir 'gateway.log')
} else { Write-Host "gateway ja rodando na porta $GatewayPort" }

Write-Host "aguardando gateway ficar saudavel..."
if (-not (Wait-Health "http://127.0.0.1:$GatewayPort/health")) {
  throw "gateway nao respondeu em http://127.0.0.1:$GatewayPort/health (veja logs em $logDir)"
}
Write-Host "gateway ok"

$explicitViaFlag = $false
foreach ($a in $args) {
  if ($a -like '--model*' -or $a -like '-m=*' -or $a -eq '-m') { $explicitViaFlag = $true; break }
}

if (-not $Model -and -not $explicitViaFlag) {
  if ([Console]::IsInputRedirected -or -not [Environment]::UserInteractive) {
    if (Test-Path $lastModelFile) {
      $Model = (Get-Content $lastModelFile -Raw).Trim()
      Write-Host "modo nao-interativo: usando ultimo modelo salvo ($Model)"
    } else {
      $Model = 'kilo/stepfun/step-3.7-flash:free'
      Write-Host "modo nao-interativo: usando padrao ($Model)"
    }
  } else {
    try { $catalog = (Invoke-RestMethod "http://127.0.0.1:$GatewayPort/v1/models" -TimeoutSec 30).data } catch { $catalog = @() }
    if (-not $catalog.Count) {
      $Model = 'kilo/stepfun/step-3.7-flash:free'
      Write-Host "nao foi possivel listar modelos, usando padrao ($Model)"
    } else {
      $picked = Select-Model $catalog
      Set-Content -Path $lastModelFile -Value $picked
      $Model = $picked
    }
  }
}
if (-not $Model) { $Model = 'kilo/stepfun/step-3.7-flash:free' }
Write-Host "modelo: $Model"

$env:ANTHROPIC_BASE_URL = "http://localhost:$GatewayPort"
$env:ANTHROPIC_AUTH_TOKEN = "gateway"
$env:ANTHROPIC_MODEL = $Model
$env:ANTHROPIC_SMALL_FAST_MODEL = $Model

& claude @args
exit $LASTEXITCODE
