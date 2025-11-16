# Autonomous Mode

## Overview

Autonomous mode enables the agent to **continuously work toward a goal** without requiring user input for each step. The agent evaluates progress after each action and automatically determines the next steps until the goal is achieved.

## How It Works

### 1. User Sets Goal

User switches to "Autonomous" mode and provides a high-level goal:
- "Do we have an interactive demo?"
- "Find pricing information and compare plans"
- "Sign up for a free trial with test@example.com"

### 2. Autonomous Loop

The agent enters a continuous evaluation loop:

```
┌─────────────────────────────────────┐
│  1. Capture current page state      │
│  2. Send to LLM with goal + history │
│  3. LLM evaluates progress          │
│  4. LLM returns next actions        │
│  5. Execute actions                 │
│  6. Wait for page to settle         │
│  7. Repeat until goal achieved      │
└─────────────────────────────────────┘
```

### 3. LLM Decision Making

On each iteration, the LLM evaluates:
- **Goal Status**: Is it achieved, in progress, or blocked?
- **Current Context**: What page am I on? What can I interact with?
- **Action History**: What have I already tried?
- **Next Steps**: What actions will move me closer to the goal?

### 4. Response Format

The LLM returns structured decisions:

```json
{
  "goalAchieved": false,
  "needsHelp": false,
  "progress": "Found Watch Demo button, clicking to access demo",
  "actions": [
    {
      "type": "click",
      "selector": { "method": "index", "value": 5 },
      "waitAfter": 2000
    }
  ],
  "reasoning": "Clicking Watch Demo to see if interactive demo exists"
}
```

### 5. Termination Conditions

The loop stops when:
- **Goal Achieved**: `goalAchieved: true`
- **Needs Help**: `needsHelp: true` (stuck or impossible)
- **Max Steps**: Reached safety limit (default: 10 steps)
- **User Stop**: User clicks Stop button
- **Error**: Unrecoverable error occurs

## Example Flow

**User Goal**: "Do we have an interactive demo?"

### Step 1: Homepage
- **Page**: activi.ai homepage
- **LLM Sees**: "Watch Demo" button, "Start Now" button, navigation links
- **Decision**: Click "Watch Demo" button
- **Action**: Click element at index 5
- **Progress**: "Found Watch Demo button, clicking to access demo"

### Step 2: Demo Page
- **Page**: activi.ai/demo (after navigation)
- **LLM Sees**: Interactive demo interface, feature showcase
- **Decision**: Goal achieved!
- **Action**: None
- **Progress**: "Successfully found and accessed interactive demo"
- **Result**: `goalAchieved: true`

## Benefits

1. **Hands-Free Operation**: User sets goal once, agent handles the rest
2. **Context Awareness**: Agent remembers what it's tried and adapts
3. **Multi-Step Workflows**: Handles complex tasks requiring navigation
4. **Self-Correcting**: If an action fails, agent tries alternative approaches
5. **Safe Execution**: Built-in limits prevent infinite loops

## Safety Features

- **Step Limit**: Maximum 10 steps per goal (configurable)
- **Stop Button**: User can halt execution anytime
- **Error Handling**: Graceful failure with explanatory messages
- **Progress Reporting**: Real-time updates on what agent is doing
- **Conversation History**: Full audit trail of decisions

## Use Cases

### Information Gathering
- "Find all pricing tiers and their features"
- "Check if they offer a free trial"
- "What integrations do they support?"

### Navigation Tasks
- "Go to the documentation and find API examples"
- "Navigate to the blog and find recent posts"
- "Find the contact page and extract email"

### Form Interactions
- "Fill out the contact form with my details"
- "Sign up for newsletter with test@example.com"
- "Search for 'automation' and show results"

### Verification Tasks
- "Do they have an interactive demo?"
- "Is there a mobile app available?"
- "Can I export data to CSV?"

## Comparison: Manual vs Interactive vs Autonomous

| Mode | User Input | Agent Behavior | Best For |
|------|-----------|----------------|----------|
| **Manual** | Every action | Executes single commands | Learning, testing |
| **Interactive** | Per task | Executes task, waits for next | Guided workflows |
| **Autonomous** | Goal only | Continuous until goal met | Complex multi-step tasks |

## Technical Implementation

### Conversation History

The agent maintains context across iterations:

```javascript
conversationHistory = [
  { role: 'assistant', content: '{"progress": "Clicked Watch Demo"}' },
  { role: 'user', content: 'Current page: /demo' },
  { role: 'assistant', content: '{"goalAchieved": true}' }
]
```

### State Management

```javascript
{
  autonomousMode: true,
  autonomousGoal: "Do we have an interactive demo?",
  conversationHistory: [...],
  currentStep: 2,
  maxAutonomousSteps: 10,
  stopRequested: false
}
```

### Page State Capture

After each action, the agent captures:
- Current URL
- Page title
- Interactive elements (buttons, links, inputs)
- Element properties (text, attributes, selectors)

This fresh state is sent to the LLM for the next evaluation.

## Future Enhancements

- **Learning from Failures**: Remember what didn't work
- **Parallel Actions**: Execute multiple independent actions simultaneously
- **Goal Decomposition**: Break complex goals into sub-goals
- **User Confirmation**: Optional approval for critical actions
- **Session Replay**: Review and replay autonomous sessions
- **Custom Step Limits**: Per-goal step configuration
