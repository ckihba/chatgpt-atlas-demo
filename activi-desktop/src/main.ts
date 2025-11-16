import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import { BrowserController } from './services/browser-controller'
import { WorkflowExecutor } from './services/workflow-executor'
import { PermissionManager } from './services/permission-manager'
import { LLMClient } from './services/llm-client'
import { getConfig, updateConfig as updateConfigStore } from './config'
import { AgentMode, Workflow } from './types'

let mainWindow: BrowserWindow | null = null
let browserController: BrowserController | null = null
let workflowExecutor: WorkflowExecutor | null = null
let permissionManager: PermissionManager | null = null
let llmClient: LLMClient | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'Activi.ai Desktop Agent',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true  // Enable webview tag
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 }
  })

  // Load the control UI
  mainWindow.loadFile(path.join(__dirname, 'renderer.html'))

  // Wait for window to be ready
  mainWindow.webContents.once('did-finish-load', () => {
    if (!mainWindow) return
    
    // Initialize services after UI loads
    const config = getConfig()
    
    // Note: BrowserController is no longer used with webview
    // The webview is controlled directly from renderer process
    permissionManager = new PermissionManager()
    llmClient = new LLMClient(config.llm)
    
    // We'll initialize browserController when needed for workflow execution
    // For now, the webview in renderer.html handles the browser display

    // Setup workflow executor events
    setupWorkflowEvents()
  })

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
    browserController = null
    workflowExecutor = null
    permissionManager = null
    llmClient = null
  })
}

function setupWorkflowEvents() {
  if (!workflowExecutor || !mainWindow) return

  workflowExecutor.on('started', (data) => {
    mainWindow?.webContents.send('workflow-started', data)
  })

  workflowExecutor.on('completed', (data) => {
    mainWindow?.webContents.send('workflow-completed', data)
  })

  workflowExecutor.on('failed', (data) => {
    mainWindow?.webContents.send('workflow-failed', data)
  })

  workflowExecutor.on('paused', () => {
    mainWindow?.webContents.send('workflow-paused')
  })

  workflowExecutor.on('resumed', () => {
    mainWindow?.webContents.send('workflow-resumed')
  })

  workflowExecutor.on('stopped', () => {
    mainWindow?.webContents.send('workflow-stopped')
  })

  workflowExecutor.on('step-started', (data) => {
    mainWindow?.webContents.send('step-started', data)
  })

  workflowExecutor.on('step-completed', (data) => {
    mainWindow?.webContents.send('step-completed', data)
  })

  workflowExecutor.on('step-failed', (data) => {
    mainWindow?.webContents.send('step-failed', data)
  })

  workflowExecutor.on('log', (log) => {
    mainWindow?.webContents.send('execution-log', log)
  })
}

// IPC Handlers

