#!/bin/bash

# Script para configurar MCP para Claude Desktop no macOS/Linux

echo "🚀 Configurando MCP para SaaS Distribuidora..."

# 1. Instalar dependências
echo ""
echo "📦 Instalando dependências do MCP..."

MCP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$MCP_DIR"

# Verificar se pnpm está disponível
if command -v pnpm &> /dev/null; then
    echo "  ✓ Usando pnpm"
    pnpm install
else
    echo "  ✓ Usando npm"
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✓ Dependências instaladas"

# 2. Criar/atualizar configuração do Claude Desktop
echo ""
echo "⚙️  Configurando Claude Desktop..."

# Determinar localização do arquivo de configuração
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
else
    # Linux
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
fi

CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Criar diretório se não existir
mkdir -p "$CLAUDE_CONFIG_DIR"

# Caminho absoluto para o server.js
SERVER_PATH="$MCP_DIR/server.js"

# Verificar se o arquivo já existe
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "  ! Arquivo de configuração já existe"
    echo "  Criando backup..."
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup"
fi

# Criar configuração MCP usando jq se disponível, ou cat
if command -v jq &> /dev/null; then
    # Usar jq para merge seguro
    if [ -f "$CLAUDE_CONFIG_FILE" ]; then
        jq '.mcpServers."saas-distribuidora" = {
            "command": "node",
            "args": ["'"$SERVER_PATH"'"],
            "disabled": false
        }' "$CLAUDE_CONFIG_FILE" > "$CLAUDE_CONFIG_FILE.tmp"
        mv "$CLAUDE_CONFIG_FILE.tmp" "$CLAUDE_CONFIG_FILE"
    else
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "saas-distribuidora": {
      "command": "node",
      "args": ["$SERVER_PATH"],
      "disabled": false
    }
  }
}
EOF
    fi
else
    # Fallback: criar arquivo simples
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "saas-distribuidora": {
      "command": "node",
      "args": ["$SERVER_PATH"],
      "disabled": false
    }
  }
}
EOF
fi

echo "✓ Arquivo de configuração criado/atualizado"
echo "  📍 Localização: $CLAUDE_CONFIG_FILE"

# 3. Verificação final
echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Feche completamente o Claude Desktop"
echo "  2. Reabra o Claude Desktop"
echo "  3. O MCP 'saas-distribuidora' deve estar disponível"

echo ""
echo "💡 Você pode testar no Claude com:"
echo "  @saas-distribuidora Liste os arquivos do projeto"
echo "  @saas-distribuidora Qual é a estrutura do projeto?"

echo ""
echo "📚 Para mais informações, leia mcp/README.md"
