# 📁 Estrutura do MCP

```
mcp/
├── server.js                      # Servidor MCP principal (Node.js)
├── package.json                   # Dependências do projeto
├── setup.ps1                      # Script setup automático (Windows)
├── setup.sh                       # Script setup automático (macOS/Linux)
│
├── README.md                      # Documentação técnica completa
├── SETUP.md                       # Guia de instalação passo a passo
├── EXAMPLES.md                    # Exemplos de uso no Claude
├── COMMANDS.md                    # Referência rápida de comandos
│
├── claude_desktop_config.json     # Exemplo de configuração
├── .gitignore                     # Ignorar node_modules e cache
│
└── node_modules/                 # Dependências instaladas (auto-gerado)
```

---

## 🎯 O que cada arquivo faz

| Arquivo | Descrição |
|---------|-----------|
| **server.js** | Servidor MCP que oferece as ferramentas (ler, escrever, executar, etc) |
| **package.json** | Define dependências (@modelcontextprotocol/sdk) |
| **setup.ps1** | Script PowerShell que configura tudo automaticamente no Windows |
| **setup.sh** | Script Bash que configura tudo no macOS/Linux |
| **README.md** | Documentação técnica e detalhada |
| **SETUP.md** | Guia passo a passo visual para instalação |
| **EXAMPLES.md** | 10+ exemplos práticos de como usar o MCP |
| **COMMANDS.md** | Referência rápida com tabela de comandos |
| **claude_desktop_config.json** | Template da configuração do Claude Desktop |

---

## 🚀 Como Usar Após Instalação

### 1️⃣ No Claude Desktop
```
@saas-distribuidora Leia o arquivo App.tsx
```

### 2️⃣ O servidor responde com o conteúdo do arquivo

### 3️⃣ Você pode continuar conversando e pedindo mais coisas
```
@saas-distribuidora Refatore esse código e crie um hook custom
```

---

## 💾 Dados Armazenados

O MCP é **stateless** (sem estado). Ele:
- ✅ Lê/escreve arquivos do repositório
- ✅ Executa comandos no terminal
- ✅ Acessa informações do git
- ❌ NÃO armazena dados próprios
- ❌ NÃO persiste estado entre conversas

---

## 🔒 Segurança

O servidor implementa proteção contra:
- ❌ Path traversal (`../../../etc`)
- ❌ Acesso fora do repositório
- ❌ Comandos perigosos (você controla quais rodam)

---

## 📦 Dependência Única

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.1.0"
  }
}
```

É a única dependência! Mantém o projeto leve e rápido.

---

## 🔄 Fluxo de Funcionamento

```
Você no Claude
     ↓
@saas-distribuidora [comando]
     ↓
Servidor MCP recebe comando
     ↓
Executa ação (read, write, execute, etc)
     ↓
Retorna resultado
     ↓
Claude mostra resposta pra você
```

---

## 🎨 Personalizações Possíveis

Você pode estender o MCP adicionando novas ferramentas em `server.js`:

- Análise de performance de código
- Testes automatizados
- Deploy automation
- CI/CD integration
- Database queries
- API chamadas
- E muito mais!

---

## ✅ Status: Pronto para Usar

- ✅ Servidor MCP criado e funcional
- ✅ Scripts de setup automáticos  
- ✅ Documentação completa
- ✅ Exemplos práticos
- ✅ Proteção contra acesso indevido
- ✅ Pronto para expandir

---

**Próximo passo:** Execute `setup.ps1` (Windows) ou `setup.sh` (macOS/Linux) 🚀
