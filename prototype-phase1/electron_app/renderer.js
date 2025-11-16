async function computeCssSelector(el) {
  if (!(el instanceof Element)) return null;
  if (el.id) return `#${el.id}`;
  const parts = [];
  let e = el;
  while (e && e.nodeType === 1 && e.tagName.toLowerCase() !== 'html') {
    let part = e.tagName.toLowerCase();
    if (e.className) {
      const cls = e.className.toString().trim().split(/\s+/).join('.')
      if (cls) part += '.' + cls;
    }
    const parent = e.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(x => x.tagName === e.tagName);
      if (siblings.length > 1) {
        const idx = Array.from(parent.children).indexOf(e) + 1;
        part += `:nth-child(${idx})`;
      }
    }
    parts.unshift(part);
    e = e.parentElement;
  }
  return parts.join(' > ');
}

function log(msg) {
  const lg = document.getElementById('log');
  lg.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + lg.textContent;
}

async function captureSnapshot() {
  const webview = document.getElementById('pageFrame');
  
  try {
    // Execute script in webview to capture DOM
    const result = await webview.executeJavaScript(`
      (function() {
        function computeCssSelector(el) {
          if (!(el instanceof Element)) return null;
          if (el.id) return '#' + el.id;
          const parts = [];
          let e = el;
          while (e && e.nodeType === 1 && e.tagName.toLowerCase() !== 'html') {
            let part = e.tagName.toLowerCase();
            if (e.className && typeof e.className === 'string') {
              const cls = e.className.trim().split(/\\s+/).join('.');
              if (cls) part += '.' + cls;
            }
            const parent = e.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(x => x.tagName === e.tagName);
              if (siblings.length > 1) {
                const idx = Array.from(parent.children).indexOf(e) + 1;
                part += ':nth-child(' + idx + ')';
              }
            }
            parts.unshift(part);
            e = e.parentElement;
          }
          return parts.join(' > ');
        }
        
        const all = Array.from(document.querySelectorAll('*'));
        const elements = [];
        for (let i = 0; i < all.length; i++) {
          const el = all[i];
          const rect = el.getBoundingClientRect();
          const attrs = {};
          for (let a of el.attributes || []) attrs[a.name] = a.value;
          const selector = computeCssSelector(el);
          const style = window.getComputedStyle(el);
          const visible = !!(rect.width || rect.height) && style.visibility !== 'hidden' && style.display !== 'none';
          elements.push({
            id: i+1,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0,200),
            attributes: attrs,
            selectors: { 
              id: el.id || null, 
              name: el.getAttribute('name') || null, 
              'aria-label': el.getAttribute('aria-label') || null, 
              class: el.className || null, 
              css: selector 
            },
            bounding_rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            visible: visible
          });
        }
        return { url: window.location.href, elements: elements };
      })();
    `);
    
    return result;
  } catch (err) {
    log('Failed to capture snapshot: ' + err.message);
    return null;
  }
}

async function analyzeSnapshot(snapshot, goal) {
  try {
    const res = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ snapshot, goal })
    });
    if (!res.ok) throw new Error('Bridge error: ' + res.statusText);
    return await res.json();
  } catch (err) {
    log('Analyze error: ' + err.message);
    return null;
  }
}

function renderActions(actions) {
  const container = document.getElementById('actionsList');
  container.innerHTML = '';
  actions.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'action-item';
    div.innerHTML = `
      <div><strong>#${idx+1}</strong> <em>${a.action}</em> (conf=${(a.confidence||0).toFixed(3)})</div>
      <div>tag: ${a.tag} text: ${a.text}</div>
      <div>css: <code>${a.css}</code></div>
      <div><button data-idx="${idx}">Select</button></div>
    `;
    container.appendChild(div);
    div.querySelector('button').addEventListener('click', () => selectAction(idx, a));
  });
}

let lastActions = [];
let selectedAction = null;
let lastSnapshot = null;

function selectAction(idx, action) {
  selectedAction = action;
  document.getElementById('executeBtn').disabled = false;
  log('Selected action #' + (idx+1));
}

async function executeSelected() {
  if (!selectedAction) return;
  await executeAction(selectedAction);
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  document.getElementById('executeBtn').disabled = true;
  selectedAction = null;
  log('Capturing snapshot...');
  const snapshot = await captureSnapshot();
  if (!snapshot) return;
  lastSnapshot = snapshot;  // Store for element lookup
  const goal = document.getElementById('goalInput').value || 'click Submit';
  const result = await analyzeSnapshot(snapshot, goal);
  if (!result) return;
  if (result.actions && result.actions.length) {
    lastActions = result.actions;
    renderActions(result.actions);
    log('Received ' + result.actions.length + ' actions');
    document.getElementById('autoRunBtn').disabled = false;  // Enable auto-run
  } else {
    log('No actions returned');
    document.getElementById('autoRunBtn').disabled = true;
  }
});

document.getElementById('executeBtn').addEventListener('click', executeSelected);

// URL navigation
document.getElementById('loadUrlBtn').addEventListener('click', () => {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) {
    log('Please enter a URL');
    return;
  }
  
  // Security warning for remote URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!confirm(`⚠️ Loading remote URL: ${url}\n\nThis may expose your actions to external sites. Continue?`)) {
      return;
    }
  }
  
  const webview = document.getElementById('pageFrame');
  webview.src = url;
  log('Loading: ' + url);
  
  // Wait for load
  webview.addEventListener('did-finish-load', () => {
    log('Page loaded: ' + url);
  }, { once: true });
});

