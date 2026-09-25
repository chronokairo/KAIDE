'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, Terminal as TerminalIcon, Cpu, Settings, 
  ChevronRight, ChevronLeft, Activity, Box, History,
  Zap, Shield, Play, CheckCircle, XCircle, Clock,
  Server, Layers, Database, Code, Search, Bell,
  User, Menu, X, Plus, Trash2, RefreshCw
} from 'lucide-react';

type SystemMode = 'debian' | 'ubuntu' | 'nixos';

interface TaskStep {
  id: string;
  command: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

interface Task {
  id: string;
  description: string;
  steps: TaskStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt?: Date;
}

interface Container {
  id: string;
  name: string;
  mode: SystemMode;
  status: 'running' | 'stopped';
  cpu?: number;
  memory?: number;
}

interface HistoryItem {
  id: string;
  command: string;
  status: 'success' | 'failed';
  timestamp: Date;
}

interface TerminalOutput {
  type: 'command' | 'output' | 'error' | 'info' | 'success';
  content: string;
  timestamp: Date;
}

export function AgentConsole() {
  const [message, setMessage] = useState('');
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [agentReady, setAgentReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<SystemMode>('ubuntu');
  const [containers, setContainers] = useState<Container[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeContainer, setActiveContainer] = useState<string>('');
  const [showPlan, setShowPlan] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeAgent();
    loadContainers();
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const initializeAgent = async () => {
    try {
      const response = await fetch('/api/agent/initialize', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setAgentReady(true);
        addOutput('info', '🤖 Agent inicializado com gemma3:1b');
      }
    } catch (error) {
      addOutput('error', `Erro: ${error}`);
    }
  };

  const loadContainers = async () => {
    try {
      const response = await fetch('/api/containers');
      const data = await response.json();
      if (data.success && data.containers) {
        setContainers(data.containers);
        if (data.containers.length > 0) {
          setActiveContainer(data.containers[0].id);
        }
      }
    } catch (error) {
      setContainers([
        { id: '1', name: 'dev-container', mode: 'ubuntu', status: 'running', cpu: 12, memory: 256 }
      ]);
    }
  };

  const loadHistory = () => {
    setHistory([
      { id: '1', command: 'Criar arquivo hello.py', status: 'success', timestamp: new Date() },
      { id: '2', command: 'Instalar dependências', status: 'failed', timestamp: new Date() },
    ]);
  };

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    setOutputs(prev => [...prev, { type, content: String(content), timestamp: new Date() }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isRunning) return;

    const userMsg = message;
    addOutput('info', `👤 ${userMsg}`);
    setMessage('');
    setIsRunning(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await response.json();

      if (data.success) {
        const task: Task = { ...data.task, createdAt: new Date() };
        setPendingPlan(task);
        setShowPlan(true);
        addOutput('info', `🧠 Plano gerado: ${task.description}`);
      } else {
        addOutput('error', data.error?.message || 'Erro');
      }
    } catch (error) {
      addOutput('error', `Erro: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const executePlan = async () => {
    if (!pendingPlan) return;
    setShowPlan(false);
    setIsRunning(true);

    for (const step of pendingPlan.steps) {
      addOutput('command', `$ ${step.command}`);
      addOutput('info', `⚡ ${step.description}`);
      await new Promise(r => setTimeout(r, 800));
      addOutput('success', `✓ Concluído`);
    }

    setHistory(prev => [{
      id: Date.now().toString(),
      command: pendingPlan.description,
      status: 'success',
      timestamp: new Date()
    }, ...prev]);

    addOutput('success', `✅ Execução finalizada: ${pendingPlan.description}`);
    setPendingPlan(null);
    setIsRunning(false);
  };

  const modeConfig = {
    debian: { color: '#9CA3AF', bg: '#1F2937', desc: 'Safe Mode' },
    ubuntu: { color: '#E95420', bg: '#2D1B0E', desc: 'Dev Mode' },
    nixos: { color: '#5277C3', bg: '#1A2744', desc: 'Declarative' },
  };

  return (
    <div className="aegis-root">
      {/* Top Bar */}
      <header className="aegis-topbar">
        <div className="topbar-left">
          <div className="logo">
            <Cpu size={18} />
            <span>AegisOS</span>
          </div>
          <div className="search-box">
            <Search size={14} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn" title="Notificações">
            <Bell size={16} />
            {notifications > 0 && <span className="badge">{notifications}</span>}
          </button>
          <button className="topbar-btn" title="Configurações">
            <Settings size={16} />
          </button>
          <div className="user-info">
            <User size={16} />
            <span>Admin</span>
          </div>
        </div>
      </header>

      <div className="aegis-body">
        {/* Sidebar */}
        <aside className={`aegis-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            {sidebarOpen && <span className="sidebar-title">Sistema</span>}
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Mode Selector */}
          {sidebarOpen && (
            <div className="mode-section">
              <div className="mode-label">MODO</div>
              <div className="mode-grid">
                {(['debian', 'ubuntu', 'nixos'] as SystemMode[]).map(mode => (
                  <button
                    key={mode}
                    className={`mode-card ${activeMode === mode ? 'active' : ''}`}
                    style={{ 
                      borderColor: activeMode === mode ? modeConfig[mode].color : 'transparent',
                      background: activeMode === mode ? modeConfig[mode].bg : 'transparent'
                    }}
                    onClick={() => setActiveMode(mode)}
                  >
                    <span className="mode-name" style={{ color: modeConfig[mode].color }}>
                      {mode.toUpperCase()}
                    </span>
                    <span className="mode-desc">{modeConfig[mode].desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="sidebar-nav">
            {[
              { id: 'containers', icon: Box, label: 'Contêineres' },
              { id: 'history', icon: History, label: 'Histórico' },
              { id: 'settings', icon: Settings, label: 'Config' },
            ].map(item => (
              <button key={item.id} className="nav-item" title={item.label}>
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Containers List */}
          {sidebarOpen && containers.length > 0 && (
            <div className="containers-section">
              <div className="section-header">
                <span>CONTÊINERES</span>
                <button className="icon-btn"><Plus size={14} /></button>
              </div>
              {containers.map(container => (
                <div 
                  key={container.id}
                  className={`container-card ${activeContainer === container.id ? 'active' : ''}`}
                  onClick={() => setActiveContainer(container.id)}
                >
                  <div className="container-info">
                    <Server size={14} />
                    <span>{container.name}</span>
                  </div>
                  <div className="container-stats">
                    <span className={`status-dot ${container.status}`}>
                      {container.status === 'running' ? '●' : '○'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Footer */}
          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="status-item">
                <Shield size={12} />
                <span>Policy: OK</span>
              </div>
              <div className="status-item">
                <Zap size={12} />
                <span>gemma3:1b</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="aegis-main">
          {/* Chat Panel */}
          <div className="chat-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Code size={16} />
                <span>Agente</span>
              </div>
              <div className="panel-status">
                <span className={`status-indicator ${agentReady ? 'ready' : ''}`} />
                {agentReady ? 'Online' : 'Inicializando...'}
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {outputs.map((output, i) => (
                <div key={i} className={`message message-${output.type}`}>
                  {output.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Plan Modal */}
            {showPlan && pendingPlan && (
              <div className="plan-modal">
                <div className="plan-header">
                  <span>📋 PLANO GERADO</span>
                  <button onClick={() => setShowPlan(false)}><X size={14} /></button>
                </div>
                <div className="plan-body">
                  <p className="plan-desc">{pendingPlan.description}</p>
                  <div className="plan-steps">
                    {pendingPlan.steps.map((step, i) => (
                      <div key={i} className="plan-step">
                        <span className="step-num">{i + 1}</span>
                        <span className="step-desc">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="plan-actions">
                  <button className="btn-primary" onClick={executePlan}>
                    <Play size={14} /> Executar
                  </button>
                  <button className="btn-secondary" onClick={() => setShowPlan(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-input-wrapper">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o que você quer fazer..."
                disabled={!agentReady || isRunning}
                className="chat-input"
              />
              <button type="submit" disabled={!agentReady || isRunning || !message.trim()} className="send-btn">
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Terminal Panel */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <TerminalIcon size={16} />
                <span>Terminal</span>
              </div>
              <div className="terminal-controls">
                <button className="icon-btn" title="Limpar"><Trash2 size={14} /></button>
                <button className="icon-btn" title="Atualizar"><RefreshCw size={14} /></button>
                <span className={`terminal-status ${isRunning ? 'running' : 'idle'}`}>
                  {isRunning ? '⏳ Executando' : '○ Inativo'}
                </span>
              </div>
            </div>
            <div className="terminal-output">
              {outputs.length === 0 ? (
                <div className="terminal-empty">
                  <p>Aguardando comandos...</p>
                </div>
              ) : (
                outputs.map((output, i) => (
                  <div key={i} className={`terminal-line terminal-${output.type}`}>
                    <span className="timestamp">
                      {new Date(output.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="content">
                      {output.type === 'command' && '$ '}
                      {output.content}
                    </span>
                  </div>
                ))
              )}
              {isRunning && (
                <div className="terminal-line terminal-info">
                  <span className="content animate-pulse">▋</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-item">
              <Layers size={12} />
              <span>Modo: {activeMode.toUpperCase()}</span>
            </div>
            <div className="status-item">
              <Box size={12} />
              <span>{containers.length} contêineres</span>
            </div>
            <div className="status-item">
              <Database size={12} />
              <span>Mem: {containers[0]?.memory || 0}MB</span>
            </div>
            <div className="status-item">
              <Activity size={12} />
              <span>CPU: {containers[0]?.cpu || 0}%</span>
            </div>
            <div className="status-item">
              <Clock size={12} />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}