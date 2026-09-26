#!/usr/bin/env pwsh

# Script para configurar MCP para Claude Desktop no Windows

Write-Host "🚀 Configurando MCP para SaaS Distribuidora..." -ForegroundColor Cyan

# 1. Instalar dependências
Write-Host "`n📦 Instalando dependências do MCP..." -ForegroundColor Yellow

$mcpDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $mcpDir

try {
    # Verificar se pnpm está disponível
    $hasPnpm = $null -ne (Get-Command pnpm -ErrorAction SilentlyContinue)
    
    if ($hasPnpm) {
        Write-Host "  ✓ Usando pnpm" -ForegroundColor Green
        pnpm install
    } else {
        Write-Host "  ✓ Usando npm" -ForegroundColor Green
        npm install
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Dependências instaladas" -ForegroundColor Green
} finally {
    Pop-Location
}

# 2. Criar/atualizar configuração do Claude Desktop
Write-Host "`n⚙️  Configurando Claude Desktop..." -ForegroundColor Yellow

$claudeConfigDir = "$env:APPDATA\Claude"
$claudeConfigFile = "$claudeConfigDir\claude_desktop_config.json"

# Criar diretório se não existir
if (-not (Test-Path $claudeConfigDir)) {
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    Write-Host "  ✓ Diretório criado: $claudeConfigDir" -ForegroundColor Green
}

# Caminho absoluto para o server.js
$serverPath = Join-Path $mcpDir "server.js" | Convert-Path

# Verificar se o arquivo já existe
if (Test-Path $claudeConfigFile) {
    Write-Host "  ! Arquivo de configuração já existe" -ForegroundColor Yellow
    Write-Host "  Criando backup..." -ForegroundColor Gray
    Copy-Item $claudeConfigFile "$claudeConfigFile.backup" -Force
}

# Criar configuração MCP
$mcpConfig = @{
    mcpServers = @{
        "saas-distribuidora" = @{
            command = "node"
            args = @($serverPath)
            disabled = $false
        }
    }
}

# Se o arquivo já existe, fazer merge
if (Test-Path $claudeConfigFile) {
    $existingConfig = Get-Content $claudeConfigFile | ConvertFrom-Json
    
    # Adicionar ou atualizar MCP server
    if (-not $existingConfig.mcpServers) {
        $existingConfig | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue @{}
    }
    
    $existingConfig.mcpServers."saas-distribuidora" = $mcpConfig.mcpServers."saas-distribuidora"
    
    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile -Encoding UTF8
} else {
    $mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigFile -Encoding UTF8
}

Write-Host "✓ Arquivo de configuração criado/atualizado" -ForegroundColor Green
Write-Host "  📍 Localização: $claudeConfigFile" -ForegroundColor Gray

# 3. Verificação final
Write-Host "`n✅ Configuração concluída!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Feche completamente o Claude Desktop" -ForegroundColor Gray
Write-Host "  2. Reabra o Claude Desktop" -ForegroundColor Gray
Write-Host "  3. O MCP 'saas-distribuidora' deve estar disponível" -ForegroundColor Gray

Write-Host "`n💡 Você pode testar no Claude com:" -ForegroundColor Cyan
Write-Host "  @saas-distribuidora Liste os arquivos do projeto" -ForegroundColor Gray
Write-Host "  @saas-distribuidora Qual é a estrutura do projeto?" -ForegroundColor Gray

Write-Host "`n📚 Para mais informações, leia mcp/README.md" -ForegroundColor Cyan
