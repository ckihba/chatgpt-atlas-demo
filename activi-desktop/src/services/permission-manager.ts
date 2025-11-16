import { dialog, BrowserWindow } from 'electron'
import { Workflow, WorkflowStep, PermissionRequest, PermissionResponse } from '../types'

export class PermissionManager {
  private grantedPermissions: Map<string, Set<string>> = new Map()
  private sessionPermissions: Set<string> = new Set()

  async requestWorkflowPermission(
    workflow: Workflow,
    parentWindow: BrowserWindow
  ): Promise<PermissionResponse> {
    const summary = this.summarizeWorkflow(workflow)
    
    const result = await dialog.showMessageBox(parentWindow, {
      type: 'question',
      title: 'Agent Permission Request',
      message: `Allow agent to execute workflow: "${workflow.name}"?`,
      detail: summary,
      buttons: ['Allow Once', 'Allow Always', 'Review Steps', 'Deny'],
      defaultId: 0,
      cancelId: 3
    })

    switch (result.response) {
      case 0: // Allow Once
        return { granted: true, scope: 'once' }
      case 1: // Allow Always
        this.grantAlwaysPermission(workflow.id)
        return { granted: true, scope: 'always' }
      case 2: // Review Steps
        return await this.reviewSteps(workflow, parentWindow)
      case 3: // Deny
      default:
        return { granted: false, scope: 'once' }
    }
  }

  async requestStepPermission(
    step: WorkflowStep,
    parentWindow: BrowserWindow
  ): Promise<boolean> {
    // Check if already granted
    if (this.hasStepPermission(step)) {
      return true
    }

    // Sensitive actions always require explicit permission
    if (this.isSensitiveAction(step)) {
      const result = await dialog.showMessageBox(parentWindow, {
        type: 'warning',
        title: 'Sensitive Action',
        message: `Agent wants to ${step.type}`,
        detail: this.describeStep(step),
        buttons: ['Allow', 'Deny'],
        defaultId: 1,
        cancelId: 1
      })

      return result.response === 0
    }

    return true
  }

  private async reviewSteps(
    workflow: Workflow,
    parentWindow: BrowserWindow
  ): Promise<PermissionResponse> {
    const stepsList = workflow.steps
      .map((s, i) => `${i + 1}. ${this.describeStep(s)}`)
      .join('\n')

    const result = await dialog.showMessageBox(parentWindow, {
      type: 'info',
      title: 'Workflow Steps',
      message: `Workflow: ${workflow.name}`,
      detail: `Steps:\n${stepsList}\n\nAllow execution?`,
      buttons: ['Allow', 'Deny'],
      defaultId: 0,
      cancelId: 1
    })

    return {
      granted: result.response === 0,
      scope: 'once'
    }
  }

  private summarizeWorkflow(workflow: Workflow): string {
    const steps = workflow.steps.length
    const actions = workflow.steps.map(s => s.type)
    const uniqueActions = [...new Set(actions)]
    
    let summary = `This workflow has ${steps} step${steps > 1 ? 's' : ''}:\n\n`
    
    // Group by action type
    const grouped = uniqueActions.map(type => {
      const count = actions.filter(a => a === type).length
      return `• ${count} ${type} action${count > 1 ? 's' : ''}`
    })
    
    summary += grouped.join('\n')
    
    // Highlight sensitive actions
    const sensitive = workflow.steps.filter(s => this.isSensitiveAction(s))
    if (sensitive.length > 0) {
      summary += `\n\n⚠️ Includes ${sensitive.length} sensitive action(s):\n`
      summary += sensitive.map(s => `• ${this.describeStep(s)}`).join('\n')
    }
    
    return summary
  }

  private describeStep(step: WorkflowStep): string {
    switch (step.type) {
      case 'navigate':
        return `Navigate to ${step.config.url}`
      case 'click':
        return `Click element: ${step.config.selector || step.config.description}`
      case 'input':
        return `Enter text in: ${step.config.selector || step.config.description}`
      case 'wait':
        return `Wait ${step.config.duration || step.config.condition}`
      case 'extract':
        return `Extract data: ${step.config.description}`
      case 'file-read':
        return `Read file: ${step.config.path}`
      case 'file-write':
        return `Write file: ${step.config.path}`
      default:
        return `${step.type}: ${step.description || 'unknown'}`
    }
  }

  private isSensitiveAction(step: WorkflowStep): boolean {
    const sensitiveTypes = ['file-read', 'file-write', 'extract']
    return sensitiveTypes.includes(step.type)
  }

  private grantAlwaysPermission(workflowId: string) {
    if (!this.grantedPermissions.has('workflows')) {
      this.grantedPermissions.set('workflows', new Set())
    }
    this.grantedPermissions.get('workflows')!.add(workflowId)
  }

  private hasStepPermission(step: WorkflowStep): boolean {
    return this.sessionPermissions.has(step.id)
  }

  hasWorkflowPermission(workflowId: string): boolean {
    return this.grantedPermissions.get('workflows')?.has(workflowId) || false
  }

  clearSessionPermissions() {
    this.sessionPermissions.clear()
  }

  clearAllPermissions() {
    this.grantedPermissions.clear()
    this.sessionPermissions.clear()
  }
}
