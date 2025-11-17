import OpenAI from 'openai'
import { LLMConfig, DOMSnapshot, Element } from '../types'

export class LLMClient {
  private client: OpenAI

  constructor(private config: LLMConfig) {
    this.client = this.initializeClient()
  }

  private initializeClient(): OpenAI {
    const baseConfig: any = {
      apiKey: this.config?.apiKey || 'not-needed'
    }

    const provider = this.config?.provider || 'openai'

    switch (provider) {
      case 'groq':
        // Groq uses OpenAI-compatible API
        baseConfig.baseURL = 'https://api.groq.com/openai/v1'
        baseConfig.apiKey = this.config?.apiKey
        break
      
      case 'gemini':
        // Google Gemini via OpenAI-compatible endpoint
        baseConfig.baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/'
        baseConfig.apiKey = this.config?.apiKey
        break
      
      case 'activi-cloud':
        baseConfig.baseURL = this.config?.endpoint || 'https://api.activi.ai/v1'
        break
      
      case 'azure':
        baseConfig.baseURL = this.config?.endpoint
        baseConfig.defaultQuery = { 'api-version': '2024-02-01' }
        baseConfig.defaultHeaders = { 'api-key': this.config?.apiKey }
        break
      
      case 'local':
        baseConfig.baseURL = this.config?.endpoint || 'http://localhost:1234/v1'
        break
      
      case 'anthropic':
        // Would use @anthropic-ai/sdk instead
        throw new Error('Anthropic support coming soon')
      
      default:
        // OpenAI
        break
    }

    return new OpenAI(baseConfig)
  }

  async findElement(description: string, dom: DOMSnapshot): Promise<Element | null> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert at finding elements in web pages. Given a description and DOM snapshot, identify the best matching element.
            
Return the element ID and confidence score (0-1).`
          },
          {
            role: 'user',
            content: JSON.stringify({
              description,
              elements: dom.elements.map(el => ({
                id: el.id,
                tag: el.tag,
                text: el.text.slice(0, 100),
                attributes: el.attributes,
                visible: el.visible
              }))
            })
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'select_element',
            description: 'Select the best matching element',
            parameters: {
              type: 'object',
              properties: {
                element_id: {
                  type: 'number',
                  description: 'The ID of the selected element'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score between 0 and 1'
                },
                reasoning: {
                  type: 'string',
                  description: 'Why this element was selected'
                }
              },
              required: ['element_id', 'confidence']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'select_element' } }
      })

      const toolCall = response.choices[0].message.tool_calls?.[0]
      if (!toolCall) return null

      const args = JSON.parse(toolCall.function.arguments)
      const element = dom.elements.find(el => el.id === args.element_id)
      
      console.log(`LLM found element: ${args.element_id} (confidence: ${args.confidence})`)
      console.log(`Reasoning: ${args.reasoning}`)
      
      return element || null
    } catch (error) {
      console.error('LLM element finding failed:', error)
      return null
    }
  }

  async extractData(prompt: string, content: string): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Extract structured data from the provided content. Return valid JSON.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nContent:\n${content}`
          }
        ],
        response_format: { type: 'json_object' }
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('LLM extraction failed:', error)
      return null
    }
  }

  async chat(messages: Array<{ role: string; content: string }>, tools?: any[]): Promise<string> {
    try {
      const params: any = {
        model: this.config.model,
        messages: messages as any,
        stream: false
      }
      
      if (tools && tools.length > 0) {
        params.tools = tools
        params.tool_choice = 'auto'
      }
      
      const response = await this.client.chat.completions.create(params)

      return response.choices[0].message.content || JSON.stringify(response.choices[0].message)
    } catch (error) {
      console.error('LLM chat failed:', error)
      return 'Sorry, I encountered an error.'
    }
  }

  async chatWithJsonMode(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        response_format: { type: 'json_object' },
        stream: false
      })

      return response.choices[0].message.content || '{}'
    } catch (error) {
      console.error('LLM JSON mode failed:', error)
      throw error
    }
  }

  async *chatStream(messages: Array<{ role: string; content: string }>): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      console.error('LLM stream failed:', error)
      yield 'Sorry, I encountered an error.'
    }
  }
}
