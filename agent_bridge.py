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
        css = el.selectors.get('css') or el.attributes.get('id') or ''
        actions.append({
            'action': 'click' if el.tag in ('a','button') or el.tag == 'input' else 'click',
            'confidence': conf,
            'tag': el.tag,
            'text': el.text,
            'css': css
        })

    return {'actions': actions}

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
