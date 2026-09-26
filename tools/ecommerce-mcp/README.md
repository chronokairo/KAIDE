# SaaS Distribuidora MCP Server for Claude Desktop

Um Model Context Protocol (MCP) server que permite ao Claude Desktop acessar e programar no seu repositório da SaaS Distribuidora.

## Funcionalidades

- **read_file**: Ler conteúdo de arquivos
- **write_file**: Criar/editar arquivos
- **list_files**: Listar arquivos e diretórios
- **execute_command**: Executar comandos (pnpm, git, etc)
- **get_project_structure**: Informações do projeto
- **get_git_status**: Status do repositório git
- **search_files**: Buscar arquivos por nome ou conteúdo

## Instalação

### 1. Instalar dependências do MCP

```bash
cd mcp
npm install
# ou
pnpm install
```

### 2. Configurar Claude Desktop

Você precisa adicionar este MCP à configuração do Claude Desktop. O arquivo de configuração está em:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 3. Adicionar configuração MCP

Abra o arquivo `claude_desktop_config.json` e adicione:

```json
{
  "mcpServers": {
    "saas-distribuidora": {
      "command": "node",
      "args": ["C:\\Users\\Jordan\\Documents\\GitHub\\saas_distribuidora\\mcp\\server.js"],
      "disabled": false
    }
  }
}
```

**Para macOS/Linux, ajuste o caminho:**
```json
{
  "mcpServers": {
    "saas-distribuidora": {
      "command": "node",
      "args": ["/path/to/saas_distribuidora/mcp/server.js"],
      "disabled": false
    }
  }
}
```

### 4. Reiniciar Claude Desktop

Feche e reabra o Claude Desktop. O MCP estar á disponível e você poderá usar os comandos com @saas-distribuidora ou simplesmente mencionando ferramentas do repositório.

## Uso no Claude Desktop

Depois de configurado, você pode usar comandos como:

```
@saas-distribuidora Leia o arquivo packages/gestao-frontend/package.json

@saas-distribuidora Liste todos os arquivos TypeScript do projeto

@saas-distribuidora Execute "pnpm build" no diretório gestao-frontend

@saas-distribuidora Busque todos os arquivos que contêm "usePedidosStore"

@saas-distribuidora Qual é a estrutura do projeto?

@saas-distribuidora Qual é o status do git?
```

## Desenvolvimento

Para desenvolver o MCP (com hot reload):

```bash
cd mcp
pnpm dev
```

## Estrutura do Projeto

```
mcp/
├── server.js          # Servidor MCP principal
├── package.json       # Dependências
└── README.md         # Este arquivo
```

## Permissões de Segurança

O MCP implementa proteção contra path traversal (`../` etc) para manter o acesso seguro apenas ao repositório.

## Troubleshooting

### MCP não aparece no Claude Desktop

1. Verifique que o Node.js está instalado e acessível no PATH
2. Verifique o caminho do arquivo no `claude_desktop_config.json`
3. Verifique os logs do Claude Desktop para erros
4. Restart completo do Claude Desktop

### Erro ao executar comandos

Certifique-se de que:
- Você está no diretório correto do repositório
- Os comandos que você está tentando são válidos (pnpm, git, etc)
- As dependências estão instaladas

## Próximos Passos

Você pode estender o MCP adicionando mais ferramentas:
- Análise de código
- Teste de componentes
- Deploy automatizado
- CI/CD integration

---

Agora o Claude Desktop pode programar no seu repositório! 🚀
