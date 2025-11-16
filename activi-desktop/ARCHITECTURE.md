# Activi.ai Desktop Agent - Architecture

## Overview

The Activi.ai Desktop Agent is an Electron-based application that provides local browser automation capabilities with AI-powered element selection and workflow execution.

## Design Principles

1. **User Control** - Three modes (Manual, Interactive, Autonomous) give users full control
2. **Security First** - Permission system, sandboxing, and audit logging
3. **AI-Powered** - LLM integration for intelligent element finding and data extraction
4. **Enterprise Ready** - VPC support, offline mode, local file operations
5. **Seamless Integration** - Works with Activi.ai web platform via IPC bridge

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Activi.ai Web App                        │
│                  (loaded in BrowserView)                    │
│                                                             │
│  Uses window.activiDesktop API                              │
│  - executeWorkflow()                                        │
│  - captureDOM()                                             │
│  - readFile() / writeFile()                                 │
│  - queryLLM()                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC (contextBridge)
┌──────────────────────┴──────────────────────────────────────┐
│                    Preload Script                           │
│  Exposes safe API to web content                            │
│  - Validates requests                                       │
│  - Forwards to main process                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ IPC
┌──────────────────────┴──────────────────────────────────────┐
│                  Electron Main Process                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Browser Controller                        │   │
│  │  - Manages BrowserView                              │   │
│  │  - Captures DOM snapshots                           │   │
│  │  - Executes actions (click, input, navigate)       │   │
│  │  - Element highlighting                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Workflow Executor                           │   │
│  │  - Interprets workflow JSON                         │   │
│  │  - Executes steps sequentially                      │   │
│  │  - Manages execution state                          │   │
│  │  - Emits progress events                            │   │
│  │  - Handles pause/resume/stop                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        Permission Manager                           │   │
│  │  - Workflow-level permissions                       │   │
│  │  - Step-level permissions                           │   │
│  │  - Sensitive action detection                       │   │
│  │  - Permission dialogs                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             LLM Client                              │   │
│  │  - Multi-provider support                           │   │
│  │  - Element finding (function calling)               │   │
│  │  - Data extraction                                  │   │
│  │  - Chat interface                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Configuration Store                        │   │
│  │  - User preferences                                 │   │
│  │  - LLM settings                                     │   │
│  │  - Persistent storage                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Browser Controller

**Responsibilities:**
- Manages Chromium BrowserView instance
- Captures DOM snapshots with element metadata
- Executes browser actions (navigate, click, input)
- Highlights elements during execution
- Takes screenshots

**Key Methods:**
- `navigate(url)` - Navigate to URL
- `captureDOM()` - Capture full DOM snapshot
- `click(selector)` - Click element
- `input(selector, value)` - Enter text
- `highlightElement(selector)` - Visual feedback
- `screenshot()` - Capture page image

**Implementation:**
- Uses Electron BrowserView API
- Injects JavaScript for DOM capture
- Computes CSS selectors for elements
- Handles cross-origin restrictions

### Workflow Executor

**Responsibilities:**
- Interprets workflow JSON
- Executes steps sequentially
- Manages execution context (variables, state)
- Handles pause/resume/stop
- Emits progress events
- Error handling and recovery

**Execution Flow:**
1. Request permissions (if autonomous mode)
2. Initialize execution context
3. For each step:
   - Check if paused/stopped
   - Request permission (if interactive mode)
   - Resolve selectors (CSS or AI-powered)
   - Execute action
   - Emit progress event
   - Wait between steps
4. Complete or fail

**Step Types:**
- `navigate` - Load URL
- `click` - Click element
- `input` - Enter text
- `wait` - Delay
- `extract` - AI data extraction
- `condition` - Conditional logic
- `file-read` - Read local file
- `file-write` - Write local file

### Permission Manager

**Responsibilities:**
- Workflow-level permission requests
- Step-level permission requests
- Sensitive action detection
- Permission persistence
- User dialogs

**Permission Scopes:**
- `once` - Single execution
- `session` - Current session
- `always` - Persistent

**Sensitive Actions:**
- File operations
- Data extraction
- Credential access

### LLM Client

**Responsibilities:**
- Multi-provider LLM integration
- Element finding via function calling
- Data extraction with structured output
- Chat interface

**Supported Providers:**
- Activi.ai Cloud
- OpenAI
- Azure OpenAI
- Anthropic (planned)
- Local LLMs (LM Studio, Ollama)

**Key Features:**
- Streaming responses
- Function calling for element selection
- JSON mode for structured extraction
- Configurable endpoints

## Data Flow

### Workflow Execution

```
1. Web App → IPC → Main Process
   executeWorkflow(workflow, mode)

2. Main Process → Permission Manager
   Request user permission

3. Main Process → Workflow Executor
   Start execution

4. For each step:
   a. Workflow Executor → Browser Controller
      Capture DOM if needed
   
   b. Workflow Executor → LLM Client (if AI selector)
      Find element by description
   
   c. Workflow Executor → Browser Controller
      Execute action (click, input, etc.)
   
   d. Workflow Executor → Web App (via IPC)
      Emit progress event

5. Main Process → Web App
   Emit completion/failure event
```