// Autonomous goal-seeking with LLM
ipcMain.handle('autonomous-goal-seek', async (_event, originalGoal: string, conversationHistory: any[], domSnapshot: any) => {
  if (!llmClient) throw new Error('LLM client not initialized')
  
  try {
    const config = getConfig()
    
    // Prepare interactive elements
    const interactiveElements = domSnapshot.elements
      .filter((el: any) => 
        el.visible && (
          el.tag === 'button' || 
          el.tag === 'a' || 
          el.tag === 'input' ||
          el.tag === 'textarea' ||
          el.tag === 'select' ||
          el.attributes.role === 'button' ||
          el.attributes.onclick
        )
      )
      .slice(0, 100)
      .map((el: any) => {
        const text = (el.text || '').slice(0, 100).trim()
        const href = el.attributes.href || ''
        const type = el.attributes.type || ''
        const ariaLabel = el.attributes['aria-label'] || ''
        const id = el.attributes.id || ''
        const className = el.attributes.class || ''
        const name = el.attributes.name || ''
        const placeholder = el.attributes.placeholder || ''
        
        let selector = el.tag
        if (id) selector = `#${id}`
        else if (className) selector = `${el.tag}.${className.split(' ')[0]}`
        else if (name) selector = `${el.tag}[name="${name}"]`
        
        return {
          index: el.id,
          tag: el.tag,
          selector: selector,
          text: text,
          ariaLabel: ariaLabel,
          href: href,
          type: type,
          placeholder: placeholder,
          id: id,
          name: name
        }
      })
    
    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are an autonomous web automation agent. Your job is to achieve the user's goal by continuously evaluating progress and taking actions.

AUTONOMOUS BEHAVIOR:
- You will be called repeatedly with updated page state after each action
- Evaluate if the goal is achieved, partially achieved, or requires more actions
- Plan the next action(s) to move closer to the goal
- If goal is achieved, set "goalAchieved": true
- If stuck or goal is impossible, set "needsHelp": true

RESPONSE FORMAT - Return valid JSON:
{
  "goalAchieved": false,
  "needsHelp": false,
  "progress": "brief status of progress toward goal",
  "actions": [
    {
      "type": "click|input|navigate|wait|extract|clarify",
      "selector": {
        "method": "index|css|text",
        "value": "element index OR CSS selector OR text"
      },
      "value": "for input actions",
      "waitAfter": 1000
    }
  ],
  "reasoning": "why these actions move toward the goal",
  "clarification": {
    "question": "What would you like me to do?",
    "options": [
      {"label": "Option 1", "action": "description of what this does"},
      {"label": "Option 2", "action": "description of what this does"}
    ]
  }
}

EVALUATION CRITERIA:
- Has the original goal been fully satisfied?
- Is the current page showing the expected result?
- Do I need to navigate further or interact more?
- Am I stuck or is the goal ambiguous?

RECOGNIZING INTERACTIVE DEMOS:
An "interactive demo" can be:
- Video demos (with play buttons, thumbnails, timestamps)
- Live product demos (clickable interfaces)
- Interactive tutorials or walkthroughs
- Demo pages with clickable elements
- Embedded demos or sandboxes

If you see ANY of these, the goal "Do we have interactive demos?" is ACHIEVED.
Set goalAchieved: true and explain what type of demos you found.

WHEN TO ASK FOR CLARIFICATION:
IMPORTANT: Instead of setting needsHelp: true, use type: "clarify" to present options to the user.
Use clarify when:
- Goal is ambiguous or unclear
- Multiple paths/options are available
- You need user to choose between alternatives
- Page has options but you don't know which one user wants

Example clarify action:
{
  "goalAchieved": false,
  "needsHelp": false,
  "progress": "Found multiple options, asking user to choose",
  "actions": [{
    "type": "clarify",
    "clarification": {
      "summary": "Brief summary of what you found (2-3 sentences max)",
      "question": "What would you like me to do?",
      "options": [
        {"label": "Click Startup option", "description": "For 0-50 employees"},
        {"label": "Click Enterprise option", "description": "For 500+ employees"},
        {"label": "Extract all options", "description": "Get details about all business types"}
      ]
    }
  }],
  "reasoning": "Multiple business type options found, need user to specify which one"
}

CRITICAL: Do NOT use needsHelp: true unless truly stuck. Use clarify action to present options instead!

EXAMPLES:

Goal: "Find if there's an interactive demo"
Page: Homepage with "Watch Demo" button
Response:
{
  "goalAchieved": false,
  "needsHelp": false,
  "progress": "Found 'Watch Demo' button, clicking to see demo",
  "actions": [
    { "type": "click", "selector": { "method": "index", "value": 5 }, "waitAfter": 2000 }
  ],
  "reasoning": "Clicking Watch Demo button to access the interactive demo"
}

Goal: "Find if there's an interactive demo"
Page: Demo page with video thumbnails showing "4:18" and "6:45" timestamps
Response:
{
  "goalAchieved": true,
  "needsHelp": false,
  "progress": "Found interactive video demos on the page",
  "actions": [],
  "reasoning": "Page shows multiple video demos with timestamps (4:18, 6:45), which are interactive demos. Goal achieved - yes, they have interactive demos available."
}

Goal: "Find if there's an interactive demo"
Page: Shows text 'Contact support for demo' but no actual demo
Response:
{
  "goalAchieved": false,
  "needsHelp": false,
  "progress": "No interactive demos found, only contact form",
  "actions": [{
    "type": "clarify",
    "clarification": {
      "summary": "I found a contact form to request a demo, but no self-service interactive demos.",
      "question": "Would you like me to:",
      "options": [
        {"label": "Fill contact form", "description": "Request a personalized demo"},
        {"label": "Keep searching", "description": "Look for self-service demos"}
      ]
    }
  }],
  "reasoning": "Only found contact-based demos, not self-service interactive ones"
}

Return ONLY the JSON object.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: `ORIGINAL GOAL: "${originalGoal}"

CURRENT PAGE: ${domSnapshot.url}
PAGE TITLE: ${domSnapshot.title || 'Unknown'}

PAGE CONTENT SUMMARY:
Headings: ${domSnapshot.content?.headings?.join(' | ') || 'None'}

Key Paragraphs:
${domSnapshot.content?.paragraphs?.slice(0, 5).join('\n') || 'None'}

Visible Text Preview:
${domSnapshot.content?.visibleText?.slice(0, 500) || 'None'}

CONTEXT: You are working toward the goal "${originalGoal}". 
${conversationHistory.length > 0 ? `You have taken ${Math.floor(conversationHistory.length / 2)} actions so far.` : 'This is your first action.'}

Use the PAGE CONTENT to understand what's on the page and evaluate if it satisfies the goal.

AVAILABLE INTERACTIVE ELEMENTS:
${JSON.stringify(interactiveElements.slice(0, 20), null, 2)}

INSTRUCTIONS:
1. Remember the ORIGINAL GOAL: "${originalGoal}"
2. Evaluate if this page helps achieve that goal
3. If you see content related to "${originalGoal}", analyze it
4. Determine if goal is achieved or if more actions needed
5. Return your decision as JSON`
      }
    ]
    
    const response = await llmClient.chat(messages)
    
    return { success: true, response }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Chat with LLM
ipcMain.handle('chat-with-llm', async (_event, userMessage: string, domSnapshot: any) => {
  if (!llmClient) throw new Error('LLM client not initialized')
  
  try {
    // Get current config to use appropriate model
    const config = getConfig()
    const thinkingModel = config.llm.model || 'gpt-4o-mini' // Use cost-effective model
    
    // Prepare interactive elements with precise selectors
    const interactiveElements = domSnapshot.elements
      .filter((el: any) => 
        el.visible && (
          el.tag === 'button' || 
          el.tag === 'a' || 
          el.tag === 'input' ||
          el.tag === 'textarea' ||
          el.tag === 'select' ||
          el.attributes.role === 'button' ||
          el.attributes.onclick
        )
      )
      .slice(0, 100)
      .map((el: any) => {
        const text = (el.text || '').slice(0, 100).trim()
        const href = el.attributes.href || ''
        const type = el.attributes.type || ''
        const ariaLabel = el.attributes['aria-label'] || ''
        const id = el.attributes.id || ''
        const className = el.attributes.class || ''
        const name = el.attributes.name || ''
        const placeholder = el.attributes.placeholder || ''
        
        // Build CSS selector
        let selector = el.tag
        if (id) selector = `#${id}`
        else if (className) selector = `${el.tag}.${className.split(' ')[0]}`
        else if (name) selector = `${el.tag}[name="${name}"]`
        
        return {
          index: el.id,
          tag: el.tag,
          selector: selector,
          text: text,
          ariaLabel: ariaLabel,
          href: href,
          type: type,
          placeholder: placeholder,
          id: id,
          name: name
        }
      })
    
    // Use LLM with structured output (JSON mode)
    const messages = [
      {
        role: 'system',
        content: `You are an intelligent web automation assistant. Analyze user intent and return precise, executable actions.

RESPONSE FORMAT - You MUST return a valid JSON object with this structure:
{
  "actions": [
    {
      "type": "click|input|navigate|wait|extract|scroll",
      "selector": {
        "method": "index|globalIndex|css|text",
        "value": "element index from list OR CSS selector OR text to match"
      },
      "value": "for input actions, the text to enter",
      "waitAfter": 1000
    }
  ],
  "reasoning": "brief explanation of the plan"
}

ACTION TYPES:
- click: Click an element (button, link, etc)
- input: Type text into a field
- navigate: Go to a URL directly
- wait: Pause for specified ms
- extract: Extract data from page
- scroll: Scroll to an element or position

SELECTOR METHODS (in order of preference):
- index: Interactive element index from the list (MOST RELIABLE)
- globalIndex: Global DOM element index (for any element)
- css: CSS selector like "#id", ".class", "button[type='submit']"
- xpath: XPath expression
- id: Element ID (just the ID value, not "#id")
- class: Class name (just the class, not ".class")
- name: Name attribute value
- text: Visible text content matching
- ariaLabel: ARIA label attribute value
- dataAttribute: Data attribute (e.g., data-testid)

RULES:
1. For clicking/typing: Use "index" method with interactive element index
2. For scrolling/extracting: Use "globalIndex" method with global DOM index
3. You can chain multiple actions (e.g., scroll then click, fill form then submit)
4. Add waitAfter (in ms) if page needs time to respond
5. For navigation, look for links/buttons that lead to the goal
6. Be precise - use exact element indices when possible
7. Look at the element's text, ariaLabel, and href to identify the right one

EXAMPLE RESPONSES:

User: "Click the Watch Demo button"
Available elements show index 8 has text "Watch Demo"
{
  "actions": [
    {
      "type": "click",
      "selector": { "method": "index", "value": 8 },
      "waitAfter": 500
    }
  ],
  "reasoning": "Element at index 8 is the 'Watch Demo' button"
}

User: "Fill email with test@example.com and submit"
{
  "actions": [
    {
      "type": "input",
      "selector": { "method": "index", "value": 12 },
      "value": "test@example.com"
    },
    {
      "type": "click",
      "selector": { "method": "index", "value": 15 },
      "waitAfter": 1000
    }
  ],
  "reasoning": "Fill email field (index 12) then click submit button (index 15)"
}

CRITICAL: Return ONLY the JSON object, no other text before or after.`
      },
      {
        role: 'user',
        content: `User request: "${userMessage}"

Current page: ${domSnapshot.url}

INTERACTIVE ELEMENTS (use method: "index" for clicking/typing):
${JSON.stringify(interactiveElements.slice(0, 30), null, 2)}

ALL ELEMENTS (use method: "globalIndex" for scrolling/extracting):
First 50 elements with their globalIndex:
${domSnapshot.elements.slice(0, 50).map((el: any) => 
  `[${el.id}] ${el.tag}: "${(el.text || '').slice(0, 60)}"`
).join('\n')}

Analyze the request and return the action plan as JSON.
- For buttons/links/inputs: Use "index" from INTERACTIVE ELEMENTS
- For headings/sections/any element: Use "globalIndex" from ALL ELEMENTS`
      }
    ]
    
    // Call LLM with JSON mode if supported
    let response: string
    try {
      // Try with response_format for JSON mode (GPT-4 and newer models)
      response = await llmClient.chatWithJsonMode(messages)
    } catch (error) {
      // Fallback to regular chat
      response = await llmClient.chat(messages)
    }
    
    return { success: true, response }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Find element with LLM
ipcMain.handle('find-element-llm', async (_event, description: string, domSnapshot: any) => {
  if (!llmClient) throw new Error('LLM client not initialized')
  
  try {
    const element = await llmClient.findElement(description, domSnapshot)
    return { success: true, element }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Workflow execution
ipcMain.handle('execute-workflow', async (_event, workflow: Workflow, mode: AgentMode) => {
  if (!workflowExecutor) throw new Error('Workflow executor not initialized')
  await workflowExecutor.execute(workflow, mode)
})

ipcMain.handle('pause-workflow', async () => {
  workflowExecutor?.pause()
})

ipcMain.handle('resume-workflow', async () => {
  workflowExecutor?.resume()
})

ipcMain.handle('stop-workflow', async () => {
  workflowExecutor?.stop()
})

ipcMain.handle('get-agent-status', async () => {
  return workflowExecutor?.getStatus() || 'idle'
})

// Browser control
ipcMain.handle('navigate', async (_event, url: string) => {
  if (!browserController) throw new Error('Browser controller not initialized')
  await browserController.navigate(url)
})

ipcMain.handle('capture-dom', async () => {
  if (!browserController) throw new Error('Browser controller not initialized')
  return await browserController.captureDOM()
})

ipcMain.handle('screenshot', async () => {
  if (!browserController) throw new Error('Browser controller not initialized')
  return await browserController.screenshot()
})

// File operations
ipcMain.handle('read-file', async (_event, filePath: string) => {
  return await fs.readFile(filePath, 'utf-8')
})

ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
  await fs.writeFile(filePath, content, 'utf-8')
})

ipcMain.handle('select-file', async (_event, options: any) => {
  if (!mainWindow) return null
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    ...options
  })
  
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('select-folder', async (_event, options: any) => {
  if (!mainWindow) return null
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    ...options
  })
  
  return result.canceled ? null : result.filePaths[0]
})

// LLM operations
ipcMain.handle('query-llm', async (_event, messages: any[]) => {
  if (!llmClient) throw new Error('LLM client not initialized')
  return await llmClient.chat(messages)
})

ipcMain.handle('find-element', async (_event, description: string) => {
  if (!llmClient || !browserController) throw new Error('Services not initialized')
  
  const dom = await browserController.captureDOM()
  return await llmClient.findElement(description, dom)
})

ipcMain.handle('extract-data', async (_event, prompt: string, content: string) => {
  if (!llmClient) throw new Error('LLM client not initialized')
  return await llmClient.extractData(prompt, content)
})

// System info
ipcMain.handle('get-system-info', async () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node
  }
})

ipcMain.handle('get-config', async () => {
  return getConfig()
})

ipcMain.handle('update-config', async (_event, config: any) => {
  updateConfigStore(config)
  
  // Reinitialize LLM client if config changed
  if (config.llm && llmClient) {
    const fullConfig = getConfig()
    llmClient = new LLMClient(fullConfig.llm)
  }
})

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
