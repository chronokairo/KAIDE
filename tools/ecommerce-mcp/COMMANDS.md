# 📋 Referência Rápida de Comandos MCP

## Como usar

No Claude Desktop, comece suas mensagens com `@saas-distribuidora` para acessar as ferramentas do repositório.

## ⚙️ Ferramentas Disponíveis

| Ferramenta | Descrição | Exemplo |
|-----------|-----------|---------|
| `read_file` | Lê conteúdo de um arquivo | "Leia packages/gestao-frontend/package.json" |
| `write_file` | Cria ou edita um arquivo | "Crie um arquivo em src/test.ts com conteúdo..." |
| `list_files` | Lista arquivos de um diretório | "Liste arquivos em packages/" |
| `execute_command` | Executa um comando no repositório | "Execute pnpm build" |
| `get_project_structure` | Mostra estrutura do projeto | "Qual é a estrutura do projeto?" |
| `get_git_status` | Mostra status do git | "Qual é o status do git?" |
| `search_files` | Busca em nomes ou conteúdo | "Busque 'usePedidosStore' em todos os arquivos" |

---

## 🎯 Comandos Rápidos

### Exploração do Projeto

```
@saas-distribuidora Qual é a estrutura do projeto?
@saas-distribuidora Liste todos os arquivos TypeScript
@saas-distribuidora Qual é o status do git?
```

### Leitura de Código

```
@saas-distribuidora Leia o arquivo App.tsx
@saas-distribuidora Mostre o conteúdo de packages/gestao/package.json
@saas-distribuidora Busque todas as importações de "usePedidosStore"
```

### Escrita e Criação

```
@saas-distribuidora Crie um arquivo em src/utils/helpers.ts com:
export function helper() { ... }

@saas-distribuidora Edite o arquivo package.json e mude a versão para 2.0.0
```

### Execução de Comandos

```
@saas-distribuidora Execute pnpm build em gestao-frontend
@saas-distribuidora Execute git log --oneline -5
@saas-distribuidora Execute pnpm list para ver dependências
```

### Busca Avançada

```
@saas-distribuidora Encontre todos os arquivos .tsx
@saas-distribuidora Busque por "TODO" em todo o código
@saas-distribuidora Liste todos os arquivos que contêm "fetch"
```

---

## 💻 Syntaxe de Caminhos

Todos os caminhos são **relativos ao raiz do repositório**:

✅ Correto:
```
packages/gestao-frontend/src/App.tsx
mcp/server.js
packages/gestao/package.json
```

❌ Errado:
```
C:\Users\Jordan\Documents\...  (não use caminhos absolutos)
../../../somewhere             (não use path traversal)
```

---

## 🔧 Dicas Profissionais

### 1. Usar múltiplas ações em uma mensagem

```
@saas-distribuidora
1. Leia o arquivo ListaPedidos.tsx
2. Analise o código
3. Sugira 3 melhorias de performance
4. Mostre como implementar cada uma
```

### 2. Ser específico com contexto

```
❌ Ruim:
@saas-distribuidora Corrija o erro

✅ Bom:
@saas-distribuidora Execute pnpm build e mostre-me o erro. 
Depois analise o arquivo que tem o erro e sugira correção.
```

### 3. Iterar sobre resultados

```
@saas-distribuidora Qual é o tamanho do bundle de produção?

[Claude mostra o resultado]

@saas-distribuidora Como posso reduzir esse tamanho?

[Claude sugere melhorias]
```

---

## 🚀 Workflows Comuns

### Criar novo componente

```
@saas-distribuidora Crie um novo componente React em 
packages/gestao-frontend/src/components/NewComponent.tsx que:
- Importe React e hooks necessários
- Exporte um componente funcional
- Tenha uma estrutura básica com MainLayout
```

### Refatorar código

```
@saas-distribuidora 
1. Leia o arquivo src/pages/CriarPedido.tsx
2. Identifique funções que podem ser extraídas
3. Refatore o código separando lógica em custom hooks
4. Mostre-me o código refatorado
```

### Debug de erro de compilação

```
@saas-distribuidora Execute pnpm build em gestao-frontend.
Se houver erro, mostre-me qual arquivo tem o problema.
```

### Atualizar dependências

```
@saas-distribuidora
Leia o package.json de gestao-frontend.
Quais pacotes estão desatualizados?
Como atualizá-los com segurança?
```

---

## 📊 Exemplos por Caso de Uso

### Development
```
@saas-distribuidora Execute pnpm dev no diretório gestao-frontend
```

### Testing
```
@saas-distribuidora Execute pnpm test no projeto
```

### Build
```
@saas-distribuidora Execute pnpm build em gestao-frontend e mostre o resultado
```

### Git Workflow
```
@saas-distribuidora Qual é o status atual do repositório?
```

---

## ⚡ Atalhos Úteis

| Necessidade | Comando |
|-----------|---------|
| Descobrir arquivos | `Busque por [padrão] em todos os arquivos` |
| Entender estrutura | `Qual é a estrutura do projeto?` |
| Ver histórico git | `Execute git log --oneline -10` |
| Listar dependências | `Execute pnpm list` |
| Ver status | `Qual é o status do git?` |

---

## 🎓 Aprenda Mais

- Leia [`SETUP.md`](SETUP.md) para configuração
- Leia [`EXAMPLES.md`](EXAMPLES.md) para exemplos práticos completos
- Leia [`README.md`](README.md) para documentação técnica

---

**Dica:** Use linguagem natural! O Claude entende contexto e português completo! 🗣️