// Autonomous execution
let isAutoRunning = false;
let autoRunSteps = [];
let currentStepIndex = 0;

document.getElementById('autoRunBtn').addEventListener('click', async () => {
  if (isAutoRunning) {
    log('Auto-run already in progress');
    return;
  }
  
  const goal = document.getElementById('goalInput').value.trim();
  if (!goal) {
    log('Please enter a goal');
    return;
  }
  
  // Ask for permission
  const plan = await decomposeGoal(goal);
  const planText = plan.map((s, i) => `${i+1}. ${s}`).join('\n');
  
  if (!confirm(`🤖 Autonomous Execution Plan:\n\n${planText}\n\nApprove and run automatically?`)) {
    log('Auto-run cancelled by user');
    return;
  }
  
  // Start autonomous execution
  isAutoRunning = true;
  autoRunSteps = plan;
  currentStepIndex = 0;
  document.getElementById('autoRunBtn').disabled = true;
  document.getElementById('captureBtn').disabled = true;
  document.getElementById('executeBtn').disabled = true;
  showAutoStatus('Running...', 'progress');
  
  log('🤖 Starting autonomous execution...');
  await runAutonomously();
});

async function decomposeGoal(goal) {
  // Simple goal decomposition heuristics
  const steps = [];
  const lower = goal.toLowerCase();
  
  // Check for common patterns
  if (lower.includes('fill') && lower.includes('submit')) {
    // Extract field names
    const words = goal.split(/\s+/);
    for (let word of words) {
      if (word.length > 3 && !['fill', 'and', 'submit', 'the', 'form'].includes(word.toLowerCase())) {
        steps.push(`enter ${word}`);
      }
    }
    steps.push('click Submit');
  } else if (lower.includes('and')) {
    // Split by "and"
    const parts = goal.split(/\s+and\s+/i);
    steps.push(...parts.map(p => p.trim()));
  } else {
    // Single step
    steps.push(goal);
  }
  
  return steps;
}

async function runAutonomously() {
  while (currentStepIndex < autoRunSteps.length && isAutoRunning) {
    const step = autoRunSteps[currentStepIndex];
    showAutoStatus(`Step ${currentStepIndex + 1}/${autoRunSteps.length}: ${step}`, 'progress');
    log(`🤖 Step ${currentStepIndex + 1}: ${step}`);
    
    // Capture snapshot
    const snapshot = await captureSnapshot();
    if (!snapshot) {
      showAutoStatus('Failed to capture snapshot', 'error');
      stopAutoRun();
      return;
    }
    
    lastSnapshot = snapshot;
    
    // Analyze
    const result = await analyzeSnapshot(snapshot, step);
    if (!result || !result.actions || result.actions.length === 0) {
      showAutoStatus(`No action found for: ${step}`, 'error');
      log(`❌ No action found for step: ${step}`);
      stopAutoRun();
      return;
    }
    
    // Execute best action
    const action = result.actions[0];
    log(`🎯 Executing: ${action.action} on ${action.tag} (conf=${action.confidence.toFixed(3)})`);
    
    const success = await executeAction(action);
    if (!success) {
      showAutoStatus(`Failed to execute: ${step}`, 'error');
      stopAutoRun();
      return;
    }
    
    // Wait for page to settle
    await sleep(500);
    
    currentStepIndex++;
  }
  
  // Completion
  if (currentStepIndex >= autoRunSteps.length) {
    showAutoStatus('✅ All steps completed!', 'success');
    log('🎉 Autonomous execution completed successfully');
  }
  
  stopAutoRun();
}

async function executeAction(action) {
  const webview = document.getElementById('pageFrame');
  
  try {
    const css = action.css || '';
    const elementId = action.element_id || 0;
    const actionType = action.action || 'click';
    const value = action.value || '';
    
    // Execute action in webview
    const result = await webview.executeJavaScript(`
      (function() {
        let el = null;
        
        // Try CSS selector first
        if ('${css}') {
          try {
            el = document.querySelector('${css.replace(/'/g, "\\'")}');
          } catch (e) {
            console.error('Invalid CSS selector:', e);
          }
        }
        
        // Fallback: use element_id
        if (!el && ${elementId} > 0) {
          const all = Array.from(document.querySelectorAll('*'));
          if (${elementId} <= all.length) {
            el = all[${elementId} - 1];
          }
        }
        
        if (!el) {
          return { success: false, error: 'Element not found' };
        }
        
        if ('${actionType}' === 'click') {
          el.click();
          return { success: true, action: 'clicked' };
        } else if ('${actionType}' === 'input') {
          el.value = '${value.replace(/'/g, "\\'")}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return { success: true, action: 'input', value: '${value}' };
        }
        
        return { success: false, error: 'Unknown action type' };
      })();
    `);
    
    if (result.success) {
      log('✓ ' + result.action + ': ' + (css || 'element #' + elementId));
      return true;
    } else {
      log('✗ ' + result.error);
      return false;
    }
  } catch (err) {
    log('Execution error: ' + err.message);
    return false;
  }
}

function stopAutoRun() {
  isAutoRunning = false;
  document.getElementById('autoRunBtn').disabled = false;
  document.getElementById('captureBtn').disabled = false;
  document.getElementById('executeBtn').disabled = false;
}

function showAutoStatus(message, type) {
  const status = document.getElementById('autoStatus');
  status.style.display = 'block';
  status.textContent = message;
  status.style.background = type === 'error' ? '#ffebee' : type === 'success' ? '#e8f5e9' : '#fff3e0';
  status.style.color = type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : '#e65100';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

log('UI ready');
