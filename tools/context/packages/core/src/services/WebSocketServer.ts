import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

/**
 * WebSocket Server for Real-time Updates
 * 
 * Handles real-time streaming of:
 * - Task execution progress
 * - Agent status changes
 * - Workflow execution updates
 * - System events
 * - Error notifications
 */

export interface WebSocketMessage {
  type: 'task-update' | 'agent-status' | 'workflow-progress' | 'system-event' | 'error';
  taskId?: string;
  agentId?: string;
  workflowId?: string;
  data: unknown;
  timestamp: number;
  executionId?: string;
}

export interface TaskUpdateMessage extends WebSocketMessage {
  type: 'task-update';
  taskId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number; // 0-100
  output?: unknown;
  error?: string;
}

export interface AgentStatusMessage extends WebSocketMessage {
  type: 'agent-status';
  agentId: string;
  status: 'idle' | 'running' | 'paused' | 'error' | 'stopped';
  currentTask?: string;
  taskCount: number;
}

export interface WorkflowProgressMessage extends WebSocketMessage {
  type: 'workflow-progress';
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  stepStatus?: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
}

export interface ClientSubscription {
  clientId: string;
  workspaceId: string;
  filters: {
    taskIds?: string[];
    agentIds?: string[];
    workflowIds?: string[];
    messageTypes?: string[];
  };
  connectedAt: number;
}

const logger = Logger.getInstance();

export class WebSocketServer {
  private io: Server;
  private clients: Map<string, ClientSubscription> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private messageHistory: Map<string, WebSocketMessage[]> = new Map();
  private maxHistorySize: number = 1000;

  constructor(httpServer: HTTPServer, private jwtSecret: string) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        socket.data.userId = decoded.userId;
        socket.data.workspaceId = decoded.workspaceId;
        socket.data.role = decoded.role;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = uuidv4();
      const workspaceId = socket.data.workspaceId;

      logger.info(`[WebSocket] Client connected`, {
        clientId,
        workspaceId,
        userId: socket.data.userId,
      });

      // Register client
      const subscription: ClientSubscription = {
        clientId,
        workspaceId,
        filters: {},
        connectedAt: Date.now(),
      };
      this.clients.set(socket.id, subscription);

      // Join workspace room
      socket.join(`workspace:${workspaceId}`);

      // Send connection confirmation
      socket.emit('connected', {
        clientId,
        workspaceId,
        timestamp: Date.now(),
      });

      // Handle subscriptions
      socket.on('subscribe', (data: any) => {
        this.handleSubscribe(socket, data);
      });

      socket.on('unsubscribe', (data: any) => {
        this.handleUnsubscribe(socket, data);
      });

