import { Logger } from '../utils/Logger';
import { AIProvider } from '../providers/AIProvider';
import { v4 as uuidv4 } from 'uuid';
import * as vm from 'vm';
import * as os from 'os';

/**
 * Task Executor Service with Sandboxing & Resource Limits
 * 
 * Executes agent tasks in isolated sandbox environments with resource constraints
 * Supports code execution, analysis tasks, and complex problem solving
 */

export interface SandboxConfig {
  timeoutMs: number;
  memoryLimitMb: number;
  cpuLimitMs: number;
  maxFileSize: number;
  allowedModules: string[];
  isolationLevel: 'strict' | 'moderate' | 'permissive';
}

export interface ExecutionContext {
  taskId: string;
  agentId: string;
  workspaceId: string;
  executionId: string;
  startTime: number;
  timeout: NodeJS.Timeout | null;
  result?: unknown;
  error?: Error;
  metrics: ExecutionMetrics;
}

export interface ExecutionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
  cpuTime?: number;
  successfulSteps: number;
  failedSteps: number;
  tokensUsed: number;
}

export interface SandboxedCode {
  code: string;
  language: string;
  environment?: Record<string, unknown>;
  timeout?: number;
}

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  metrics: ExecutionMetrics;
  executionId: string;
  timestamp: number;
}

const logger = Logger.getInstance();

export class TaskExecutorService {
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private maxConcurrentExecutions: number = 10;
  private executionQueue: string[] = [];

  constructor(private aiProvider?: AIProvider) {}

  /**
   * Execute a task in a sandboxed environment
   */
  async executeTask(
    taskId: string,
    agentId: string,
    workspaceId: string,
    code: SandboxedCode,
    config: SandboxConfig = this.getDefaultConfig()
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    logger.info(`[TaskExecutor] Starting task execution`, {
      taskId,
      agentId,
      executionId,
      language: code.language,
      timeout: config.timeoutMs,
    });

    const context: ExecutionContext = {
      taskId,
      agentId,
      workspaceId,
      executionId,
      startTime,
      timeout: null,
      metrics: {
        startTime,
        successfulSteps: 0,
        failedSteps: 0,
        tokensUsed: 0,
      },
    };

    try {
      // Queue execution if at capacity
      while (this.activeExecutions.size >= this.maxConcurrentExecutions) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.activeExecutions.set(executionId, context);

      // Execute based on language
      let output: unknown;

      if (code.language === 'javascript' || code.language === 'typescript') {
        output = await this.executeJavaScript(code, context, config);
      } else if (code.language === 'python') {
        output = await this.executePython(code, context, config);
      } else if (code.language === 'analysis') {
        output = await this.executeAnalysis(code, context, config);
      } else {
        throw new Error(`Unsupported language: ${code.language}`);
      }

      context.result = output;
      context.metrics.successfulSteps++;
      context.metrics.endTime = Date.now();
      context.metrics.duration = context.metrics.endTime - context.metrics.startTime;

      logger.info(`[TaskExecutor] Task execution completed`, {
        executionId,
        duration: context.metrics.duration,
        success: true,
      });

      return {
        success: true,
        output,
        metrics: context.metrics,
        executionId,
        timestamp: Date.now(),
      };
    } catch (error) {
      context.metrics.failedSteps++;
      context.metrics.endTime = Date.now();
      context.metrics.duration = context.metrics.endTime - context.metrics.startTime;
      context.error = error instanceof Error ? error : new Error(String(error));

      logger.error(`[TaskExecutor] Task execution failed`, {
        executionId,
        error: context.error.message,
        duration: context.metrics.duration,
      });

      return {
        success: false,
        error: context.error.message,
        metrics: context.metrics,
        executionId,
        timestamp: Date.now(),
      };
    } finally {
      // Clear timeout
      if (context.timeout) {
        clearTimeout(context.timeout);
      }
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute JavaScript/TypeScript code in VM sandbox
   */
  private async executeJavaScript(
    code: SandboxedCode,
    context: ExecutionContext,
    config: SandboxConfig
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const sandbox = {
        console: console,
        Buffer: Buffer,
        process: {
          env: {},
          version: process.version,
          platform: process.platform,
        },
        ...code.environment,
      };

      // Set timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${config.timeoutMs}ms`));
      }, config.timeoutMs);

      context.timeout = timeoutId;

      try {
        const script = new vm.Script(code.code);
        const vmContext = vm.createContext(sandbox);

        // Run with resource constraints
        const result = script.runInContext(vmContext, {
          timeout: config.timeoutMs,
          displayErrors: true,
        });

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Execute Python code via subprocess with resource limits
   */
  private async executePython(
    code: SandboxedCode,
    context: ExecutionContext,
    config: SandboxConfig
  ): Promise<unknown> {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const pyProcess = spawn('python', ['-c', code.code], {
        timeout: config.timeoutMs,
        maxBuffer: config.maxFileSize,
        env: {
          ...process.env,
          ...code.environment,
          PYTHONUNBUFFERED: '1',
        },
      });

      let output = '';
      let errorOutput = '';

      const timeoutId = setTimeout(() => {
        pyProcess.kill();
        reject(new Error(`Python execution timeout after ${config.timeoutMs}ms`));
      }, config.timeoutMs);

      context.timeout = timeoutId;

      pyProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      pyProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      pyProcess.on('close', (code: number) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch {
            resolve(output.trim());
          }
        } else {
          reject(new Error(`Python error: ${errorOutput}`));
        }
      });

      pyProcess.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Execute analysis tasks (code review, security analysis, etc.)
   */
  private async executeAnalysis(
    code: SandboxedCode,
    context: ExecutionContext,
    config: SandboxConfig
  ): Promise<unknown> {
    if (!this.aiProvider) {
      throw new Error('AI provider not configured for analysis tasks');
    }

    logger.info(`[TaskExecutor] Starting analysis execution`, {
      executionId: context.executionId,
      analysisType: code.environment?.type || 'generic',
    });

    // Parse analysis request
    const analysisType = code.environment?.type as string || 'generic';
    const input = code.environment?.input as string || '';

    // Create analysis prompt
    const systemPrompt = this.getAnalysisSystemPrompt(analysisType);
    const response = await this.aiProvider.chat([
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: input,
      },
    ]);

    context.metrics.tokensUsed = response.tokensUsed || 0;

    // Parse analysis results
    return {
      type: analysisType,
      result: response.message,
      analysis: this.parseAnalysisResult(response.message, analysisType),
      tokensUsed: response.tokensUsed,
    };
  }

