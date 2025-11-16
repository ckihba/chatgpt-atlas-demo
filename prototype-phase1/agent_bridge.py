from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn

from agent_lib.dom_snapshot import Element, DOMSnapshot
from agent_lib.selector_engine import SelectorEngine

app = FastAPI()
engine = SelectorEngine()

class SnapshotElement(BaseModel):
    id: int
    tag: str
    text: str
    attributes: Dict[str, Any]
    selectors: Dict[str, Any]
    bounding_rect: Dict[str, Any]
    visible: bool

class Snapshot(BaseModel):
    url: str
    elements: List[SnapshotElement]

class AnalyzeRequest(BaseModel):
    snapshot: Snapshot
    goal: str

@app.post('/analyze')
async def analyze(req: AnalyzeRequest):
    # Reconstruct DOMSnapshot from posted snapshot
    el_list = []
    for se in req.snapshot.elements:
        el = Element(
            id=se.id,
            tag=se.tag,
            text=se.text,
            attributes=se.attributes or {},
            selectors={
                'id': se.selectors.get('id'),
                'name': se.selectors.get('name'),
                'aria-label': se.selectors.get('aria-label'),
                'class': se.selectors.get('class'),
                'css': se.selectors.get('css')
            },
            visible=se.visible
        )
        el_list.append(el)
    snapshot = DOMSnapshot(url=req.snapshot.url, elements=el_list)

    # Use selector engine to find best element(s)
    el, conf = engine.find_element(req.goal, snapshot)
    actions = []
    if el:
        # Build a usable CSS selector from available attributes
        css = ''
        if el.selectors.get('id'):
            css = f"#{el.selectors['id']}"
        elif el.selectors.get('name'):
            css = f"{el.tag}[name='{el.selectors['name']}']"
        elif el.selectors.get('aria-label'):
            css = f"{el.tag}[aria-label='{el.selectors['aria-label']}']"
        else:
            # Fallback: use tag + text content match (not ideal but works)
            css = el.tag
        
        # Determine action type and extract value for inputs
        action_type = 'click'
        value = None
        
        if el.tag == 'input' and el.attributes.get('type') not in ['button', 'submit', 'checkbox', 'radio']:
            action_type = 'input'
            # Try to extract value from goal (e.g., "enter username john" -> "john")
            goal_lower = req.goal.lower()
            for verb in ['enter', 'type', 'input', 'fill']:
                if verb in goal_lower:
                    parts = req.goal.split()
                    if len(parts) > 2:
                        # Take everything after the field name as value
                        value = ' '.join(parts[2:])
                    break
        
        actions.append({
            'action': action_type,
            'confidence': conf,
            'tag': el.tag,
            'text': el.text,
            'css': css,
            'element_id': el.id,
            'value': value
        })

    return {'actions': actions}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
