# 🚀 Guia de Instalação - MCP para Claude Desktop

## O que é este MCP?

Um **Model Context Protocol (MCP)** servidor que conecta o Claude Desktop ao seu repositório `saas_distribuidora`, permitindo que Claude:
- Leia e escreva arquivos
- Execute comandos (pnpm, git, etc)
- Analise a estrutura do projeto
- Busque código
- E muito mais!

## ⚡ Instalação Rápida (Windows)

### Passo 1: Abrir PowerShell

1. Pressione `Windows + X` e selecione **Windows PowerShell (Admin)**
2. Ou procure "PowerShell" no menu iniciar

### Passo 2: Executar script de setup

```powershell
C:\Users\Jordan\Documents\GitHub\saas_distribuidora\mcp\setup.ps1
```

Se receber erro de execução de script, execute primeiro:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Passo 3: Reiniciar Claude Desktop

1. **Feche completamente** o Claude Desktop
2. Aguarde alguns segundos
3. **Reabra** o Claude Desktop

✅ Pronto! O MCP está configurado!

---

## ⚙️ Instalação Manual

Se o script automático não funcionar, siga estes passos:

### Passo 1: Instalar dependências do MCP

Abra PowerShell no diretório `mcp`:

```powershell
cd C:\Users\Jordan\Documents\GitHub\saas_distribuidora\mcp
pnpm install
# ou se não tiver pnpm:
npm install
```

### Passo 2: Localizar arquivo de configuração

O arquivo de configuração do Claude Desktop está em:

```
C:\Users\Jordan\AppData\Roaming\Claude\claude_desktop_config.json
```

Se não existir, você precisa criá-lo.

### Passo 3: Editar configuração

Abra o arquivo `claude_desktop_config.json` com um editor de texto (VS Code, Notepad++, etc)

**Se o arquivo está vazio ou não existe**, adicione:

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

**Se o arquivo já tem conteúdo**, adicione apenas a seção `"saas-distribuidora"` dentro de `"mcpServers"`:

```json
{
  "mcpServers": {
    "seu-outro-mcp": { ... },
    "saas-distribuidora": {
      "command": "node",
      "args": ["C:\\Users\\Jordan\\Documents\\GitHub\\saas_distribuidora\\mcp\\server.js"],
      "disabled": false
    }
  }
}
```

### Passo 4: Salvar e reiniciar Claude

1. Salve o arquivo (`Ctrl + S`)
2. Feche Claude Desktop completamente
3. Reabra Claude Desktop
4. O MCP deve aparecer como "saas-distribuidora" disponível

---

## 🔍 Como verificar se está funcionando

### No Claude Desktop:

1. Abra uma nova conversa
2. Digite: `@saas-distribuidora` e veja se a ferramenta aparece
3. Tente um comando simples:
   ```
   @saas-distribuidora Qual é a estrutura do projeto?
   ```

Se o Claude responder com informações do projeto, ✅ está funcionando!

---

## 📱 Para macOS

### Passo 1: Usar script bash

```bash
bash /Users/seu_usuario/Documents/GitHub/saas_distribuidora/mcp/setup.sh
```

Ou manualmente:

### Passo 2: Configurar manualmente

O arquivo de configuração está em:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Adicione a mesma configuração JSON anterior, ajustando o caminho para macOS:

```json
{
  "mcpServers": {
    "saas-distribuidora": {
      "command": "node",
      "args": ["/Users/seu_usuario/Documents/GitHub/saas_distribuidora/mcp/server.js"],
      "disabled": false
    }
  }
}
```

---

## 🐧 Para Linux

### Passo 1: Usar script bash

```bash
bash ~/Documents/GitHub/saas_distribuidora/mcp/setup.sh
```

### Passo 2: Configurar manualmente

O arquivo de configuração está em:

```
~/.config/Claude/claude_desktop_config.json
```

Mesma configuração JSON anterior.

---

## ❌ Troubleshooting

### "MCP não aparece em @"

**Solução:**
1. Reinicie Claude Desktop completamente
2. Verifique que o Node.js está instalado: `node --version`
3. Verifique o caminho no JSON está correto
4. Tente desabilitar e habilitar novamente

### "Erro ao conectar ao MCP"

**Solução:**
1. Verifique que `pnpm install` foi executado: `ls mcp/node_modules`
2. Reinstale: `cd mcp && rm -r node_modules && pnpm install`
3. Verifique que Node.js está no PATH

### "Command not found: node"

**Solução:**
1. Abra PowerShell e instale Node.js:
   ```powershell
   winget install OpenJS.NodeJS
   ```
2. Reinicie o terminal e tente novamente

---

## 📚 Próximos Passos

Depois de configurado, leia:
- [`EXAMPLES.md`](EXAMPLES.md) - Exemplos de uso no Claude
- [`README.md`](README.md) - Documentação técnica completa

---

## 💡 Dicas Importantes

✅ O script `setup.ps1` / `setup.sh` configura tudo automaticamente
✅ Node.js >= 18 é necessário (você já tem instalado)
✅ Use `node --version` para verificar sua versão
✅ Se receber aviso sobre deprecation, é normal e não afeta funcionamento

---

**Dúvidas?** Verifique os logs do Claude Desktop para mais detalhes sobre erros.

Sucesso! 🎉
