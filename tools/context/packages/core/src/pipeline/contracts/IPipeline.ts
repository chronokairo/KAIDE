export interface IPipeline {}
export type PhaseStatus = 'pending' | 'running' | 'completed' | 'failed' | 'approved' | 'rejected';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type PipelineStatus = 'created' | 'running' | 'completed' | 'failed' | 'paused';
export interface TaskDescription {}
export interface AgentTask {}
export interface TaskMetrics {}
export type PhaseConditionType = string;
export interface PhaseCondition {}
export interface PhaseHooks {}
export interface PhaseConfig {}
export interface PipelinePhase {}
export interface PipelineSettings {}
export interface PipelineTemplate {}
export interface Pipeline {}
export interface PipelineMetrics {}
export type PipelineEventType = string;
export interface PipelineEvent {}
