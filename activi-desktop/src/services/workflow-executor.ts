import { EventEmitter } from 'events'
import { BrowserController } from './browser-controller'
import { PermissionManager } from './permission-manager'
import { LLMClient } from './llm-client'
import { Workflow, WorkflowStep, ExecutionContext, ExecutionLog, AgentMode, AgentStatus } from '../types'
import { BrowserWindow } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

export class WorkflowExecutor extends EventEmitter {
  private status: AgentStatus = AgentStatus.IDLE
  private isPaused: boolean = false
  private isStopped: boolean = false
  private currentContext: ExecutionContext | null = null

  constructor(
    private browserController: BrowserController,
    private permissionManager: PermissionManager,
    private llmClient: LLMClient,
    private mainWindow: BrowserWindow,
    private config: { stepDelay: number; highlightDuration: number }
  ) {
    super()
  }

  async execute(workflow: Workflow, mode: AgentMode): Promise<void> {
    if (this.status === AgentStatus.RUNNING) {
      throw new Error('Workflow already running')
    }

    this.status = AgentStatus.RUNNING
    this.isPaused = false
    this.isStopped = false

    this.currentContext = {
      workflowId: workflow.id,
      variables: workflow.variables || {},
      currentStep: 0,
      startTime: Date.now(),
      logs: []
    }

    this.emit('started', { workflow, mode })
    this.log('info', `Starting workflow: ${workflow.name}`)

    try {
      // Request permission for autonomous mode
      if (mode === AgentMode.AUTONOMOUS) {
        const permission = await this.permissionManager.requestWorkflowPermission(
          workflow,
          this.mainWindow
        )

        if (!permission.granted) {
          throw new Error('Permission denied by user')
        }

        this.log('info', `Permission granted: ${permission.scope}`)
      }

      // Execute steps
      for (let i = 0; i < workflow.steps.length; i++) {
        if (this.isStopped) {
          this.log('warn', 'Workflow stopped by user')
          break
        }

        // Handle pause
        if (this.isPaused) {
          this.log('info', 'Workflow paused')
          await this.waitForResume()
        }

        const step = workflow.steps[i]
        this.currentContext.currentStep = i

        // Request permission for interactive mode
        if (mode === AgentMode.INTERACTIVE) {
          const allowed = await this.permissionManager.requestStepPermission(
            step,
            this.mainWindow
          )

          if (!allowed) {
            this.log('warn', `Step ${i + 1} skipped by user`)
            this.emit('step-skipped', { step, index: i })
            continue
          }
        }

        // Execute step
        this.emit('step-started', { step, index: i })
        this.log('info', `Step ${i + 1}/${workflow.steps.length}: ${step.type}`)

        try {
          await this.executeStep(step)
          this.emit('step-completed', { step, index: i })
          this.log('success', `Step ${i + 1} completed`)
        } catch (error: any) {
          this.log('error', `Step ${i + 1} failed: ${error.message}`)
          this.emit('step-failed', { step, index: i, error })
          
          // Stop on error (could add retry logic here)
          throw error
        }

        // Delay between steps
        if (i < workflow.steps.length - 1) {
          await this.sleep(this.config.stepDelay)
        }
      }

      this.status = AgentStatus.IDLE
      this.log('success', 'Workflow completed successfully')
      this.emit('completed', { context: this.currentContext })
    } catch (error: any) {
      this.status = AgentStatus.ERROR
      this.log('error', `Workflow failed: ${error.message}`)
      this.emit('failed', { error, context: this.currentContext })
      throw error
    } finally {
      this.currentContext = null
    }
  }

