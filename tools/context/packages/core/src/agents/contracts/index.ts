import { EventEmitter } from 'events';

// ─── Agent Capabilities ──────────────────────────────────────

export enum AgentCapability {
  REASONING = 'reasoning',
  CODE_GENERATION = 'code_generation',
  DEBUGGING = 'debugging',
  REFACTORING = 'refactoring',
  SECURITY_ANALYSIS = 'security_analysis',
  VULNERABILITY_DISCOVERY = 'vulnerability_discovery',
  ATTACK_SIMULATION = 'attack_simulation',
  MULTIMODAL_ANALYSIS = 'multimodal_analysis',
  PATTERN_DISCOVERY = 'pattern_discovery',
  TASK_DECOMPOSITION = 'task_decomposition',
  WORKFLOW_ORCHESTRATION = 'workflow_orchestration',
  AUTONOMOUS_OPERATION = 'autonomous_operation',
  CONTEXT_PROCESSING = 'context_processing',
  MEMORY_MANAGEMENT = 'memory_management',
  ADAPTIVE_BEHAVIOR = 'adaptive_behavior',
  DECISION_MAKING = 'decision_making',
  KNOWLEDGE_SYNTHESIS = 'knowledge_synthesis',
  SYSTEM_ANALYSIS = 'system_analysis',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  SCIENTIFIC_ANALYSIS = 'scientific_analysis'
}

// ─── Agent Metadata ──────────────────────────────────────────

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  capabilities: AgentCapability[];
  maxExecutionTime?: number; // in milliseconds
  memoryLimit?: number; // in MB
  requiresApproval?: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Agent State ─────────────────────────────────────────────

export enum AgentState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TERMINATED = 'terminated'
}

// ─── Agent Context ───────────────────────────────────────────

export interface IAgentContext {
  id: string;
  agentId: string;
  sessionId: string;
  workspaceId?: string;
  userId?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  state: Record<string, any>;
  memory: Map<string, any>;
  reasoning?: ReasoningContext;
  security?: SecurityContext;
  multimodal?: MultimodalContext;
  execution: {
    startedAt?: Date;
    completedAt?: Date;
    duration?: number;
    steps: ExecutionStep[];
  };
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    totalSteps: number;
    totalTokens?: number;
    cost?: number;
  };
}

// ─── Reasoning Context (Extended Thinking) ───────────────────

export interface ReasoningStep {
  id: string;
  timestamp: Date;
  type: 'analysis' | 'hypothesis' | 'validation' | 'decision' | 'execution';
  content: string;
  confidence: number;
  evidence?: string[];
  alternatives?: string[];
  metadata?: Record<string, any>;
}

export interface ReasoningContext {
  objective: string;
  currentStep: number;
  totalSteps: number;
  steps: ReasoningStep[];
  uncertainties: string[];
  confidence: number;
  alternativeApproaches: string[];
  finalConclusion?: string;
  metadata: {
    reasoningDepth: number;
    timeSpent: number;
    tokensUsed?: number;
  };
}

// ─── Security Context ────────────────────────────────────────

export interface SecurityContext {
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: Vulnerability[];
  recommendations: SecurityRecommendation[];
  compliance: ComplianceStatus[];
  lastScan?: Date;
  scanResults?: SecurityScanResult;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  evidence: string;
  cwe?: string;
  cvss?: number;
  remediation?: string;
}

export interface SecurityRecommendation {
  id: string;
  type: 'fix' | 'mitigation' | 'monitoring';
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  impact: string;
}

export interface ComplianceStatus {
  standard: string;
  status: 'compliant' | 'non-compliant' | 'unknown';
  details?: string;
}

export interface SecurityScanResult {
  scannedAt: Date;
  duration: number;
  filesScanned: number;
  vulnerabilitiesFound: number;
  complianceScore: number;
}

// ─── Multimodal Context ──────────────────────────────────────

export interface MultimodalContext {
  textContent: string;
  images: ImageAnalysis[];
  diagrams: DiagramAnalysis[];
  charts: ChartAnalysis[];
  documents: DocumentAnalysis[];
  synthesis?: KnowledgeSynthesis;
}

export interface ImageAnalysis {
  id: string;
  url?: string;
  base64?: string;
  description: string;
  objects: string[];
  text?: string;
  patterns?: string[];
  metadata?: Record<string, any>;
}

export interface DiagramAnalysis {
  id: string;
  type: 'flowchart' | 'architecture' | 'sequence' | 'entity-relationship' | 'other';
  description: string;
  elements: DiagramElement[];
  relationships: DiagramRelationship[];
  interpretation: string;
}

export interface DiagramElement {
  id: string;
  type: string;
  label: string;
  position?: { x: number; y: number };
  properties?: Record<string, any>;
}

export interface DiagramRelationship {
  from: string;
  to: string;
  type: string;
  label?: string;
  properties?: Record<string, any>;
}

