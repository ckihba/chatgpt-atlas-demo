# Action Execution Architecture

## Overview

The system now uses a **structured action chain** approach where the LLM returns precise, executable instructions rather than vague descriptions.

## How It Works

### 1. DOM Snapshot with Indices

When the user sends a message, we capture a DOM snapshot with:
- Element index (reliable reference)
- Tag name, text content, attributes
- CSS selectors (id, class, name)
- Visibility status

### 2. LLM Returns Structured Actions

The LLM analyzes the request and returns a JSON action plan:

```json
{
  "actions": [
    {
      "type": "click",
      "selector": {
        "method": "index",
        "value": 5
      },
      "waitAfter": 500
    }
  ],
  "reasoning": "Element at index 5 is the 'Watch Demo' button"
}
```

### 3. Action Types

- **click**: Click an element
- **input**: Type text into a field
- **navigate**: Go to a URL
- **wait**: Pause execution
- **extract**: Extract data from page

### 4. Selector Methods

- **index** (preferred): Use element index from snapshot - most reliable
- **css**: Use CSS selector like `#id`, `.class`, `button[type='submit']`
- **text**: Match by visible text content (fallback)

### 5. Action Chains

Multiple actions can be chained together:

```json
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
  "reasoning": "Fill email field then submit form"
}
```

## Benefits

1. **Precision**: No fuzzy text matching - exact element references
2. **Reliability**: Index-based selection is deterministic
3. **Composability**: Chain multiple actions together
4. **Debuggability**: Clear action plan with reasoning
5. **Flexibility**: Fallback selector methods if needed

## Example Flow

**User**: "Click the Watch Demo button"

1. **Capture DOM**: Get all interactive elements with indices
2. **LLM Analysis**: Identifies element at index 5 is "Watch Demo"
3. **Return Plan**: `{ actions: [{ type: "click", selector: { method: "index", value: 5 }}]}`
4. **Execute**: Find element by index, build CSS selector, click it
5. **Feedback**: "✅ Clicked: Watch Demo"

## Fallback Strategy

If index-based selection fails:
1. Try CSS selector (id, name, class)
2. Try text content matching
3. Report error with details

This ensures maximum reliability while maintaining flexibility.
