# ADR-002: Decisoes Tecnicas - Sistema de Agentes

**Status**: Aceito  
**Data**: 2025-01-14  
**Autor**: Architect Agent  

---

## Contexto

O sistema de agentes do Anamnesic precisa evoluir de um monolito (AgentService.ts com 2400+ linhas) para uma arquitetura modular, extensivel e testavel.

---

## Decisoes

### D1: Inversao de Dependencia via Interfaces

**Decisao**: Definir interfaces em `@anamnesic/core` e implementacoes em `@anamnesic/vscode`.

**Alternativas consideradas**:
1. Manter tudo em um pacote (status quo)
2. Criar pacote separado so para interfaces
3. Usar classes abstratas ao inves de interfaces

**Justificativa**:
- Permite testar core sem dependencia de VS Code
- Facilita adicionar outros hosts (CLI, web)
- TypeScript interfaces tem zero runtime overhead
- Classes abstratas podem ter metodos helper reutilizaveis (BaseAgent)

### D2: Registry Pattern para Agentes

**Decisao**: Usar padrao Registry centralizado com descoberta de plugins.

**Implementacao**:
```typescript
// Core define a interface
interface IAgentRegistry {
  register(agent: IAgent): void;
  get(role: AgentRole): IAgent | undefined;
  getByCapability(cap: string): IAgent[];
}

// VSCode implementa e popula
const registry = getAgentRegistry();
registry.register(new ProductManagerAgent());
registry.register(new ArchitectAgent());
// ...
```

**Justificativa**:
- Ponto unico de acesso a agentes
- Facil habilitar/desabilitar
- Suporta plugins externos
- Eventos de registro para observabilidade

### D3: Lifecycle Hooks via Event System

**Decisao**: Hooks de lifecycle como observers do EventBus.

**Implementacao**:
```typescript
interface IAgentLifecycleHook {
  id: string;
  phases: LifecyclePhase[];
  priority: number;
  handle(event: LifecycleEvent): Promise<HookResult>;
}

// Uso
lifecycleManager.register({
  id: 'metrics',
  phases: ['pre-execute', 'post-execute'],
  priority: 0,
  async handle(event) {
    metrics.record(event);
    return { continue: true };
  },
});
```

**Justificativa**:
- Desacoplamento total
- Ordenacao por prioridade
- Possibilidade de interromper execucao
- Facil adicionar cross-cutting concerns (logging, metrics, validation)

### D4: Builder Pattern para Prompts e Tools

**Decisao**: Usar builders para construcao de system prompts e tools.

**Implementacao**:
```typescript
// Tool Builder
const tool = new ToolBuilder('validate_json')
  .description('Validate JSON syntax')
  .parameter('content', 'string', 'JSON content', true)
  .mutating(false)
  .executor(async (params, ctx) => { ... })
  .build();

// Context Builder
const ctx = new AgentContextBuilder()
  .setProject('proj-1', 'My Project')
  .setWorkspace('/path')
  .setObjective('...')
  .build();
```

**Justificativa**:
- API fluente e legivel
- Validacao em tempo de build
- Imutabilidade do resultado
- Facil de estender

### D5: Capability-based Agent Discovery

**Decisao**: Agentes declaram capabilities, sistema faz matching.

**Implementacao**:
```typescript
const agent: IAgent = {
  metadata: {
    role: 'backend',
    capabilities: [
      { id: 'file-write', name: 'File Writing', description: '...' },
      { id: 'code-generation', name: 'Code Generation', description: '...' },
    ],
  },
  // ...
};

// Busca por capability
const writersAgents = registry.getByCapability('file-write');
```

**Justificativa**:
- Desacopla "o que fazer" de "quem faz"
- Permite delegacao inteligente
- Facilita fallback automatico
- Self-documenting system

### D6: Preservar Backward Compatibility

**Decisao**: Manter exports legados como aliases.

**Implementacao**:
```typescript
// agent-config.ts (legado)
export { AgentModelConfig } from './agents/config';

// pipeline.ts (legado) 
export { AgentRole, Pipeline, AgentTask } from './agents/contracts';

// Deprecation warning
/** @deprecated Use AgentRole from '@anamnesic/core/agents' */
export type AgentRole = import('./agents/contracts').AgentRole;
```

**Justificativa**:
- Zero breaking changes iniciais
- Migracao gradual
- Tempo para adaptar consumers

### D7: Modelos de Dados Imutaveis

**Decisao**: Contexto e resultados sao imutaveis apos criacao.

**Implementacao**:
```typescript
interface IAgentContext {
  readonly projectId: string;
  readonly workspace: string;
  // ...
}

// Modificacoes via spread
const newCtx = { ...ctx, timeout: 60000 };
```

**Justificativa**:
- Previne side effects
- Facilita debugging
- Thread-safe por design
- Snapshots para replay

---

## Consequencias

### Positivas
- Codigo mais testavel
- Facil adicionar novos agentes
- Observabilidade built-in
- Separacao clara de responsabilidades

### Negativas
- Mais arquivos/modulos para navegar
- Curva de aprendizado inicial
- Pequeno overhead de indirection

### Neutras
- Requer migracao gradual
- Documentacao precisa ser atualizada

---

## Compliance

- [ ] Contratos criados em `packages/core/src/agents/contracts/`
- [ ] Tools refatorados para usar novo sistema
- [ ] Registry implementado
- [ ] Lifecycle hooks funcionando
- [ ] Testes unitarios para contratos
- [ ] Documentacao atualizada