  private async executeStep(step: WorkflowStep): Promise<void> {
    switch (step.type) {
      case 'navigate':
        await this.executeNavigate(step)
        break
      case 'click':
        await this.executeClick(step)
        break
      case 'input':
        await this.executeInput(step)
        break
      case 'wait':
        await this.executeWait(step)
        break
      case 'extract':
        await this.executeExtract(step)
        break
      case 'condition':
        await this.executeCondition(step)
        break
      case 'file-read':
        await this.executeFileRead(step)
        break
      case 'file-write':
        await this.executeFileWrite(step)
        break
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  private async executeNavigate(step: WorkflowStep): Promise<void> {
    const url = this.resolveVariable(step.config.url)
    await this.browserController.navigate(url)
  }

  private async executeClick(step: WorkflowStep): Promise<void> {
    const selector = await this.resolveSelector(step)
    await this.browserController.highlightElement(selector, this.config.highlightDuration)
    await this.browserController.click(selector)
  }

  private async executeInput(step: WorkflowStep): Promise<void> {
    const selector = await this.resolveSelector(step)
    const value = this.resolveVariable(step.config.value)
    
    await this.browserController.highlightElement(selector, this.config.highlightDuration)
    await this.browserController.input(selector, value)
  }

  private async executeWait(step: WorkflowStep): Promise<void> {
    const duration = step.config.duration || 1000
    await this.sleep(duration)
  }

  private async executeExtract(step: WorkflowStep): Promise<void> {
    const dom = await this.browserController.captureDOM()
    const content = dom.elements
      .filter(el => el.visible && el.text)
      .map(el => el.text)
      .join('\n')

    const extracted = await this.llmClient.extractData(step.config.prompt, content)
    
    if (step.config.outputVar && this.currentContext) {
      this.currentContext.variables[step.config.outputVar] = extracted
    }
  }

  private async executeCondition(step: WorkflowStep): Promise<void> {
    // Evaluate condition (could use LLM for complex conditions)
    const condition = this.resolveVariable(step.config.condition)
    // Simple evaluation for now
    // In production, would use safe eval or LLM
    this.log('info', `Condition: ${condition}`)
  }

  private async executeFileRead(step: WorkflowStep): Promise<void> {
    const filePath = this.resolveVariable(step.config.path)
    const content = await fs.readFile(filePath, 'utf-8')
    
    if (step.config.outputVar && this.currentContext) {
      this.currentContext.variables[step.config.outputVar] = content
    }
  }

  private async executeFileWrite(step: WorkflowStep): Promise<void> {
    const filePath = this.resolveVariable(step.config.path)
    const content = this.resolveVariable(step.config.content)
    
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }

  private async resolveSelector(step: WorkflowStep): Promise<string> {
    // If selector is provided, use it
    if (step.config.selector) {
      return this.resolveVariable(step.config.selector)
    }

    // If description is provided, use LLM to find element
    if (step.config.description) {
      const dom = await this.browserController.captureDOM()
      const element = await this.llmClient.findElement(step.config.description, dom)
      
      if (!element || !element.selectors.css) {
        throw new Error(`Could not find element: ${step.config.description}`)
      }
      
      return element.selectors.css
    }

    throw new Error('Step must have either selector or description')
  }

  private resolveVariable(value: string): string {
    if (!this.currentContext) return value
    
    // Replace {{variable}} with actual value
    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return this.currentContext!.variables[varName] || match
    })
  }

  private log(level: ExecutionLog['level'], message: string) {
    const log: ExecutionLog = {
      timestamp: Date.now(),
      level,
      message,
      stepId: this.currentContext?.currentStep.toString()
    }

    this.currentContext?.logs.push(log)
    this.emit('log', log)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async waitForResume(): Promise<void> {
    return new Promise(resolve => {
      const checkResume = () => {
        if (!this.isPaused) {
          resolve()
        } else {
          setTimeout(checkResume, 100)
        }
      }
      checkResume()
    })
  }

  pause() {
    if (this.status === AgentStatus.RUNNING) {
      this.isPaused = true
      this.status = AgentStatus.PAUSED
      this.log('info', 'Workflow paused by user')
      this.emit('paused')
    }
  }

  resume() {
    if (this.status === AgentStatus.PAUSED) {
      this.isPaused = false
      this.status = AgentStatus.RUNNING
      this.log('info', 'Workflow resumed')
      this.emit('resumed')
    }
  }

  stop() {
    this.isStopped = true
    this.isPaused = false
    this.status = AgentStatus.IDLE
    this.log('warn', 'Workflow stopped by user')
    this.emit('stopped')
  }

  getStatus(): AgentStatus {
    return this.status
  }

  getCurrentContext(): ExecutionContext | null {
    return this.currentContext
  }
}
