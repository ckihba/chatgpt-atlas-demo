# Developer Specification: ChatGPT-Atlas Demo Agent

## Purpose  
Explain the goal of the project: demonstration of a ChatGPT‑Atlas‑like autonomous web interaction agent. The agent uses Playwright for dynamic pages and integrates optional text‑to‑speech for voice narration. This document guides a developer on how to understand and extend the demo.

## Overview  
- Implementation uses **Python** and **Playwright** to interact with web pages.  
- The agent parses the DOM, finds elements, inputs text, clicks buttons, and logs each action.  
- Optionally, it generates a human‑readable narration script and audio narration using the OpenAI TTS API.  
- Key files in the repo:  
  - `playwright_agent.py` – asynchronous agent using Playwright.  
  - `voice_agent.py` – earlier static agent using BeautifulSoup (retained for reference).  
  - `agent.py` – simple static agent for demonstration.  
  - `app.py` – entry point script.  
  - `sample_page.html` – simple form page for local testing.  
- Additional docs: `spec.md`, `implementation_design.md`, `implementation_plan.md` provide high‑level architecture and planning context.

## Architecture  
### Components  
- **PlaywrightAgent**: asynchronous class encapsulating browser automation. Key methods:  
  - `setup()` & `close()` – launch and close a headless browser.  
  - `load_page(url_or_path)` – navigate to a URL or local file.  
  - `click_by_text(text)` – find a clickable element by visible text and click it.  
  - `input_text(selector, value)` – fill an input field using a CSS selector.  
  - `run_demo()` – sample sequence demonstrating page interaction.  
  - `generate_narration_script()` – convert action log to a readable script.  
  - `generate_voiceover(script, output_file)` – call OpenAI TTS to produce an MP3 file (requires `OPENAI_API_KEY`).
- **VoiceAgent**: older implementation using BeautifulSoup to parse static HTML. Useful for static pages or as an example of DOM parsing without a browser.
- **App**: orchestrator. The updated `app.py` imports `PlaywrightAgent`, runs the demo asynchronously, prints logs and script, optionally generates voiceover, and closes the browser.
- **Sample HTML**: `sample_page.html` contains a simple form (username + submit) used for local tests.

### Data Flow  
1. The main script instantiates `PlaywrightAgent` and calls `setup()` to launch a Playwright browser context.  
2. The agent loads a target page (either a local file like `sample_page.html` or a remote URL) via `load_page()`.  
3. The agent performs actions defined in `run_demo()` or custom methods: clicking links or buttons by visible text, filling input fields, etc.  
4. Each action is logged as a string in `self.action_log`.  
5. After the demo, `generate_narration_script()` produces a concatenated narrative from the log (e.g., "I opened the page..., then I clicked...").  
6. `generate_voiceover()` sends the narration script to OpenAI's TTS API and writes the resulting audio to a file (e.g., `narration.mp3`).  
7. Finally, `close()` shuts down the browser to free resources.

### Dependencies  
- Python 3.8 or later.  
- [Playwright](https://playwright.dev/python/) and associated browsers (`pip install playwright` and `playwright install`).  
- `beautifulsoup4` and `requests` (for static agent).  
- `openai` Python SDK for TTS.  
- A valid OpenAI API key (stored as `OPENAI_API_KEY` in environment or repository secrets).

## Setup Instructions  
1. **Clone** the repository and open it in GitHub Codespaces or your local environment.  
2. **Install dependencies**:  
   ```bash
   pip install playwright beautifulsoup4 requests openai
   playwright install
   ```  
3. **Set the OpenAI API key**: define an environment variable `OPENAI_API_KEY` with your key. In Codespaces, add it as a repository secret.  
4. **Run the demo**:  
   ```bash
   python app.py
   ```  
   This will use `PlaywrightAgent` to open `sample_page.html`, interact with the page, print the action log and narration script, and attempt to generate a voiceover using your API key.

## Extending the Agent  
- **Real websites**: To navigate a live site (e.g. `https://activi.ai`), modify or extend `run_demo()` to call `await agent.load_page(url)` and then sequence interactions using `click_by_text()` and `input_text()`.  
- **Selectors**: For robust element selection, use Playwright's [selector engine](https://playwright.dev/python/docs/selectors). You can pass CSS selectors, text selectors, role selectors, or label selectors.  
- **Error handling**: Implement retries and error catching to handle dynamic content and network delays. This will help mimic Atlas's multi‑step reasoning and recovery.  
- **Pacing configuration**: Add optional parameters to control reading speed and pause duration in voiceover generation (e.g., words per minute, seconds between sentences).  
- **Workflow configuration**: Consider storing workflows in a YAML or JSON file so users can define sequences of actions without editing code.

## Security & Prompt Injection Considerations  
- **No arbitrary code**: The agent should never execute scripts from the page or evaluate untrusted code.  
- **User confirmation**: Always pause and ask the user before submitting forms or transferring sensitive information.  
- **Prompt injection vigilance**: If content on a website includes instructions that conflict with the user's request or instruct the agent to expose data, stop and ask the user for confirmation before proceeding.  
- **Respect terms**: When scraping or automating interactions, respect `robots.txt` and site terms of service.

## Sample Code Usage  
The snippet below demonstrates how a developer might use `PlaywrightAgent` to script a walkthrough on a real site:

```python
import asyncio
from playwright_agent import PlaywrightAgent

async def walkthrough():
    agent = PlaywrightAgent()
    await agent.setup()
    await agent.load_page("https://activi.ai")
    await agent.click_by_text("Products")
    await agent.click_by_text("Request Demo")
    # Add more interactions as needed ...
    script = agent.generate_narration_script()
    print(script)
    await agent.close()

if __name__ == "__main__":
    asyncio.run(walkthrough())
```

## Future Enhancements  
- **Voice pacing options**: Provide configuration for speech speed and pause durations, and support multiple voices.  
- **GUI wrapper**: Build an Electron or Tauri frontend that loads a web page and visualizes the agent's actions; this would more closely resemble ChatGPT Atlas in a standalone app.  
- **Automatic agent selection**: Detect whether a page is static or dynamic and choose between `voice_agent` (static) and `playwright_agent` (dynamic).  
- **Analytics and dashboards**: Store action logs and generated scripts, and create a dashboard for reviewing and editing them.  
- **User-configurable workflows**: Allow end users to define a series of tasks in a config file which the agent reads and executes.
