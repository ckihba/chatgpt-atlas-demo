# Activi.ai Desktop Agent - Quick Start

## Installation (5 minutes)

```bash
cd activi-desktop
npm install
npm run build
npm start
```

Or use the quick start script:
```bash
./start.sh
```

## First Run

1. App opens and loads `https://activi.ai`
2. Log in with your Activi.ai account
3. You'll see a "Desktop Mode" indicator
4. You're ready to run workflows locally!

## Run Your First Workflow

### From Activi.ai Web App

```javascript
// Check if running in desktop agent
if (window.activiDesktop?.isDesktopAgent) {
  // Define workflow
  const workflow = {
    id: 'test-1',
    name: 'Test Workflow',
    steps: [
      {
        id: '1',
        type: 'navigate',
        config: { url: 'https://example.com' }
      },
      {
        id: '2',
        type: 'click',
        config: { description: 'more information link' }
      }
    ]
  }
  
  // Execute
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
}
```

### Test with Example

```bash
# Load example workflow
cat examples/example-workflow.json

# In the app, execute it via web console:
const workflow = await fetch('/examples/example-workflow.json').then(r => r.json())
await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
```

## Configuration

### Set LLM Provider

```javascript
await window.activiDesktop.updateConfig({
  llm: {
    provider: 'openai',  // or 'activi-cloud', 'azure', 'local'
    apiKey: 'your-api-key',
    model: 'gpt-4-turbo-preview'
  }
})
```

### Local LLM (Offline Mode)

```bash
# Install LM Studio or Ollama
# Start local server

# Configure
await window.activiDesktop.updateConfig({
  llm: {
    provider: 'local',
    endpoint: 'http://localhost:1234/v1',
    model: 'llama-2-7b'
  }
})
```

## Common Workflows

### Fill a Form

```javascript
{
  steps: [
    { type: 'navigate', config: { url: 'https://example.com/form' } },
    { type: 'input', config: { selector: '#name', value: 'John Doe' } },
    { type: 'input', config: { selector: '#email', value: 'john@example.com' } },
    { type: 'click', config: { description: 'submit button' } }
  ]
}
```

### Extract Data

```javascript
{
  steps: [
    { type: 'navigate', config: { url: 'https://example.com/products' } },
    { 
      type: 'extract', 
      config: { 
        prompt: 'Extract all product names and prices',
        outputVar: 'products'
      } 
    }
  ]
}
```

### Read Local File

```javascript
{
  steps: [
    { 
      type: 'file-read', 
      config: { 
        path: '/Users/you/data.csv',
        outputVar: 'csvData'
      } 
    },
    { type: 'navigate', config: { url: 'https://example.com/upload' } },
    { type: 'input', config: { selector: '#data', value: '{{csvData}}' } }
  ]
}
```

## Agent Modes

### Manual Mode
```javascript
// Agent is passive, user controls everything
await window.activiDesktop.executeWorkflow(workflow, 'manual')
```

### Interactive Mode
```javascript
// Agent asks permission for each step
await window.activiDesktop.executeWorkflow(workflow, 'interactive')
```

### Autonomous Mode
```javascript
// One-time permission, then runs independently
await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
```

## Control Execution

```javascript
// Pause
await window.activiDesktop.pauseWorkflow()

// Resume
await window.activiDesktop.resumeWorkflow()

// Stop
await window.activiDesktop.stopWorkflow()

// Check status
const status = await window.activiDesktop.getAgentStatus()
// Returns: 'idle' | 'running' | 'paused' | 'error'
```

## Listen to Events

```javascript
// Workflow started
window.activiDesktop.onWorkflowStarted((data) => {
  console.log('Started:', data.workflow.name)
})

// Step progress
window.activiDesktop.onStepCompleted((data) => {
  console.log(`Step ${data.index + 1} done`)
})

// Workflow completed
window.activiDesktop.onWorkflowCompleted((data) => {
  console.log('Completed!', data.context.variables)
})

// Logs
window.activiDesktop.onLog((log) => {
  console.log(`[${log.level}] ${log.message}`)
})
```

## AI-Powered Element Finding

Instead of CSS selectors, use natural language:

```javascript
// Traditional way
{ type: 'click', config: { selector: '#submit-btn' } }

// AI-powered way
{ type: 'click', config: { description: 'submit button' } }
```

The agent will:
1. Capture DOM snapshot
2. Send to LLM with description
3. LLM finds best matching element
4. Returns element with confidence score

## File Operations

```javascript
// Let user select file
const path = await window.activiDesktop.selectFile({
  title: 'Select CSV',
  filters: [{ name: 'CSV', extensions: ['csv'] }]
})

// Read file
const content = await window.activiDesktop.readFile(path)

// Write file
await window.activiDesktop.writeFile('/path/to/output.txt', data)
```

## Troubleshooting

### App won't start
```bash
# Check Node.js version (need 18+)
node -v

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### LLM not working
```bash
# Test API key
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}]}'
```

### Element not found
- Use AI-powered finding: `{ description: 'button text' }`
- Add wait step before action
- Check if element is visible
- Try different selector

### Permission denied
- Check permission settings
- Use interactive mode to debug
- Clear permission cache

## Next Steps

1. **Read INTEGRATION.md** - Full API reference
2. **Read ARCHITECTURE.md** - Technical details
3. **Try examples/** - Sample workflows
4. **Configure LLM** - Set up your provider
5. **Build workflows** - Start automating!

## Quick Reference

### API Methods

```javascript
window.activiDesktop.executeWorkflow(workflow, mode)
window.activiDesktop.pauseWorkflow()
window.activiDesktop.resumeWorkflow()
window.activiDesktop.stopWorkflow()
window.activiDesktop.getAgentStatus()
window.activiDesktop.navigate(url)
window.activiDesktop.captureDOM()
window.activiDesktop.screenshot()
window.activiDesktop.readFile(path)
window.activiDesktop.writeFile(path, content)
window.activiDesktop.selectFile(options)
window.activiDesktop.queryLLM(messages)
window.activiDesktop.findElement(description)
window.activiDesktop.extractData(prompt, content)
window.activiDesktop.getConfig()
window.activiDesktop.updateConfig(config)
```

### Event Listeners

```javascript
window.activiDesktop.onWorkflowStarted(callback)
window.activiDesktop.onWorkflowCompleted(callback)
window.activiDesktop.onWorkflowFailed(callback)
window.activiDesktop.onWorkflowPaused(callback)
window.activiDesktop.onWorkflowResumed(callback)
window.activiDesktop.onWorkflowStopped(callback)
window.activiDesktop.onStepStarted(callback)
window.activiDesktop.onStepCompleted(callback)
window.activiDesktop.onStepFailed(callback)
window.activiDesktop.onLog(callback)
```

### Step Types

- `navigate` - Load URL
- `click` - Click element
- `input` - Enter text
- `wait` - Delay
- `extract` - AI data extraction
- `condition` - Conditional logic
- `file-read` - Read local file
- `file-write` - Write local file

## Support

- **Documentation**: README.md, INTEGRATION.md, ARCHITECTURE.md
- **Examples**: examples/example-workflow.json
- **Issues**: GitHub Issues
- **Email**: support@activi.ai
