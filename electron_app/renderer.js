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
  const iframe = document.getElementById('pageFrame');
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) {
    log('Failed to access iframe document');
    return null;
  }
  const all = Array.from(doc.querySelectorAll('*'));
  const elements = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { x:0,y:0,width:0,height:0 };
    const attrs = {};
    for (let a of el.attributes || []) attrs[a.name] = a.value;
    const selector = await computeCssSelector(el);
    const visible = !!(rect.width || rect.height) && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
    elements.push({
      id: i+1,
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0,200),
      attributes: attrs,
      selectors: { id: el.id || null, name: el.getAttribute('name') || null, 'aria-label': el.getAttribute('aria-label') || null, class: (el.className||null), css: selector },
      bounding_rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      visible: visible
    });
  }
  return { url: iframe.src, elements };
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

function selectAction(idx, action) {
  selectedAction = action;
  document.getElementById('executeBtn').disabled = false;
  log('Selected action #' + (idx+1));
}

function executeSelected() {
  if (!selectedAction) return;
  const iframe = document.getElementById('pageFrame');
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  try {
    const el = doc.querySelector(selectedAction.css);
    if (!el) { log('Element not found for selector: ' + selectedAction.css); return; }
    if (selectedAction.action === 'click') {
      el.click();
      log('Clicked element: ' + selectedAction.css);
    } else if (selectedAction.action === 'input') {
      el.value = selectedAction.value || '';
      log('Set input value for: ' + selectedAction.css);
    }
  } catch (err) {
    log('Execution error: ' + err.message);
  }
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  document.getElementById('executeBtn').disabled = true;
  selectedAction = null;
  log('Capturing snapshot...');
  const snapshot = await captureSnapshot();
  if (!snapshot) return;
  const goal = document.getElementById('goalInput').value || 'click Submit';
  const result = await analyzeSnapshot(snapshot, goal);
  if (!result) return;
  if (result.actions && result.actions.length) {
    lastActions = result.actions;
    renderActions(result.actions);
    log('Received ' + result.actions.length + ' actions');
  } else {
    log('No actions returned');
  }
});

document.getElementById('executeBtn').addEventListener('click', executeSelected);

log('UI ready');
