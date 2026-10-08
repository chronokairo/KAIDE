import React, { useState, useMemo } from 'react';
import { 
  Network, 
  User, 
  Building2, 
  Scale, 
  ShieldAlert, 
  Search, 
  Filter, 
  Info, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Globe
} from 'lucide-react';
import { RelationshipGraph, GraphNode } from '../types';

interface GraphViewProps {
  graph: RelationshipGraph | null;
  onSelectNode?: (node: GraphNode) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({ graph, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
          <Network className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Nenhum Grafo Gerado Ainda</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Execute uma investigação na aba principal para que o Rust Graph Engine processe as conexões entre Pessoas, Empresas e Processos.
        </p>
      </div>
    );
  }

  // Filter nodes based on search and type
  const filteredNodes = useMemo(() => {
    return graph.nodes.filter((node) => {
      const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            node.sub_label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || node.node_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [graph, searchTerm, filterType]);

  // Layout calculations for Canvas / SVG nodes
  const layoutNodes = useMemo(() => {
    const total = filteredNodes.length;
    const centerX = 400;
    const centerY = 300;
    const radius = 210;

    return filteredNodes.map((node, i) => {
      if (node.is_target) {
        return { ...node, x: centerX, y: centerY };
      }
      const angle = ((i - 1) / (total - 1)) * 2 * Math.PI;
      const r = radius + (i % 2 === 0 ? 30 : -20);
      return {
        ...node,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      };
    });
  }, [filteredNodes]);

  const getNodeColor = (type: string, isTarget: boolean) => {
    if (isTarget) return { border: 'border-cyan-400', bg: 'bg-cyan-500/20', text: 'text-cyan-300', glow: 'shadow-[0_0_25px_rgba(6,182,212,0.6)]' };
    switch (type) {
      case 'person':
        return { border: 'border-purple-500', bg: 'bg-purple-950/60', text: 'text-purple-300', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' };
      case 'company':
        return { border: 'border-amber-500', bg: 'bg-amber-950/60', text: 'text-amber-300', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' };
      case 'legal_case':
        return { border: 'border-rose-500', bg: 'bg-rose-950/60', text: 'text-rose-300', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' };
      case 'web_source':
        return { border: 'border-emerald-500', bg: 'bg-emerald-950/60', text: 'text-emerald-300', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
      default:
        return { border: 'border-slate-600', bg: 'bg-slate-900', text: 'text-slate-300', glow: '' };
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4" />;
      case 'company': return <Building2 className="w-4 h-4" />;
      case 'legal_case': return <Scale className="w-4 h-4" />;
      case 'web_source': return <Globe className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar no Grafo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="person">Pessoas</option>
            <option value="company">Empresas</option>
            <option value="legal_case">Processos</option>
            <option value="web_source">Web OSINT</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-400">Alvo Principal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span className="text-slate-400">Pessoas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-400">Empresas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span className="text-slate-400">Processos</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph View area & Node Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG/Interactive Visual Canvas */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 border border-slate-800 relative overflow-hidden min-h-[550px] flex items-center justify-center">
          {/* Subtle Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          <svg className="w-full h-[550px] relative z-10">
            {/* Render Edges */}
            {graph.edges.map((edge) => {
              const sourceNode = layoutNodes.find((n) => n.id === edge.source);
              const targetNode = layoutNodes.find((n) => n.id === edge.target);

              if (!sourceNode || !targetNode) return null;

              const isHighlighted = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

              return (
                <g key={edge.id}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHighlighted ? '#38bdf8' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={edge.verified ? 'none' : '4,4'}
                  />
                  {/* Connection Label */}
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2 - 6}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    className="select-none bg-slate-950/80 px-1"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Render Nodes */}
            {layoutNodes.map((node) => {
              const style = getNodeColor(node.node_type, node.is_target);
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                >
                  <circle
                    r={node.is_target ? 28 : 20}
                    className={`${style.bg} ${style.border} stroke-2 transition-all ${style.glow} ${isSelected ? 'stroke-white stroke-[3px]' : ''}`}
                  />
                  <foreignObject
                    x={node.is_target ? -12 : -8}
                    y={node.is_target ? -12 : -8}
                    width={node.is_target ? 24 : 16}
                    height={node.is_target ? 24 : 16}
                    className="pointer-events-none"
                  >
                    <div className={`${style.text} flex items-center justify-center w-full h-full`}>
                      {getNodeIcon(node.node_type)}
                    </div>
                  </foreignObject>

                  {/* Label below node */}
                  <text
                    y={node.is_target ? 42 : 34}
                    textAnchor="middle"
                    fill="#f3f4f6"
                    fontSize={node.is_target ? '12' : '10'}
                    fontWeight={node.is_target ? '700' : '500'}
                    className="select-none text-shadow"
                  >
                    {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                  </text>

                  {/* Sub-label */}
                  <text
                    y={node.is_target ? 54 : 44}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="JetBrains Mono"
                    className="select-none"
                  >
                    {node.sub_label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspection Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-6">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedNode.is_target ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedNode.node_type} {selectedNode.is_target && '• Alvo Direct'}
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Risco: {(selectedNode.risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedNode.sub_label}</p>
              </div>

              {/* Node Details Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" /> Atributos Registrados
                </h4>
                <div className="space-y-2">
                  {Object.entries(selectedNode.details).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                      <span className="text-slate-400 font-medium">{key}:</span>
                      <span className="text-slate-200 font-mono text-right font-semibold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Adjacências no Grafo
                </h4>
                <div className="space-y-1.5">
                  {graph.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => {
                      const otherId = edge.source === selectedNode.id ? edge.target : edge.source;
                      const otherNode = graph.nodes.find((n) => n.id === otherId);
                      return (
                        <div key={edge.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{otherNode?.label}</span>
                          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                            {edge.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3 text-slate-500 my-auto">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">Clique em qualquer nó do grafo para inspecionar atributos, sócios, processos e conexões.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total de Entidades: <strong className="text-slate-300">{graph.total_entities}</strong></span>
            <span>Néxos Ocultos: <strong className="text-rose-400 font-mono">{graph.hidden_nexus_count}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
