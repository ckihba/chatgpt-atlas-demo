# Implementation Design for ChatGPT Atlas Demo App

## Objectives
The goal of the demo app is to provide a simple, functional demonstration of the ChatGPT Atlas autonomous web interaction concept. The app will not replicate the full capabilities of Atlas but will illustrate how an automation agent can parse a page and perform actions based on structured instructions.

## Architecture
- **Language**: Python
- **Dependencies**: `requests` and `BeautifulSoup` for fetching and parsing HTML. These are standard libraries that support static page interaction.
- **Agent Class**: An `Agent` class that accepts tasks, parses DOM snapshots, identifies elements using simple selector heuristics, and prints actions it would perform. This keeps the implementation modular and clear.
- **Sample Page**: A simple HTML page stored locally (e.g., `sample_page.html`) that contains a few elements like buttons and input fields for the agent to interact with.

## Modules
- **`app.py`** – Entry point that runs the demo agent. It loads the sample HTML page and invokes the agent with a predefined goal.
- **`agent.py`** – Contains the `Agent` class responsible for parsing the DOM and performing actions. It encapsulates the selector strategy and action logic.
- **`sample_page.html`** – A minimal HTML page for testing. This file will include buttons and input fields to demonstrate clicking and typing.

## Flow
1. **Load the sample HTML**: `app.py` reads `sample_page.html` into a string.
2. **Initialize Agent**: Create an instance of `Agent` with the HTML content and a goal (e.g., click a button or enter text into a field).
3. **Parse DOM**: The agent uses `BeautifulSoup` to parse the HTML and create a DOM-like structure.
4. **Select Element**: The agent identifies the target element using a basic selector heuristic (e.g., matching element tag and text content).
5. **Perform Action**: Instead of interacting with a live browser, the agent prints a statement describing the action it would take (e.g., "Click button with id='submit'").
6. **Report**: The agent returns or prints a summary of the actions performed.

## Limitations
- The demo operates only on static HTML and does not execute JavaScript or handle dynamic content.
- It provides an illustrative example rather than a full reproduction of ChatGPT Atlas functionality.
- Security considerations (e.g., handling sensitive data) are not relevant for this simple static demo but would need to be addressed in a real implementation.
