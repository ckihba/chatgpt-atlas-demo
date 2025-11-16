import Store from 'electron-store'
import { AppConfig } from './types'

const schema: any = {
  activiUrl: {
    type: 'string',
    default: 'https://activi.ai'
  },
  llm: {
    type: 'object',
    properties: {
      provider: { type: 'string', default: 'activi-cloud' },
      endpoint: { type: 'string' },
      apiKey: { type: 'string' },
      model: { type: 'string', default: 'gpt-4-turbo-preview' }
    }
  },
  autoStart: {
    type: 'boolean',
    default: false
  },
  stepDelay: {
    type: 'number',
    default: 500
  },
  highlightDuration: {
    type: 'number',
    default: 1000
  }
}

export const configStore = new Store({ schema })

export function getConfig(): AppConfig {
  return {
    activiUrl: (configStore.get('activiUrl') as string) || 'https://activi.ai',
    llm: (configStore.get('llm') as AppConfig['llm']) || {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey: '',
      endpoint: ''
    },
    autoStart: (configStore.get('autoStart') as boolean) || false,
    stepDelay: (configStore.get('stepDelay') as number) || 500,
    highlightDuration: (configStore.get('highlightDuration') as number) || 1000
  }
}

export function updateConfig(updates: Partial<AppConfig>) {
  Object.entries(updates).forEach(([key, value]) => {
    configStore.set(key, value)
  })
}
