# ChatGPT Atlas - Usage Guide

## Quick Start

1. **Start the app:**
   ```bash
   ./start.sh
   ```

2. **The app opens with two modes:**

## Mode 1: Manual Action Selection

1. Enter a goal (e.g., "click Submit")
2. Click "Capture & Analyze"
3. Review suggested actions with confidence scores
4. Click "Select" on an action
5. Click "Execute Selected Action"

## Mode 2: Autonomous Execution 🤖

1. Enter a complex goal (e.g., "enter username and click Submit")
2. Click "Capture & Analyze"
3. Click "🤖 Auto-Run"
4. Review the execution plan in the confirmation dialog
5. Approve to run automatically

The agent will:
- Decompose your goal into steps
- Execute each step automatically
- Show progress in real-time
- Stop on errors or completion

## URL Navigation

1. Enter any URL in the URL field:
   - Local files: `../sample_page.html`
   - Remote sites: `https://example.com`
2. Click "Load URL"
3. For remote URLs, you'll get a security warning

## Example Goals

**Single actions:**
- `click Submit`
- `enter username`
- `enter email`

**Multi-step (auto-run):**
- `enter username and click Submit`
- `fill username and email and click Submit`
- `enter username john and enter email test@example.com and click Submit`

## Tips

- Higher confidence scores (0.95+) are more reliable
- ID-based selectors (#username) are best
- The agent waits 500ms between steps for page updates
- Auto-run can be cancelled if it gets stuck

## Security Notes

⚠️ **Remote URLs:** Loading external sites exposes your actions to those sites. Use with caution.

✅ **Local testing:** Use the included `sample_page.html` for safe testing.
