import { BrowserView, BrowserWindow } from 'electron'
import { DOMSnapshot, Element } from '../types'

export class BrowserController {
  private browserView: BrowserView
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.browserView = new BrowserView({
      webPreferences: {
        partition: 'persist:activi',
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    mainWindow.setBrowserView(this.browserView)
    this.updateBounds()

    mainWindow.on('resize', () => this.updateBounds())
  }

  private updateBounds() {
    const bounds = this.mainWindow.getContentBounds()
    const topBarHeight = 40 // Reserve space for top bar
    
    // Set BrowserView to cover everything below the top bar
    // But set it to auto-resize to false so it doesn't cover the chat panel
    this.browserView.setBounds({
      x: 0,
      y: topBarHeight,
      width: bounds.width,
      height: bounds.height - topBarHeight
    })
    
    this.browserView.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false
    })
  }

  async navigate(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Navigation timeout'))
      }, 30000)

      this.browserView.webContents.once('did-finish-load', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.browserView.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        clearTimeout(timeout)
        reject(new Error(`Navigation failed: ${errorDescription}`))
      })

      this.browserView.webContents.loadURL(url)
    })
  }

  async captureDOM(): Promise<DOMSnapshot> {
    const result = await this.browserView.webContents.executeJavaScript(`
      (function() {
        function computeCssSelector(el) {
          if (!(el instanceof Element)) return null
          if (el.id) return '#' + el.id
          
          const parts = []
          let e = el
          
          while (e && e.nodeType === 1 && e.tagName.toLowerCase() !== 'html') {
            let part = e.tagName.toLowerCase()
            
            if (e.className && typeof e.className === 'string') {
              const cls = e.className.trim().split(/\\s+/).join('.')
              if (cls) part += '.' + cls
            }
            
            const parent = e.parentElement
            if (parent) {
              const siblings = Array.from(parent.children).filter(x => x.tagName === e.tagName)
              if (siblings.length > 1) {
                const idx = Array.from(parent.children).indexOf(e) + 1
                part += ':nth-child(' + idx + ')'
              }
            }
            
            parts.unshift(part)
            e = e.parentElement
          }
          
          return parts.join(' > ')
        }
        
        const all = Array.from(document.querySelectorAll('*'))
        const elements = []
        
        for (let i = 0; i < all.length; i++) {
          const el = all[i]
          const rect = el.getBoundingClientRect()
          const attrs = {}
          
          for (let a of el.attributes || []) {
            attrs[a.name] = a.value
          }
          
          const selector = computeCssSelector(el)
          const style = window.getComputedStyle(el)
          const visible = !!(rect.width || rect.height) && 
                         style.visibility !== 'hidden' && 
                         style.display !== 'none'
          
          elements.push({
            id: i + 1,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0, 200),
            attributes: attrs,
            selectors: {
              id: el.id || null,
              name: el.getAttribute('name') || null,
              'aria-label': el.getAttribute('aria-label') || null,
              class: el.className || null,
              css: selector
            },
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            visible: visible
          })
        }
        
        return {
          url: window.location.href,
          timestamp: Date.now(),
          elements: elements
        }
      })()
    `)

    return result as DOMSnapshot
  }

  async click(selector: string): Promise<void> {
    const result = await this.browserView.webContents.executeJavaScript(`
      (function() {
        const el = document.querySelector('${selector.replace(/'/g, "\\'")}')
        if (!el) return { success: false, error: 'Element not found' }
        
        el.click()
        return { success: true }
      })()
    `)

    if (!result.success) {
      throw new Error(result.error)
    }
  }

  async input(selector: string, value: string): Promise<void> {
    const result = await this.browserView.webContents.executeJavaScript(`
      (function() {
        const el = document.querySelector('${selector.replace(/'/g, "\\'")}')
        if (!el) return { success: false, error: 'Element not found' }
        
        el.value = '${value.replace(/'/g, "\\'")}'
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        
        return { success: true }
      })()
    `)

    if (!result.success) {
      throw new Error(result.error)
    }
  }

  async highlightElement(selector: string, duration: number = 1000): Promise<void> {
    await this.browserView.webContents.executeJavaScript(`
      (function() {
        const el = document.querySelector('${selector.replace(/'/g, "\\'")}')
        if (!el) return
        
        const originalOutline = el.style.outline
        const originalBoxShadow = el.style.boxShadow
        
        el.style.outline = '3px solid #3b82f6'
        el.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)'
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        setTimeout(() => {
          el.style.outline = originalOutline
          el.style.boxShadow = originalBoxShadow
        }, ${duration})
      })()
    `)
  }

  async screenshot(): Promise<Buffer> {
    const image = await this.browserView.webContents.capturePage()
    return image.toPNG()
  }

  getCurrentURL(): string {
    return this.browserView.webContents.getURL()
  }

  canGoBack(): boolean {
    return this.browserView.webContents.canGoBack()
  }

  canGoForward(): boolean {
    return this.browserView.webContents.canGoForward()
  }

  goBack(): void {
    this.browserView.webContents.goBack()
  }

  goForward(): void {
    this.browserView.webContents.goForward()
  }

  reload(): void {
    this.browserView.webContents.reload()
  }

  destroy(): void {
    this.mainWindow.removeBrowserView(this.browserView)
    // @ts-ignore
    this.browserView.webContents.destroy()
  }
}
