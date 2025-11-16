# ChatGPT Atlas Autonomous Web Interaction Specification

## High-Level Understanding of ChatGPT Atlas Web Autonomy

ChatGPT Atlas is a browser-integrated version of ChatGPT that can interact with web pages. It has three key components:

1. **DOM State Access**: Atlas receives a structured snapshot of the current page's DOM, including visible and off-screen elements, input states, text content, form elements, buttons, checkboxes, links and attributes. This snapshot is read-only and updated after each agent action.

2. **Browser-Agent Tools**: Atlas can perform actions through a set of tools such as opening and closing tabs, navigating, clicking elements, filling forms, submitting forms, scrolling, and extracting structured data.

3. **User-Gated Autonomy**: The assistant only acts autonomously after the user approves via the `suggest_agent` function. The user is asked for permission with a concise prompt. Once approved, the agent can run until completion or until it needs clarification or user input (e.g., credentials).

## Functional Specification

### Inputs

- **User Intent**: Inferred from conversation. Tasks that involve booking, ordering, registering, navigating or filling out forms can trigger the agent.
- **Page Context**: The DOM snapshot of the current page provided to the agent. It contains the page URL, extracted elements, and any selected content.

### Core Tools

- **Agent Suggestion (`suggest_agent`)**: Asks the user for permission to take over the browser. Must clearly state the intent and request to continue.
- **Navigation Tools**: Functions to navigate the current tab, open new tabs, close tabs, focus tabs and reorder tabs.
- **Page Interaction Tools**: Internal tools (click, input text, select option, submit form, scroll to element, etc.) used to perform actions on DOM elements.
- **History Search**: Ability to query the user's browsing history to find previously visited pages or gather user-specific context.

### Execution Loop

1. **Interpret Goal**: Decompose the user's task, identify required pages and actions, and validate feasibility.
2. **Inspect Page**: Parse the DOM snapshot to identify actionable elements and plan the next micro-action.
3. **Perform Action**: Use the appropriate tools to navigate, click, enter text, submit forms, or manage tabs.
4. **Wait for Update**: After each action, wait for the page to update and fetch a new DOM snapshot.
5. **Recovery & Re-planning**: If the expected element is not found or an unexpected page appears, try alternative selectors or fallback strategies.
6. **User Clarifications**: Stop and ask the user if credentials, sensitive input, or ambiguous choices are needed.
7. **Completion**: Summarize results and hand control back to the user.

### Selector Strategy

The agent uses a heuristic ranking to locate elements:
1. Explicit attributes (`id`, `name`, `value`, `aria-label`).
2. Visible text content.
3. Semantic class names (e.g., `btn`, `submit`, `nav`).
4. Proximity to labels or other elements.
5. Structural indexing (e.g., nth button in a list).
6. Fuzzy matching when necessary.

### Constraints & Safety

- No arbitrary JavaScript execution.
- No access to cookies or passwords.
- Cannot bypass security or paywalls.
- Sensitive fields require explicit user approval before filling.
- DOM snapshots may be truncated; dynamic pages may require retries.
- Agent sessions are time-limited.

### User Flow

1. User asks for a task requiring web interaction.
2. Assistant recognises the need for automation and calls `suggest_agent`.
3. User approves, and the agent autonomously completes the task.
4. Agent summarises results and returns control to the user.

### Example Workflow

For a task like "Find 4-star hotels in Paris under €300":
- The assistant decomposes the task, asks for permission and then:
  1. Navigates to booking.com.
  2. Enters "Paris" in the destination field.
  3. Selects dates and applies filters.
  4. Collects and returns a list of hotels meeting the criteria.

## Summary

This specification details how ChatGPT Atlas enables autonomous web interactions via controlled browser tools. It defines the input model, key tools, execution flow, selector strategies, constraints and user experience. Implementation should adhere to these behaviours and safety guidelines to ensure reliable and secure web automation.
