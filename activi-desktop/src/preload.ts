import { contextBridge, ipcRenderer } from 'electron'

// Expose desktop capabilities to activi.ai web app
contextBridge.exposeInMainWorld('activiDesktop', {
  // Agent control
  executeWorkflow: (workflow: any, mode: string) => 
    ipcRenderer.invoke('execute-workflow', workflow, mode),
  
  pauseWorkflow: () => 
    ipcRenderer.invoke('pause-workflow'),
  
  resumeWorkflow: () => 
    ipcRenderer.invoke('resume-workflow'),
  
  stopWorkflow: () => 
    ipcRenderer.invoke('stop-workflow'),
  
  getAgentStatus: () => 
    ipcRenderer.invoke('get-agent-status'),

  // Browser control
  navigate: (url: string) => 
    ipcRenderer.invoke('navigate', url),
  
  captureDOM: () => 
    ipcRenderer.invoke('capture-dom'),
  
  screenshot: () => 
    ipcRenderer.invoke('screenshot'),

  // File operations
  readFile: (path: string) => 
    ipcRenderer.invoke('read-file', path),
  
  writeFile: (path: string, content: string) => 
    ipcRenderer.invoke('write-file', path, content),
  
  selectFile: (options?: any) => 
    ipcRenderer.invoke('select-file', options),
  
  selectFolder: (options?: any) => 
    ipcRenderer.invoke('select-folder', options),

  // LLM operations
  queryLLM: (messages: any[]) => 
    ipcRenderer.invoke('query-llm', messages),
  
  findElement: (description: string) => 
    ipcRenderer.invoke('find-element', description),
  
  extractData: (prompt: string, content: string) => 
    ipcRenderer.invoke('extract-data', prompt, content),

  // Chat with LLM
  chatWithLLM: (userMessage: string, domSnapshot: any) =>
    ipcRenderer.invoke('chat-with-llm', userMessage, domSnapshot),
  
  findElementLLM: (description: string, domSnapshot: any) =>
    ipcRenderer.invoke('find-element-llm', description, domSnapshot),
  
  // Autonomous goal seeking
  autonomousGoalSeek: (originalGoal: string, conversationHistory: any[], domSnapshot: any) =>
    ipcRenderer.invoke('autonomous-goal-seek', originalGoal, conversationHistory, domSnapshot),

  // System info
  getSystemInfo: () => 
    ipcRenderer.invoke('get-system-info'),
  
  getConfig: () => 
    ipcRenderer.invoke('get-config'),
  
  updateConfig: (config: any) => 
    ipcRenderer.invoke('update-config', config),

  // Events
  onWorkflowStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('workflow-started', (_event, data) => callback(data))
  },
  
  onWorkflowCompleted: (callback: (data: any) => void) => {
    ipcRenderer.on('workflow-completed', (_event, data) => callback(data))
  },
  
  onWorkflowFailed: (callback: (data: any) => void) => {
    ipcRenderer.on('workflow-failed', (_event, data) => callback(data))
  },
  
  onWorkflowPaused: (callback: () => void) => {
    ipcRenderer.on('workflow-paused', () => callback())
  },
  
  onWorkflowResumed: (callback: () => void) => {
    ipcRenderer.on('workflow-resumed', () => callback())
  },
  
  onWorkflowStopped: (callback: () => void) => {
    ipcRenderer.on('workflow-stopped', () => callback())
  },
  
  onStepStarted: (callback: (data: any) => void) => {
    ipcRenderer.on('step-started', (_event, data) => callback(data))
  },
  
  onStepCompleted: (callback: (data: any) => void) => {
    ipcRenderer.on('step-completed', (_event, data) => callback(data))
  },
  
  onStepFailed: (callback: (data: any) => void) => {
    ipcRenderer.on('step-failed', (_event, data) => callback(data))
  },
  
  onLog: (callback: (log: any) => void) => {
    ipcRenderer.on('execution-log', (_event, log) => callback(log))
  },

  // Utility
  isDesktopAgent: true,
  version: '0.1.0'
})

// Type definitions for TypeScript users
declare global {
  interface Window {
    activiDesktop: {
      executeWorkflow: (workflow: any, mode: string) => Promise<void>
      pauseWorkflow: () => Promise<void>
      resumeWorkflow: () => Promise<void>
      stopWorkflow: () => Promise<void>
      getAgentStatus: () => Promise<string>
      navigate: (url: string) => Promise<void>
      captureDOM: () => Promise<any>
      screenshot: () => Promise<Buffer>
      readFile: (path: string) => Promise<string>
      writeFile: (path: string, content: string) => Promise<void>
      selectFile: (options?: any) => Promise<string | null>
      selectFolder: (options?: any) => Promise<string | null>
      queryLLM: (messages: any[]) => Promise<string>
      findElement: (description: string) => Promise<any>
      extractData: (prompt: string, content: string) => Promise<any>
      getSystemInfo: () => Promise<any>
      getConfig: () => Promise<any>
      updateConfig: (config: any) => Promise<void>
      onWorkflowStarted: (callback: (data: any) => void) => void
      onWorkflowCompleted: (callback: (data: any) => void) => void
      onWorkflowFailed: (callback: (data: any) => void) => void
      onWorkflowPaused: (callback: () => void) => void
      onWorkflowResumed: (callback: () => void) => void
      onWorkflowStopped: (callback: () => void) => void
      onStepStarted: (callback: (data: any) => void) => void
      onStepCompleted: (callback: (data: any) => void) => void
      onStepFailed: (callback: (data: any) => void) => void
      onLog: (callback: (log: any) => void) => void
      isDesktopAgent: boolean
      version: string
    }
  }
}