      // Handle reconnection
      socket.on('reconnect', () => {
        logger.info(`[WebSocket] Client reconnected`, { clientId });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`[WebSocket] Client disconnected`, { clientId });
        this.clients.delete(socket.id);
      });
    });
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(socket: Socket, data: any): void {
    const subscription = this.clients.get(socket.id);
    if (!subscription) return;

    subscription.filters = {
      taskIds: data.taskIds || [],
      agentIds: data.agentIds || [],
      workflowIds: data.workflowIds || [],
      messageTypes: data.messageTypes || [],
    };

    // Join task/agent/workflow rooms
    if (data.taskIds) {
      data.taskIds.forEach((taskId: string) => {
        socket.join(`task:${taskId}`);
      });
    }

    if (data.agentIds) {
      data.agentIds.forEach((agentId: string) => {
        socket.join(`agent:${agentId}`);
      });
    }

    if (data.workflowIds) {
      data.workflowIds.forEach((workflowId: string) => {
        socket.join(`workflow:${workflowId}`);
      });
    }

    socket.emit('subscribed', {
      filters: subscription.filters,
      timestamp: Date.now(),
    });

    logger.info(`[WebSocket] Client subscribed`, {
      clientId: subscription.clientId,
      filters: subscription.filters,
    });
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscribe(socket: Socket, data: any): void {
    const subscription = this.clients.get(socket.id);
    if (!subscription) return;

    if (data.taskIds) {
      data.taskIds.forEach((taskId: string) => {
        socket.leave(`task:${taskId}`);
      });
    }

    if (data.agentIds) {
      data.agentIds.forEach((agentId: string) => {
        socket.leave(`agent:${agentId}`);
      });
    }

    socket.emit('unsubscribed', {
      timestamp: Date.now(),
    });

    logger.info(`[WebSocket] Client unsubscribed`, {
      clientId: subscription.clientId,
    });
  }

  /**
   * Broadcast task update
   */
  broadcastTaskUpdate(update: TaskUpdateMessage): void {
    const room = `task:${update.taskId}`;
    this.io.to(room).emit('message', update);
    this.storeMessage(room, update);

    logger.debug(`[WebSocket] Task update broadcasted`, {
      taskId: update.taskId,
      status: update.status,
    });
  }

  /**
   * Broadcast agent status change
   */
  broadcastAgentStatus(update: AgentStatusMessage): void {
    const room = `agent:${update.agentId}`;
    this.io.to(room).emit('message', update);
    this.storeMessage(room, update);

    logger.debug(`[WebSocket] Agent status broadcasted`, {
      agentId: update.agentId,
      status: update.status,
    });
  }

  /**
   * Broadcast workflow progress
   */
  broadcastWorkflowProgress(update: WorkflowProgressMessage): void {
    const room = `workflow:${update.workflowId}`;
    this.io.to(room).emit('message', update);
    this.storeMessage(room, update);

    logger.debug(`[WebSocket] Workflow progress broadcasted`, {
      workflowId: update.workflowId,
      progress: update.progress,
    });
  }

  /**
   * Broadcast system event to workspace
   */
  broadcastSystemEvent(workspaceId: string, event: WebSocketMessage): void {
    const room = `workspace:${workspaceId}`;
    this.io.to(room).emit('message', event);
    this.storeMessage(room, event);
  }

  /**
   * Store message in history
   */
  private storeMessage(room: string, message: WebSocketMessage): void {
    if (!this.messageHistory.has(room)) {
      this.messageHistory.set(room, []);
    }

    const history = this.messageHistory.get(room)!;
    history.push(message);

    // Keep history size bounded
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Get message history for a room
   */
  getMessageHistory(room: string, limit: number = 100): WebSocketMessage[] {
    const history = this.messageHistory.get(room) || [];
    return history.slice(-limit);
  }

  /**
   * Stream task execution in real-time
   */
  async streamTaskExecution(
    taskId: string,
    generatorFn: AsyncGenerator<unknown, void, unknown>
  ): Promise<void> {
    let progress = 0;
    const totalSteps = 100;

    for await (const result of generatorFn) {
      progress += 10;

      this.broadcastTaskUpdate({
        type: 'task-update',
        taskId,
        status: 'running',
        progress: Math.min(progress, totalSteps),
        data: result,
        timestamp: Date.now(),
      });

      // Yield to event loop
      await new Promise(resolve => setImmediate(resolve));
    }

    this.broadcastTaskUpdate({
      type: 'task-update',
      taskId,
      status: 'completed',
      progress: 100,
      data: { completed: true },
      timestamp: Date.now(),
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients in workspace
   */
  getWorkspaceClients(workspaceId: string): ClientSubscription[] {
    return Array.from(this.clients.values()).filter(
      client => client.workspaceId === workspaceId
    );
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connectedClients: number;
    rooms: number;
    messagesInHistory: number;
  } {
    return {
      connectedClients: this.getConnectedClientsCount(),
      rooms: this.rooms.size,
      messagesInHistory: Array.from(this.messageHistory.values()).reduce(
        (sum, history) => sum + history.length,
        0
      ),
    };
  }

  /**
   * Close WebSocket server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        logger.info('[WebSocket] Server closed');
        resolve();
      });
    });
  }
}

export default WebSocketServer;
