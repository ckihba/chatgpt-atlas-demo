import { LLMClient } from './services/llm-client'
import { DOMSnapshot } from './types'

export interface ChatAction {
  type: 'click' | 'input' | 'navigate' | 'extract' | 'wait'
  target?: string
  value?: string
  selector?: string
  reasoning?: string
}

export class ChatHandler {
  constructor(private llmClient: LLMClient) {}

  async interpretIntent(
    userMessage: string,
    domSnapshot: DOMSnapshot
  ): Promise<ChatAction> {
    // Prepare context for LLM
    const context = this.prepareDOMContext(domSnapshot)
    
    // Use LLM with function calling to interpret intent
    const response = await this.llmClient.chat([
      {
        role: 'system',
        content: `You are a web automation assistant. The user wants to interact with a web page.
        
Given the user's request and the current page elements, determine what action to take.

Available actions:
- click: Click on an element (button, link, etc.)
- input: Enter text into a field
- navigate: Go to a different page
- extract: Extract information from the page
- wait: Wait for something to load

Return the action with the target element description.`
      },
      {
        role: 'user',
        content: `User request: "${userMessage}"

Current page: ${domSnapshot.url}

Available elements:
${context}

What action should I take?`
      }
    ], [
      {
        type: 'function',
        function: {
          name: 'execute_action',
          description: 'Execute an action on the web page',
          parameters: {
            type: 'object',
            properties: {
              action_type: {
                type: 'string',
                enum: ['click', 'input', 'navigate', 'extract', 'wait'],
                description: 'The type of action to perform'
              },
              target_description: {
                type: 'string',
                description: 'Natural language description of the target element (e.g., "Submit button", "email input field")'
              },
              value: {
                type: 'string',
                description: 'Value to input (for input actions) or URL (for navigate actions)'
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of why this action was chosen'
              }
            },
            required: ['action_type', 'target_description', 'reasoning']
          }
        }
      }
    ])

    // Parse LLM response
    return this.parseActionResponse(response)
  }

  private prepareDOMContext(snapshot: DOMSnapshot): string {
    // Get interactive elements only
    const interactive = snapshot.elements.filter(el => 
      el.visible && (
        el.tag === 'button' ||
        el.tag === 'a' ||
        el.tag === 'input' ||
        el.tag === 'textarea' ||
        el.tag === 'select' ||
        el.attributes['role'] === 'button'
      )
    )

    // Format for LLM (limit to top 50 elements)
    return interactive.slice(0, 50).map((el, idx) => {
      const text = el.text.slice(0, 50)
      const type = el.attributes['type'] || el.tag
      const label = el.selectors['aria-label'] || el.attributes['placeholder'] || ''
      
      return `${idx + 1}. ${type}: "${text}" ${label ? `(${label})` : ''}`
    }).join('\n')
  }

  private parseActionResponse(response: any): ChatAction {
    // Extract function call from LLM response
    const toolCall = response.choices?.[0]?.message?.tool_calls?.[0]
    
    if (!toolCall) {
      throw new Error('No action returned from LLM')
    }

    const args = JSON.parse(toolCall.function.arguments)
    
    return {
      type: args.action_type,
      target: args.target_description,
      value: args.value,
      reasoning: args.reasoning
    }
  }

  async findElementForAction(
    action: ChatAction,
    domSnapshot: DOMSnapshot
  ): Promise<{ selector: string; confidence: number } | null> {
    // Use LLM to find the best matching element
    const element = await this.llmClient.findElement(
      action.target || '',
      domSnapshot
    )

    if (!element || !element.selectors.css) {
      return null
    }

    return {
      selector: element.selectors.css,
      confidence: 0.9 // Would come from LLM
    }
  }
}
