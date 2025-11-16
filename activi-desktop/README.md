# Activi.ai Desktop Agent

Enterprise-grade desktop automation agent for local workflow execution with AI-powered element selection.

## Features

### 🤖 Three Agent Modes

**Manual Mode**
- User browses normally
- Agent is passive, observing only
- Full manual control

**Interactive Mode**
- Agent assists with tasks
- Requests permission for each action
- User can pause/stop anytime

**Autonomous Mode** (Atlas-style)
- One-time permission request
- Agent runs workflow independently
- Shows progress, asks only when needed

### 🔐 Permission System

- Workflow-level approval (like ChatGPT Atlas)
- Step-level permissions for sensitive actions
- "Allow Once" / "Allow Always" / "Deny" options
- Sensitive action warnings (file access, data extraction)

### 🌐 Browser Automation

- Full Chromium browser embedded
- Navigate any website (local or remote)
- Element highlighting during execution
- Screenshot capture
- Persistent sessions (cookies, local storage)

### 🧠 AI-Powered

- Multi-provider LLM support (OpenAI, Azure, Anthropic, local)
- Natural language element finding
- Data extraction from pages
- Intelligent error recovery

### 💼 Enterprise Features

- Local file operations (read/write)
- VPC endpoint configuration
- Offline mode support
- Execution audit logs
- Secure credential storage

## Quick Start

### Installation

```bash
cd activi-desktop
npm install
```

### Development

```bash
npm run dev
```

This will:
1. Compile TypeScript in watch mode
2. Launch Electron app
3. Load activi.ai in the browser view

### Build

```bash
npm run build
npm start
```

### Package

```bash
npm run package
```

Creates distributable app for your platform.

## Configuration

On first launch, the app loads `https://activi.ai` by default.

### LLM Configuration

Configure LLM provider in Settings or via config file:

```typescript
{
  "llm": {
    "provider": "activi-cloud",  // or "openai", "azure", "local"
    "endpoint": "https://api.activi.ai/v1",
    "apiKey": "your-api-key",
    "model": "gpt-4-turbo-preview"
  }
}
```

**Supported Providers:**

- `activi-cloud` - Activi.ai hosted LLM
- `openai` - OpenAI API
- `azure` - Azure OpenAI Service
- `local` - Local LLM (LM Studio, Ollama, etc.)

### Local LLM Setup

For offline/VPC deployments:

```bash
# Install LM Studio or Ollama
# Start local server on http://localhost:1234

# Configure in app:
{
  "llm": {
    "provider": "local",
    "endpoint": "http://localhost:1234/v1",
    "model": "llama-2-7b"
  }
}
```

## Usage

### From Activi.ai Web App

The desktop agent exposes `window.activiDesktop` API to the web app:

```javascript
// Check if running in desktop agent
if (window.activiDesktop?.isDesktopAgent) {
  console.log('Running in Activi Desktop Agent v' + window.activiDesktop.version)
  
  // Execute workflow
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
  
  // Listen for events
  window.activiDesktop.onStepCompleted((data) => {
    console.log('Step completed:', data)
  })
  
  // File operations
  const content = await window.activiDesktop.readFile('/path/to/file.txt')
  
  // LLM operations
  const element = await window.activiDesktop.findElement('Submit button')
}
```

### Example Workflow

```typescript
const workflow = {
  id: 'form-automation-1',
  name: 'Fill Contact Form',
  steps: [
    {
      id: 'step-1',
      type: 'navigate',
      config: { url: 'https://example.com/contact' }
    },
    {
      id: 'step-2',
      type: 'input',
      config: {
        selector: '#name',
        value: '{{userName}}'
      }
    },
    {
      id: 'step-3',
      type: 'input',
      config: {
        description: 'email input field',  // AI will find it
        value: '{{userEmail}}'
      }
    },
    {
      id: 'step-4',
      type: 'click',
      config: {
        description: 'submit button'
      }
    },
    {
      id: 'step-5',
      type: 'extract',
      config: {
        prompt: 'Extract the confirmation message',
        outputVar: 'confirmationMessage'
      }
    }
  ],
  variables: {
    userName: 'John Doe',
    userEmail: 'john@example.com'
  }
}

// Execute in autonomous mode
await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Activi.ai Desktop Agent                │
├─────────────────────────────────────────┤
│  Main Process (Electron)                │
│  ├── BrowserView (Chromium)             │
│  ├── Workflow Executor                  │
│  ├── Permission Manager                 │
│  ├── LLM Client                         │
│  └── Browser Controller                 │
├─────────────────────────────────────────┤
│  IPC Bridge (preload.js)                │
│  └── Exposes activiDesktop API          │
├─────────────────────────────────────────┤
│  Web Content (activi.ai)                │
│  └── Uses activiDesktop API             │
└─────────────────────────────────────────┘
```

## Step Types

### navigate
Navigate to a URL
```typescript
{ type: 'navigate', config: { url: 'https://example.com' } }
```

### click
Click an element
```typescript
{ type: 'click', config: { selector: '#button' } }
// or with AI
{ type: 'click', config: { description: 'submit button' } }
```

### input
Enter text in an input field
```typescript
{ type: 'input', config: { selector: '#email', value: 'test@example.com' } }
```

### wait
Wait for a duration
```typescript
{ type: 'wait', config: { duration: 2000 } }
```

### extract
Extract data using AI
```typescript
{ type: 'extract', config: { prompt: 'Extract product prices', outputVar: 'prices' } }
```

### file-read
Read local file
```typescript
{ type: 'file-read', config: { path: '/path/to/file.txt', outputVar: 'fileContent' } }
```

### file-write
Write local file
```typescript
{ type: 'file-write', config: { path: '/path/to/output.txt', content: '{{data}}' } }
```

## Security

- Sandboxed browser view (no node integration)
- Context isolation enabled
- Permission system for sensitive actions
- Secure credential storage (Keytar)
- Audit logging

## Development

### Project Structure

```
activi-desktop/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── config.ts            # Configuration management
│   ├── types.ts             # TypeScript types
│   └── services/
│       ├── browser-controller.ts
│       ├── workflow-executor.ts
│       ├── permission-manager.ts
│       └── llm-client.ts
├── dist/                    # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Step Types

1. Add type to `WorkflowStep` in `types.ts`
2. Implement handler in `workflow-executor.ts`
3. Update documentation

## Troubleshooting

### LLM Connection Issues

```bash
# Test LLM endpoint
curl -X POST https://api.activi.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"test"}]}'
```

### Element Not Found

- Use AI-powered element finding with `description` instead of `selector`
- Check if element is visible and loaded
- Add `wait` step before interaction

### Permission Denied

- Check permission settings
- Sensitive actions require explicit approval
- Use "Allow Always" for trusted workflows

## License

MIT

## Support

For issues and questions:
- GitHub: https://github.com/activi-ai/desktop-agent
- Email: support@activi.ai
- Docs: https://docs.activi.ai/desktop-agent
