// Core types for Activi Desktop Agent

export enum AgentMode {
  MANUAL = 'manual',
  INTERACTIVE = 'interactive',
  AUTONOMOUS = 'autonomous'
}

export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error'
}

export interface WorkflowStep {
  id: string
  type: 'navigate' | 'click' | 'input' | 'wait' | 'extract' | 'condition' | 'loop' | 'file-read' | 'file-write'
  config: Record<string, any>
  description?: string
}

export interface Workflow {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  variables?: Record<string, any>
}

export interface ExecutionContext {
  workflowId: string
  variables: Record<string, any>
  currentStep: number
  startTime: number
  logs: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  stepId?: string
}

export interface PermissionRequest {
  id: string
  workflow: Workflow
  timestamp: number
}

export interface PermissionResponse {
  granted: boolean
  scope: 'once' | 'always' | 'session'
  deniedSteps?: string[]
}

export interface Element {
  id: number
  tag: string
  text: string
  attributes: Record<string, string>
  selectors: {
    id?: string
    name?: string
    'aria-label'?: string
    class?: string
    css?: string
  }
  boundingRect: {
    x: number
    y: number
    width: number
    height: number
  }
  visible: boolean
}

export interface DOMSnapshot {
  url: string
  timestamp: number
  elements: Element[]
}

export interface LLMConfig {
  provider: 'activi-cloud' | 'openai' | 'azure' | 'anthropic' | 'local'
  endpoint?: string
  apiKey?: string
  model: string
}

export interface AppConfig {
  activiUrl: string
  llm: LLMConfig
  autoStart: boolean
  stepDelay: number
  highlightDuration: number
}
