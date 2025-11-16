# ChatGPT Atlas Desktop — Architecture & Setup

## Overview

ChatGPT Atlas is a desktop application (Electron) that enables autonomous web page interaction through a browser-like interface. The system captures DOM snapshots, analyzes them using heuristic selectors, and presents ranked actions to the user for approval before execution.

**Architecture:** Electron frontend (webview) + Python FastAPI backend (analysis & reasoning)

## System Components

### Frontend: Electron Desktop Shell (`electron_app/`)
- **Purpose:** Host a webview, display UI for goal input, show ranked actions, execute approved actions
- **Files:**
  - `main.js` — Electron entry point, creates BrowserWindow
  - `index.html` — Split layout: left pane (webview), right pane (control panel)
  - `renderer.js` — Captures DOM snapshot from iframe, POSTs to Python bridge, renders actions, executes selected actions
- **Flow:**
  1. User enters goal (e.g., "click Submit")
  2. Capture button → snapshot iframe DOM
  3. POST snapshot + goal to Python bridge `/analyze`
  4. Display returned actions ranked by confidence
  5. User selects action
  6. Execute button → run JS in iframe to click/input

### Backend: Python FastAPI Bridge (`agent_bridge.py`)
- **Purpose:** Analyze snapshots, apply heuristics, return ranked actions
- **Endpoints:**
  - `POST /analyze` — Body: `{snapshot, goal}` → Returns: `{actions: [{action, confidence, tag, text, css}, ...]}`
- **Logic:**
  - Reconstructs `DOMSnapshot` from posted JSON
  - Calls `SelectorEngine.find_element()` to match goal to element
  - Returns selected element with confidence score

### Core Libraries (`agent_lib/`)

#### `dom_snapshot.py`
- **Element:** Dataclass with id, tag, text, attributes, selectors, visible flag
- **DOMSnapshot:** Lightweight DOM model
  - `from_html(html, url)` — Parse HTML into Element list with indices
  - `get_elements_by_tag(tag)` — Fast lookup
  - `find_input_by_name(name)` — Helper for form inputs
  - `find_elements_by_text(text)` — Find by content

#### `selector_engine.py`
- **SelectorEngine:** Multi-strategy heuristic matcher
  - Strategies: ID, aria-label, name, text, class, structural
  - Base confidences: 0.99 (ID) → 0.60 (structural)
  - `find_element(goal, snapshot)` → `(Element, confidence)`
  - Fuzzy matching for text similarity
  - Fallback to first input/button if no match

## Development Setup

### Requirements
- Node.js (for Electron)
- Python 3.8+ with virtualenv
- Git

### Install & Run

1. **Python backend:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python agent_bridge.py
   ```
   Bridge runs on `http://127.0.0.1:8000`

2. **Electron frontend** (in separate terminal):
   ```bash
   cd electron_app
   npm install
   npm start
   ```
   App opens BrowserWindow with UI

3. **Test:** 
   - Backend must be running
   - Frontend loads `sample_page.html` in iframe
   - Enter goal → Capture & Analyze → Select action → Execute

## Key Files

```
.
├── electron_app/              # Electron desktop shell
│   ├── main.js               # Entry point
│   ├── index.html            # UI layout
│   ├── renderer.js           # Snapshot capture & action render
│   └── package.json          # Node dependencies
├── agent_lib/                # Python analysis library
│   ├── __init__.py
│   ├── dom_snapshot.py       # DOM model
│   └── selector_engine.py    # Heuristic matcher
├── agent_bridge.py           # FastAPI analysis server
├── sample_page.html          # Test fixture
├── requirements.txt          # Python dependencies
├── README.md                 # Project overview
└── docs/
    └── spec.md               # High-level product spec
```

## Next Steps (MVP → Product)

1. **Approval UI & audit log** — Add modal for action confirmation, persist log
2. **Rich action metadata** — Return multiple candidates, input value suggestions
3. **Security hardening** — Use preload.js + contextBridge, sandbox iframe, localhost-only bridge
4. **Remote page support** — Add URL input, handle CORS, restrict by default
5. **Packaging & distribution** — Electron Builder, cross-platform binaries
6. **CI/CD & testing** — Integration tests for e2e flow, GitHub Actions

## Testing

Currently using `sample_page.html` as fixture. To test:

```bash
# Start Python bridge
python agent_bridge.py

# In another terminal, start Electron
cd electron_app && npm start

# In UI: Capture & Analyze on sample_page.html
```

Expected behavior:
- Snapshot shows form inputs and buttons
- Goal "Enter username" → finds username input (high confidence)
- Goal "Click Submit" → finds submit button (high confidence)
- User selects action → can execute

---

**Last Updated:** November 2025
