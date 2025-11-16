# Chat LLM Integration - Implementation Plan

## Current State
- Simple pattern matching (if message includes "click"...)
- Direct DOM manipulation
- No context understanding

## Proposed Architecture

### Flow:
```
1. User sends message: "Go to the pricing page"
   ↓
2. Capture DOM snapshot from webview
   ↓
3. Send to LLM with:
   - User message
   - Current page URL
   - List of interactive elements
   - Available actions
   ↓
4. LLM returns structured action via function calling:
   {
     action_type: "click",
     target_description: "pricing link in navigation",
     reasoning: "User wants to navigate to pricing page"
   }
   ↓
5. Use LLM again to find exact element:
   - Send target_description + DOM snapshot
   - LLM returns element ID with confidence
   ↓
6. Execute action on webview
   ↓
7. Show result to user
```

## Implementation Steps

### 1. Capture DOM from Webview
```javascript
const snapshot = await webview.executeJavaScript(`
  (function() {
    const elements = Array.from(document.querySelectorAll('*'));
    return {
      url: window.location.href,
      elements: elements.map((el, idx) => ({
        id: idx,
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 100),
        attributes: Object.fromEntries(
          Array.from(el.attributes).map(a => [a.name, a.value])
        ),
        visible: el.offsetParent !== null
      }))
    };
  })()
`);
```

### 2. Send to LLM with Function Calling
```typescript
const response = await llmClient.chat([
  {
    role: 'system',
    content: 'You are a web automation assistant...'
  },
  {
    role: 'user',
    content: `User: "${userMessage}"\n\nPage: ${snapshot.url}\n\nElements: ...`
  }
], [
  {
    type: 'function',
    function: {
      name: 'execute_action',
      parameters: {
        action_type: { enum: ['click', 'input', 'navigate', 'extract'] },
        target_description: { type: 'string' },
        value: { type: 'string' },
        reasoning: { type: 'string' }
      }
    }
  }
]);
```

### 3. Find Element with LLM
```typescript
const element = await llmClient.findElement(
  action.target_description,
  snapshot
);
```

### 4. Execute Action
```javascript
await webview.executeJavaScript(`
  document.querySelector('${element.selector}').click();
`);
```

## Benefits

1. **Natural Language Understanding**
   - "Go to pricing" → Understands intent
   - "Fill in my email" → Knows to find email field
   - "What are the features?" → Knows to extract text

2. **Context Awareness**
   - Understands page structure
   - Considers element visibility
   - Handles ambiguity

3. **Robust Element Finding**
   - Not dependent on exact text match
   - Handles dynamic content
   - Fuzzy matching

4. **Explainable**
   - LLM provides reasoning
   - User sees why action was chosen
   - Can ask for clarification

## Example Conversations

### Example 1: Navigation
```
User: "I want to see the pricing"
  ↓
LLM: {
  action: "click",
  target: "pricing link in navigation menu",
  reasoning: "User wants to navigate to pricing page"
}
  ↓
Find element: <a href="/pricing">Pricing</a>
  ↓
Execute: Click
  ↓
Agent: "✅ Navigating to pricing page..."
```

### Example 2: Form Filling
```
User: "Sign me up with john@example.com"
  ↓
LLM: {
  action: "input",
  target: "email input field",
  value: "john@example.com",
  reasoning: "User wants to enter email for signup"
}
  ↓
Find element: <input type="email" name="email">
  ↓
Execute: Fill
  ↓
Agent: "✅ Entered email address"
```

### Example 3: Information Extraction
```
User: "What features does this product have?"
  ↓
LLM: {
  action: "extract",
  target: "feature list or descriptions",
  reasoning: "User wants to know product features"
}
  ↓
Find elements: All feature-related text
  ↓
Extract: Parse and format
  ↓
Agent: "Here are the features:
• Visual Workflows
• Low Code Foundation
• Unlimited Possibilities"
```

## Configuration

User can configure LLM provider:
```json
{
  "llm": {
    "provider": "openai",
    "apiKey": "sk-...",
    "model": "gpt-4-turbo-preview"
  }
}
```

Or use Activi.ai's hosted LLM:
```json
{
  "llm": {
    "provider": "activi-cloud",
    "endpoint": "https://api.activi.ai/v1",
    "apiKey": "activi_..."
  }
}
```

## Next Steps

1. ✅ Create ChatHandler class
2. ⏳ Integrate with renderer.html
3. ⏳ Add DOM snapshot capture
4. ⏳ Connect to LLM client
5. ⏳ Test with real scenarios
6. ⏳ Add error handling
7. ⏳ Add conversation history

This will make the agent truly intelligent and context-aware!