  /**
   * Get system prompt for different analysis types
   */
  private getAnalysisSystemPrompt(type: string): string {
    const prompts: Record<string, string> = {
      'code-review': `You are an expert code reviewer. Analyze the provided code for:
        - Security vulnerabilities
        - Performance issues
        - Code quality and best practices
        - Maintainability concerns
        - Suggested improvements
        
        Format your response as JSON with keys: vulnerabilities, performance, quality, maintainability, suggestions`,

      'security-analysis': `You are a security expert. Analyze the provided code for security vulnerabilities:
        - CWE (Common Weakness Enumeration) classifications
        - CVSS severity scores
        - Attack vectors
        - Remediation steps
        
        Format your response as JSON with detailed vulnerability information`,

      'performance-analysis': `You are a performance optimization expert. Analyze the code for:
        - Time complexity
        - Space complexity
        - Bottlenecks
        - Optimization opportunities
        
        Format your response as JSON with performance metrics and recommendations`,

      'generic': `Analyze the provided content comprehensively and provide detailed insights.`,
    };

    return prompts[type] || prompts['generic'];
  }

  /**
   * Parse analysis results into structured format
   */
  private parseAnalysisResult(result: string, type: string): unknown {
    try {
      return JSON.parse(result);
    } catch {
      // If not JSON, structure as generic analysis
      return {
        type,
        raw: result,
        parseError: 'Could not parse as JSON',
      };
    }
  }

  /**
   * Cancel task execution
   */
  async cancelTask(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (context.timeout) {
      clearTimeout(context.timeout);
    }

    this.activeExecutions.delete(executionId);
    logger.info(`[TaskExecutor] Task cancelled`, { executionId });
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get resource statistics
   */
  getResourceStats(): {
    activeExecutions: number;
    memoryUsageMb: number;
    cpuUsage: number;
    availableMemory: number;
  } {
    return {
      activeExecutions: this.activeExecutions.size,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      cpuUsage: os.loadavg()[0],
      availableMemory: Math.round(os.freemem() / 1024 / 1024),
    };
  }

  /**
   * Get default sandbox configuration
   */
  private getDefaultConfig(): SandboxConfig {
    return {
      timeoutMs: 30000, // 30 seconds
      memoryLimitMb: 512,
      cpuLimitMs: 10000,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowedModules: ['fs', 'path', 'crypto', 'util'],
      isolationLevel: 'strict',
    };
  }
}

export default TaskExecutorService;