### Element Finding (AI-Powered)

```
1. Workflow step has description instead of selector
   { type: 'click', config: { description: 'submit button' } }

2. Browser Controller captures DOM snapshot
   Returns array of elements with metadata

3. LLM Client receives:
   - Description: "submit button"
   - DOM snapshot: [{ id, tag, text, attributes, ... }]

4. LLM uses function calling to select element
   Returns: { element_id: 42, confidence: 0.95 }

5. Workflow Executor uses selected element
   Executes click on element #42
```

## Security Model

### Sandboxing

- BrowserView runs in sandboxed process
- No Node.js integration in web content
- Context isolation enabled
- Only preload script has IPC access

### Permission System

- Explicit user approval required
- Workflow-level permissions (autonomous mode)
- Step-level permissions (interactive mode)
- Sensitive actions always require approval

### Credential Storage

- Uses Keytar for secure storage
- OS-level keychain integration
- Encrypted at rest

### Audit Logging

- All actions logged with timestamps
- Execution context preserved
- Can be exported for compliance

## Configuration

### User Configuration

Stored in `~/.config/activi-desktop/config.json`:

```json
{
  "activiUrl": "https://activi.ai",
  "llm": {
    "provider": "activi-cloud",
    "endpoint": "https://api.activi.ai/v1",
    "apiKey": "...",
    "model": "gpt-4-turbo-preview"
  },
  "autoStart": false,
  "stepDelay": 500,
  "highlightDuration": 1000
}
```

### Enterprise Configuration

Can be pre-configured for enterprise deployment:

```json
{
  "activiUrl": "https://activi.company.com",
  "llm": {
    "provider": "azure",
    "endpoint": "https://company.openai.azure.com",
    "apiKey": "...",
    "model": "gpt-4"
  },
  "locked": true
}
```

## Extension Points

### Adding New Step Types

1. Define type in `types.ts`:
```typescript
export interface WorkflowStep {
  type: 'navigate' | 'click' | 'input' | 'custom-action'
  // ...
}
```

2. Implement handler in `workflow-executor.ts`:
```typescript
private async executeCustomAction(step: WorkflowStep) {
  // Implementation
}
```

3. Add to switch statement in `executeStep()`

### Adding New LLM Providers

1. Add provider to `LLMConfig` type
2. Implement initialization in `LLMClient.initializeClient()`
3. Test with provider's API

### Custom Browser Actions

Extend `BrowserController` with new methods:
```typescript
async customAction(params: any): Promise<void> {
  await this.browserView.webContents.executeJavaScript(`
    // Custom JavaScript
  `)
}
```

## Performance Considerations

### DOM Capture

- Captures all elements (can be 1000s)
- Text truncated to 200 chars
- Computed CSS selectors cached
- Typical capture time: 100-500ms

### LLM Calls

- Element finding: 1-3 seconds
- Data extraction: 2-5 seconds
- Can be cached for repeated queries
- Fallback to CSS selectors when possible

### Memory Usage

- Electron app: ~150MB base
- BrowserView: ~100MB per page
- Workflow context: <1MB
- Total: ~250-300MB typical

## Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Distribution

```bash
npm run package
```

Creates platform-specific installers:
- macOS: `.dmg`
- Windows: `.exe`
- Linux: `.AppImage`, `.deb`

### Enterprise Deployment

- Pre-configure settings
- Lock configuration
- Deploy via MDM (Jamf, Intune, etc.)
- Silent installation

## Future Enhancements

### Planned Features

1. **Multi-tab support** - Run workflows across multiple tabs
2. **Workflow recording** - Record user actions to create workflows
3. **Visual workflow builder** - Drag-drop editor in desktop app
4. **Batch execution** - Run multiple workflows in sequence
5. **Scheduled execution** - Cron-like scheduling
6. **Cloud sync** - Sync workflows and settings
7. **Plugin system** - Custom step types and integrations
8. **Advanced debugging** - Step-through execution, breakpoints

### Technical Improvements

1. **Playwright integration** - More reliable automation
2. **Better error recovery** - Retry logic, alternative selectors
3. **Performance optimization** - Faster DOM capture, caching
4. **Offline mode** - Full functionality without internet
5. **Multi-language support** - i18n for UI

## Testing Strategy

### Unit Tests

- Service classes (LLMClient, PermissionManager)
- Workflow step execution
- Configuration management

### Integration Tests

- End-to-end workflow execution
- IPC communication
- Browser automation

### Manual Testing

- Permission flows
- UI interactions
- Cross-platform compatibility

## Troubleshooting

### Common Issues

1. **LLM connection fails**
   - Check API key
   - Verify endpoint URL
   - Test with curl

2. **Element not found**
   - Use AI-powered finding
   - Add wait steps
   - Check if element is visible

3. **Permission denied**
   - Check permission settings
   - Clear permission cache
   - Use interactive mode

### Debug Mode

Enable debug logging:
```bash
DEBUG=activi:* npm start
```

### Logs Location

- macOS: `~/Library/Logs/activi-desktop/`
- Windows: `%APPDATA%\activi-desktop\logs\`
- Linux: `~/.config/activi-desktop/logs/`
