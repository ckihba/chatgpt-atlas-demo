# ChatGPT Atlas Desktop Prototype

A desktop application that enables autonomous web page interaction through natural-language goals. Built with **Electron** (frontend) + **Python FastAPI** (analysis backend).

## Quick Start

### Prerequisites
- Node.js 14+
- Python 3.8+

### Run Locally

1. **Start Python analysis server:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python agent_bridge.py
   ```

2. **Start Electron app** (new terminal):
   ```bash
   cd electron_app
   npm install
   npm start
   ```

3. **Try it:**
   - UI loads `sample_page.html` by default
   - Enter goal: `"click Submit"` or `"enter username"`
   - Press "Capture & Analyze"
   - Select action → "Execute Selected Action"

## Architecture

- **Frontend:** Electron + iframe webview; captures DOM snapshots, renders action UI
- **Backend:** FastAPI bridge; accepts snapshots, applies heuristic selectors, returns ranked actions
- **Core:** DOM snapshot model + multi-strategy selector engine with confidence scoring

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full technical details.

## Project Status

**Phase 1 (Complete):**
- ✅ DOM snapshot model with element indexing
- ✅ Multi-strategy selector engine (ID, accessibility, semantic, text, class, structural)
- ✅ FastAPI bridge for snapshot analysis
- ✅ Electron prototype UI with snapshot capture and action display

**Phase 2 (In Progress):**
- [ ] Approval UI with action confirmation modal
- [ ] Audit log persistence
- [ ] Rich action metadata (multiple candidates, input suggestions)

**Phase 3 (Future):**
- [ ] Remote page support with security controls
- [ ] Packaging & distribution (Electron Builder)
- [ ] CI/CD & automated testing
- [ ] Tauri port for smaller binaries

## Files

```
electron_app/          # Electron desktop shell
agent_lib/             # Python DOM & selector libraries
agent_bridge.py        # FastAPI analysis server
sample_page.html       # Test fixture
requirements.txt       # Python dependencies
docs/ARCHITECTURE.md   # Technical overview
```
