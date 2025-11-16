# Activi.ai Desktop Agent

Enterprise-grade desktop automation agent for local workflow execution with AI-powered element selection.

## 🚀 Quick Start

```bash
cd activi-desktop
npm install
npm run build
npm start
```

Or use the quick start script:
```bash
cd activi-desktop
./start.sh
```

## 📁 Project Structure

```
.
├── activi-desktop/          # 🎯 PRODUCTION APPLICATION
│   ├── src/                 # TypeScript source code
│   ├── examples/            # Sample workflows
│   ├── README.md            # Complete documentation
│   ├── QUICKSTART.md        # Quick reference
│   ├── INTEGRATION.md       # Web app integration guide
│   ├── ARCHITECTURE.md      # Technical architecture
│   └── VISUAL_OVERVIEW.md   # Visual diagrams
│
├── prototype-phase1/        # 📦 ARCHIVED PROTOTYPE
│   └── README.md            # Prototype documentation
│
└── PROJECT_COMPLETE.md      # 📋 Project summary
```

## 🎯 What Is This?

The **Activi.ai Desktop Agent** is an Electron-based application that enables local browser automation with AI-powered element selection. It's designed to complement the Activi.ai web platform for enterprise use cases.

### Key Features

- **🤖 Three Agent Modes** - Manual, Interactive, Autonomous (Atlas-style)
- **🔐 Permission System** - Workflow and step-level permissions
- **🧠 AI-Powered** - Natural language element finding
- **💼 Enterprise Ready** - Local files, VPC, offline mode
- **🌐 Real Browser** - Full Chromium embedded (BrowserView)

## 📚 Documentation

Start here:
1. **PROJECT_COMPLETE.md** - Overview of what was built
2. **activi-desktop/README.md** - Complete user guide
3. **activi-desktop/QUICKSTART.md** - 5-minute quick start
4. **activi-desktop/INTEGRATION.md** - Web app integration
5. **activi-desktop/ARCHITECTURE.md** - Technical details

## 🎨 Use Cases

1. **Enterprise Form Automation** - Fill internal forms with local data
2. **Data Migration** - Extract from legacy systems, upload to new
3. **Testing & QA** - Automated UI testing with screenshots
4. **Learning & Onboarding** - Agent demonstrates workflows
5. **Local Analytics** - Process sensitive data without uploading

## 🔧 Tech Stack

- **Electron 28+** - Desktop app framework
- **TypeScript** - Type-safe development
- **BrowserView** - Embedded Chromium browser
- **OpenAI SDK** - Multi-provider LLM integration
- **Electron Store** - Configuration persistence

## 📊 Project Stats

- **1,413 lines** of TypeScript code
- **2,263 lines** of documentation
- **8 core services** implemented
- **100% TypeScript** with full type safety

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd activi-desktop
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Package for Distribution

```bash
npm run package
```

## 🔌 Integration with Activi.ai Web App

The desktop agent exposes `window.activiDesktop` API:

```javascript
// Check if running in desktop agent
if (window.activiDesktop?.isDesktopAgent) {
  // Execute workflow
  await window.activiDesktop.executeWorkflow(workflow, 'autonomous')
  
  // Listen for progress
  window.activiDesktop.onStepCompleted((data) => {
    console.log('Step completed:', data)
  })
  
  // File operations
  const content = await window.activiDesktop.readFile('/path/to/file')
  
  // AI operations
  const element = await window.activiDesktop.findElement('submit button')
}
```

## 📖 Example Workflow

```json
{
  "id": "form-fill-1",
  "name": "Fill Contact Form",
  "steps": [
    {
      "type": "navigate",
      "config": { "url": "https://example.com/contact" }
    },
    {
      "type": "input",
      "config": {
        "description": "email input field",
        "value": "user@example.com"
      }
    },
    {
      "type": "click",
      "config": {
        "description": "submit button"
      }
    }
  ]
}
```

## 🏗️ Architecture

```
Activi.ai Web App (in BrowserView)
    ↓ (uses window.activiDesktop API)
Preload Script (IPC Bridge)
    ↓
Electron Main Process
    ├── Browser Controller
    ├── Workflow Executor
    ├── Permission Manager
    └── LLM Client
```

## 🔐 Security

- Sandboxed browser view
- Context isolation enabled
- Permission system for sensitive actions
- Audit logging
- Secure credential storage

## 📝 License

MIT

## 🤝 Support

- **Documentation**: See `activi-desktop/` folder
- **Examples**: See `activi-desktop/examples/`
- **Issues**: GitHub Issues
- **Email**: support@activi.ai

---

## 📦 About the Prototype

The `prototype-phase1/` folder contains the original proof-of-concept that was built to explore browser automation concepts. It has been archived for reference. See `prototype-phase1/README.md` for details.

The production application is in `activi-desktop/`.