export interface ChartAnalysis {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'other';
  title?: string;
  axes: ChartAxis[];
  data: ChartDataPoint[];
  trends: string[];
  insights: string[];
}

export interface ChartAxis {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime';
  values?: any[];
}

export interface ChartDataPoint {
  x: any;
  y: any;
  label?: string;
  metadata?: Record<string, any>;
}

export interface DocumentAnalysis {
  id: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'other';
  title?: string;
  summary: string;
  keyPoints: string[];
  entities: DocumentEntity[];
  sections: DocumentSection[];
}

export interface DocumentEntity {
  type: string;
  value: string;
  confidence: number;
  context?: string;
}

export interface DocumentSection {
  title: string;
  content: string;
  level: number;
  startPage?: number;
  endPage?: number;
}

export interface KnowledgeSynthesis {
  domains: string[];
  connections: KnowledgeConnection[];
  insights: string[];
  gaps: string[];
  recommendations: string[];
}

export interface KnowledgeConnection {
  from: string;
  to: string;
  type: 'supports' | 'contradicts' | 'extends' | 'complements';
  strength: number;
  evidence: string;
}

// ─── Execution Context ───────────────────────────────────────

export interface ExecutionStep {
  id: string;
  timestamp: Date;
  action: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// ─── Agent Result ────────────────────────────────────────────

export interface AgentResult {
  success: boolean;
  output: Record<string, any>;
  reasoning?: ReasoningContext;
  security?: SecurityContext;
  multimodal?: MultimodalContext;
  execution: {
    totalSteps: number;
    duration: number;
    tokensUsed?: number;
    cost?: number;
  };
  metadata: {
    agentId: string;
    agentVersion: string;
    completedAt: Date;
    warnings?: string[];
    errors?: string[];
  };
}

// ─── Agent Interface ─────────────────────────────────────────

export interface IAgent {
  readonly metadata: AgentMetadata;
  readonly state: AgentState;

  initialize(context: IAgentContext): Promise<void>;
  execute(input: Record<string, any>, context: IAgentContext): Promise<AgentResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  terminate(): Promise<void>;
  cleanup(): Promise<void>;

  // Advanced capabilities
  canHandleCapability(capability: AgentCapability): boolean;
  getCapabilityScore(capability: AgentCapability): number;

  // Reasoning methods
  decomposeTask?(task: string, context: IAgentContext): Promise<string[]>;
  validateSolution?(solution: any, context: IAgentContext): Promise<ValidationResult>;

  // Security methods
  analyzeSecurity?(target: any, context: IAgentContext): Promise<SecurityContext>;

  // Multimodal methods
  analyzeImage?(image: ImageAnalysis, context: IAgentContext): Promise<string>;
  analyzeDiagram?(diagram: DiagramAnalysis, context: IAgentContext): Promise<string>;
  analyzeChart?(chart: ChartAnalysis, context: IAgentContext): Promise<string>;

  // Autonomous operation
  shouldContinue?(context: IAgentContext): Promise<boolean>;
  adaptBehavior?(feedback: any, context: IAgentContext): Promise<void>;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

// ─── Base Agent Implementation ───────────────────────────────

export abstract class BaseAgent implements IAgent {
  public readonly metadata: AgentMetadata;
  protected _state: AgentState = AgentState.IDLE;
  protected context?: IAgentContext;

  constructor(metadata: AgentMetadata) {
    this.metadata = { ...metadata };
  }

  get state(): AgentState {
    return this._state;
  }

  async initialize(context: IAgentContext): Promise<void> {
    this.context = context;
    this._state = AgentState.INITIALIZING;
    // Initialize agent-specific resources
    this._state = AgentState.IDLE;
  }

  abstract execute(input: Record<string, any>, context: IAgentContext): Promise<AgentResult>;

  async pause(): Promise<void> {
    if (this._state === AgentState.RUNNING) {
      this._state = AgentState.PAUSED;
    }
  }

  async resume(): Promise<void> {
    if (this._state === AgentState.PAUSED) {
      this._state = AgentState.RUNNING;
    }
  }

  async terminate(): Promise<void> {
    this._state = AgentState.TERMINATED;
    await this.cleanup();
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
    this.context = undefined;
  }

  canHandleCapability(capability: AgentCapability): boolean {
    return this.metadata.capabilities.includes(capability);
  }

  getCapabilityScore(capability: AgentCapability): number {
    return this.canHandleCapability(capability) ? 1.0 : 0.0;
  }
}

// ─── Agent Registry ──────────────────────────────────────────

export interface IAgentRegistry {
  register(agent: IAgent): void;
  unregister(agentId: string): void;
  getAgent(agentId: string): IAgent | undefined;
  getAgentsByCapability(capability: AgentCapability): IAgent[];
  getAllAgents(): IAgent[];
  findBestAgentForTask(task: string, requiredCapabilities?: AgentCapability[]): IAgent | undefined;
}

// ─── Agent Registry Implementation ───────────────────────────

export class AgentRegistry implements IAgentRegistry {
  private agents = new Map<string, IAgent>();

