# Phase 1 Prototype - Archived

This is the original proof-of-concept prototype that was built to explore browser automation concepts.

## What This Was

A simple Electron + Python FastAPI prototype that demonstrated:
- DOM snapshot capture
- Multi-strategy element selection
- Basic click/input actions
- Manual action execution

## Architecture

- **Frontend**: Electron with iframe/webview
- **Backend**: Python FastAPI
- **Selector Engine**: Heuristic-based (ID, aria-label, text matching)
- **Execution**: Single-shot actions only

## Why It Was Replaced

This prototype had several limitations:
- ❌ iframe CORS issues with external sites
- ❌ No autonomous execution
- ❌ No permission system
- ❌ Manual action selection only
- ❌ Limited enterprise features

## What We Learned

✅ DOM snapshot approach works well
✅ Multi-strategy selectors are effective
✅ Confidence scoring is useful
✅ Need for autonomous execution
✅ Permission system is critical

## Evolution

This prototype evolved into the **Activi.ai Desktop Agent** (in `../activi-desktop/`), which is a production-ready application with:
- Real browser (BrowserView)
- Autonomous workflow execution
- AI-powered element finding
- Permission system (Atlas-style)
- Enterprise features

## Running the Prototype

If you want to run this for reference:

```bash
# Python backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python agent_bridge.py

# Electron app (in another terminal)
cd electron_app
npm install
npm start
```

## Files

- `electron_app/` - Electron UI
- `agent_lib/` - Python DOM & selector libraries
- `agent_bridge.py` - FastAPI server
- `agent.py` - Demo agent
- `sample_page.html` - Test fixture
- `docs/` - Original documentation

---

**Note**: This is archived for reference. For the production application, see `../activi-desktop/`
