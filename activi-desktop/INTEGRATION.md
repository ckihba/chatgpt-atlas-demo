# Activi.ai Web App Integration Guide

This guide explains how to integrate the Activi.ai web application with the Desktop Agent.

## Detection

Check if the web app is running inside the desktop agent:

```javascript
if (window.activiDesktop?.isDesktopAgent) {
  console.log('Running in Desktop Agent')
  console.log('Version:', window.activiDesktop.version)
  
  // Show desktop-specific UI
  showDesktopFeatures()
}
```

## Executing Workflows

### Basic Execution

```javascript
const workflow = {
  id: 'workflow-123',
  name: 'My Workflow',
  steps: [
    { id: '1', type: 'navigate', config: { url: 'https://example.com' } },
    { id: '2', type: 'click', config: { selector: '#button' } }
  ]
}

// Execute in autonomous mode (one-time permission)
try {
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
  console.log('Workflow completed!')
} catch (error) {
  console.error('Workflow failed:', error)
}
```

### Execution Modes

```javascript
// Manual mode - agent is passive
await window.activiDesktop.executeWorkflow(workflow, 'manual')

// Interactive mode - asks permission for each step
await window.activiDesktop.executeWorkflow(workflow, 'interactive')

// Autonomous mode - one-time permission, then runs independently
await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
```

## Monitoring Execution

### Listen to Events

```javascript
// Workflow started
window.activiDesktop.onWorkflowStarted((data) => {
  console.log('Workflow started:', data.workflow.name)
  showProgressBar()
})

// Workflow completed
window.activiDesktop.onWorkflowCompleted((data) => {
  console.log('Workflow completed!')
  console.log('Execution time:', Date.now() - data.context.startTime)
  console.log('Variables:', data.context.variables)
  hideProgressBar()
})

// Workflow failed
window.activiDesktop.onWorkflowFailed((data) => {
  console.error('Workflow failed:', data.error)
  showError(data.error.message)
})

// Step progress
window.activiDesktop.onStepStarted((data) => {
  console.log(`Step ${data.index + 1}: ${data.step.type}`)
  updateProgress(data.index + 1, workflow.steps.length)
})

window.activiDesktop.onStepCompleted((data) => {
  console.log(`Step ${data.index + 1} completed`)
})

// Execution logs
window.activiDesktop.onLog((log) => {
  console.log(`[${log.level}] ${log.message}`)
  appendToLogViewer(log)
})
```

### Control Execution

```javascript
// Pause workflow
await window.activiDesktop.pauseWorkflow()

// Resume workflow
await window.activiDesktop.resumeWorkflow()

// Stop workflow
await window.activiDesktop.stopWorkflow()

// Check status
const status = await window.activiDesktop.getAgentStatus()
// Returns: 'idle' | 'running' | 'paused' | 'error'
```

## File Operations

### Read Local Files

```javascript
// Let user select file
const filePath = await window.activiDesktop.selectFile({
  title: 'Select CSV file',
  filters: [
    { name: 'CSV Files', extensions: ['csv'] },
    { name: 'All Files', extensions: ['*'] }
  ]
})

if (filePath) {
  const content = await window.activiDesktop.readFile(filePath)
  console.log('File content:', content)
}
```

### Write Local Files

```javascript
// Let user select save location
const folderPath = await window.activiDesktop.selectFolder({
  title: 'Select output folder'
})

if (folderPath) {
  const outputPath = `${folderPath}/report.txt`
  await window.activiDesktop.writeFile(outputPath, reportData)
  console.log('Report saved to:', outputPath)
}
```

## AI Operations

### Find Elements

```javascript
// Use AI to find element by description
const element = await window.activiDesktop.findElement('submit button')

if (element) {
  console.log('Found element:', element.tag, element.selectors.css)
  // Use in workflow
  workflow.steps.push({
    type: 'click',
    config: { selector: element.selectors.css }
  })
}
```

### Extract Data

```javascript
// Capture current page
const dom = await window.activiDesktop.captureDOM()

// Extract structured data
const data = await window.activiDesktop.extractData(
  'Extract all product names and prices from this page',
  dom.elements.map(el => el.text).join('\n')
)

console.log('Extracted data:', data)
// { products: [{ name: '...', price: '...' }, ...] }
```

### Chat with AI

```javascript
const messages = [
  { role: 'user', content: 'How do I automate this form?' }
]

const response = await window.activiDesktop.queryLLM(messages)
console.log('AI response:', response)
```

## Browser Control

### Navigation

```javascript
// Navigate to URL
await window.activiDesktop.navigate('https://example.com')

// Capture DOM snapshot
const snapshot = await window.activiDesktop.captureDOM()
console.log('Page has', snapshot.elements.length, 'elements')

// Take screenshot
const screenshot = await window.activiDesktop.screenshot()
// Returns Buffer - can be displayed or saved
```