  register(agent: IAgent): void {
    this.agents.set(agent.metadata.id, agent);
  }

  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  getAgent(agentId: string): IAgent | undefined {
    return this.agents.get(agentId);
  }

  getAgentsByCapability(capability: AgentCapability): IAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      agent.canHandleCapability(capability)
    );
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values());
  }

  findBestAgentForTask(task: string, requiredCapabilities?: AgentCapability[]): IAgent | undefined {
    const candidates = requiredCapabilities
      ? this.getAgentsByCapability(requiredCapabilities[0])
      : this.getAllAgents();

    if (candidates.length === 0) return undefined;

    // Simple scoring based on capabilities match
    // In a real implementation, this would use ML to score agent fitness
    return candidates[0];
  }
}

// ─── Global Registry Instance ────────────────────────────────

let globalRegistry: IAgentRegistry | null = null;

export function getAgentRegistry(): IAgentRegistry | null {
  return globalRegistry;
}

export function setAgentRegistry(registry: IAgentRegistry): void {
  globalRegistry = registry;
}

// ─── Agent Context Builder ───────────────────────────────────

export class AgentContextBuilder {
  private context: Partial<IAgentContext> = {
    id: '',
    agentId: '',
    sessionId: '',
    input: {},
    state: {},
    memory: new Map(),
    execution: {
      steps: []
    },
    metadata: {
      createdAt: new Date(),
      lastActivity: new Date(),
      totalSteps: 0
    }
  };

  withId(id: string): this {
    this.context.id = id;
    return this;
  }

  withAgentId(agentId: string): this {
    this.context.agentId = agentId;
    return this;
  }

  withSessionId(sessionId: string): this {
    this.context.sessionId = sessionId;
    return this;
  }

  withWorkspaceId(workspaceId: string): this {
    this.context.workspaceId = workspaceId;
    return this;
  }

  withUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  withInput(input: Record<string, any>): this {
    this.context.input = input;
    return this;
  }

  withInitialState(state: Record<string, any>): this {
    this.context.state = state;
    return this;
  }

  withReasoning(reasoning: ReasoningContext): this {
    this.context.reasoning = reasoning;
    return this;
  }

  withSecurity(security: SecurityContext): this {
    this.context.security = security;
    return this;
  }

  withMultimodal(multimodal: MultimodalContext): this {
    this.context.multimodal = multimodal;
    return this;
  }

  build(): IAgentContext {
    if (!this.context.id || !this.context.agentId || !this.context.sessionId) {
      throw new Error('Agent context requires id, agentId, and sessionId');
    }

    return this.context as IAgentContext;
  }
}

// ─── Agent Lifecycle Management ─────────────────────────────

export type LifecyclePhase =
  | 'created'
  | 'initializing'
  | 'initialized'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'cleaned';

export interface LifecycleEvent {
  phase: LifecyclePhase;
  agentId: string;
  contextId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface IAgentLifecycleHook {
  onPhaseChange(event: LifecycleEvent): Promise<void> | void;
}

export interface IAgentLifecycleManager {
  registerHook(hook: IAgentLifecycleHook): void;
  unregisterHook(hook: IAgentLifecycleHook): void;
  emitPhaseChange(event: LifecycleEvent): Promise<void>;
}

// ─── Agent Lifecycle Manager Implementation ──────────────────

export class AgentLifecycleManager extends EventEmitter implements IAgentLifecycleManager {
  private hooks: IAgentLifecycleHook[] = [];

  registerHook(hook: IAgentLifecycleHook): void {
    this.hooks.push(hook);
  }

  unregisterHook(hook: IAgentLifecycleHook): void {
    const index = this.hooks.indexOf(hook);
    if (index > -1) {
      this.hooks.splice(index, 1);
    }
  }

  async emitPhaseChange(event: LifecycleEvent): Promise<void> {
    // Emit to hooks
    await Promise.all(
      this.hooks.map(hook => {
        try {
          return hook.onPhaseChange(event);
        } catch (error) {
          console.error('Lifecycle hook error:', error);
          return Promise.resolve();
        }
      })
    );

    // Emit to EventEmitter listeners
    this.emit('phase-change', event);
  }
}

// ─── Global Lifecycle Manager Instance ───────────────────────

let globalLifecycleManager: IAgentLifecycleManager | null = null;

export function getLifecycleManager(): IAgentLifecycleManager | null {
  return globalLifecycleManager;
}

export function setLifecycleManager(manager: IAgentLifecycleManager): void {
  globalLifecycleManager = manager;
}
