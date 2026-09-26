# Exemplos de Uso do MCP no Claude Desktop

## Após configurar o MCP, você pode usar assim:

### 1. **Listar arquivos do projeto**

```
@saas-distribuidora Liste todos os arquivos do projeto
```

### 2. **Ler um arquivo específico**

```
@saas-distribuidora Leia o arquivo packages/gestao-frontend/src/App.tsx
```

### 3. **Buscar código específico**

```
@saas-distribuidora Busque todos os arquivos que contêm "usePedidosStore"
```

### 4. **Ver estrutura do projeto**

```
@saas-distribuidora Qual é a estrutura do projeto?
```

### 5. **Ver status do Git**

```
@saas-distribuidora Qual é o status do git?
```

### 6. **Executar comandos**

```
@saas-distribuidora Execute "pnpm build" no projeto

@saas-distribuidora Execute "git log --oneline -5" para ver últimos commits

@saas-distribuidora Execute "pnpm list" para ver dependências
```

### 7. **Criar novo arquivo**

```
@saas-distribuidora Crie um arquivo em "packages/gestao-frontend/src/utils/test.ts" com conteúdo:
export function test() {
  console.log("Hello World")
}
```

### 8. **Editar arquivo existente**

```
@saas-distribuidora Edite o arquivo "packages/gestao-frontend/package.json" e mude a versão para "2.0.0"
```

### 9. **Buscar por padrão**

```
@saas-distribuidora Busque todos os arquivos .tsx no projeto

@saas-distribuidora Busque por "TODO" em todos os arquivos do projeto
```

### 10. **Programação assistida**

```
@saas-distribuidora 
1. Leia o arquivo ListaPedidos.tsx
2. Encontre todos os componentes que usam usePedidosStore
3. Sugira melhorias de performance
```

## Dicas Importantes

- ✅ O @ permite autocompletar nomes de ferramentas
- ✅ Você pode usar notação de caminho relativa (packages/...)
- ✅ Comandos são executados no diretório raiz do repositório
- ✅ O MCP protege contra path traversal (você não pode acessar fora do repo)
- ✅ Use linguagem natural, o MCP entende contexto

## Exemplos Práticos Completos

### Criar componente novo

```
@saas-distribuidora 
Crie um novo componente React em "packages/gestao-frontend/src/components/Dashboard.tsx" que:
1. Importe React
2. Importe MainLayout
3. Exporte um componente funcional chamado Dashboard
4. Mostre um título "Dashboard" e um parágrafo "Bem-vindo"
```

### Refatorar código

```
@saas-distribuidora
1. Leia o arquivo "packages/gestao-frontend/src/store/pedidosStore.ts"
2. Analise o código
3. Sugira refatorações para melhorar legibilidade
4. Mostre o código refatorado
```

### Debug de erro

```
@saas-distribuidora
1. Execute "pnpm build" no diretório "packages/gestao-frontend"
2. Se houver erro, mostre-me qual é
3. Ajude a corrigir o código
```

### Setup de novo pacote

```
@saas-distribuidora
1. Liste os arquivos em "packages"
2. Crie uma estrutura para um novo pacote "utils" com:
   - package.json
   - src/index.ts
   - tsconfig.json
```

---

**Dica:** Quanto mais detalhado você for nas instruções, melhores serão os resultados! 🚀