## Configuration

### Get Configuration

```javascript
const config = await window.activiDesktop.getConfig()
console.log('LLM Provider:', config.llm.provider)
console.log('Step Delay:', config.stepDelay)
```

### Update Configuration

```javascript
await window.activiDesktop.updateConfig({
  llm: {
    provider: 'azure',
    endpoint: 'https://your-azure-endpoint.openai.azure.com',
    apiKey: 'your-api-key',
    model: 'gpt-4'
  },
  stepDelay: 1000
})
```

## System Information

```javascript
const info = await window.activiDesktop.getSystemInfo()
console.log('Platform:', info.platform)
console.log('Architecture:', info.arch)
console.log('Agent Version:', info.version)
```

## UI Recommendations

### Show Desktop Badge

```javascript
if (window.activiDesktop?.isDesktopAgent) {
  // Show badge in UI
  const badge = document.createElement('div')
  badge.className = 'desktop-agent-badge'
  badge.textContent = '🖥️ Desktop Mode'
  document.body.appendChild(badge)
}
```

### Enable Desktop Features

```javascript
// Show "Run Locally" button for workflows
if (window.activiDesktop?.isDesktopAgent) {
  workflowCard.innerHTML += `
    <button onclick="runLocally('${workflow.id}')">
      🖥️ Run Locally
    </button>
  `
}

async function runLocally(workflowId) {
  const workflow = await fetchWorkflow(workflowId)
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
}
```

### Progress Indicator

```javascript
let currentStep = 0
let totalSteps = 0

window.activiDesktop.onWorkflowStarted((data) => {
  totalSteps = data.workflow.steps.length
  showProgressModal(`Executing: ${data.workflow.name}`)
})

window.activiDesktop.onStepStarted((data) => {
  currentStep = data.index + 1
  updateProgress(currentStep, totalSteps)
  updateStatusText(`Step ${currentStep}/${totalSteps}: ${data.step.type}`)
})

window.activiDesktop.onWorkflowCompleted(() => {
  hideProgressModal()
  showSuccessToast('Workflow completed successfully!')
})
```

## Error Handling

```javascript
try {
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
} catch (error) {
  if (error.message.includes('Permission denied')) {
    showMessage('User denied permission to execute workflow')
  } else if (error.message.includes('Element not found')) {
    showMessage('Could not find element on page. Page may have changed.')
  } else {
    showMessage('Workflow execution failed: ' + error.message)
  }
}
```

## TypeScript Support

```typescript
// Type definitions are included in preload.ts
// Your TypeScript code will have full autocomplete

declare global {
  interface Window {
    activiDesktop: {
      executeWorkflow: (workflow: Workflow, mode: AgentMode) => Promise<void>
      // ... all other methods with types
    }
  }
}

// Use with full type safety
const workflow: Workflow = {
  id: 'test',
  name: 'Test',
  steps: []
}

await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
```

## Best Practices

1. **Always check for desktop agent** before using API
2. **Handle permission denials** gracefully
3. **Show progress** to user during execution
4. **Log errors** for debugging
5. **Use AI element finding** for resilient workflows
6. **Test workflows** in both web and desktop modes
7. **Provide fallbacks** for desktop-only features

## Example: Complete Integration

```javascript
class ActiviDesktopIntegration {
  constructor() {
    this.isDesktop = window.activiDesktop?.isDesktopAgent || false
    if (this.isDesktop) {
      this.setupEventListeners()
    }
  }

  setupEventListeners() {
    window.activiDesktop.onWorkflowStarted(this.onStarted.bind(this))
    window.activiDesktop.onWorkflowCompleted(this.onCompleted.bind(this))
    window.activiDesktop.onWorkflowFailed(this.onFailed.bind(this))
    window.activiDesktop.onStepStarted(this.onStepStarted.bind(this))
    window.activiDesktop.onLog(this.onLog.bind(this))
  }

  async executeWorkflow(workflow, mode = 'autonomous') {
    if (!this.isDesktop) {
      throw new Error('Desktop agent not available')
    }

    try {
      await window.activiDesktop.executeWorkflow(workflow, mode)
    } catch (error) {
      console.error('Workflow execution failed:', error)
      throw error
    }
  }

  onStarted(data) {
    console.log('Workflow started:', data.workflow.name)
  }

  onCompleted(data) {
    console.log('Workflow completed in', Date.now() - data.context.startTime, 'ms')
  }

  onFailed(data) {
    console.error('Workflow failed:', data.error)
  }

  onStepStarted(data) {
    console.log(`Step ${data.index + 1}: ${data.step.type}`)
  }

  onLog(log) {
    console.log(`[${log.level}] ${log.message}`)
  }
}

// Initialize
const desktop = new ActiviDesktopIntegration()

// Use
if (desktop.isDesktop) {
  await desktop.executeWorkflow(myWorkflow)
}
```
