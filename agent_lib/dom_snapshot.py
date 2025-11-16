from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from bs4 import BeautifulSoup


@dataclass
class Element:
    id: int
    tag: str
    text: str
    attributes: Dict[str, str] = field(default_factory=dict)
    selectors: Dict[str, Optional[str]] = field(default_factory=dict)
    visible: bool = True


class DOMSnapshot:
    """Simple DOM snapshot representation for Phase 1.

    This class is intentionally small: it serializes key attributes from
    BeautifulSoup-parsed HTML into a list of lightweight Element objects
    and provides basic lookup helpers used by the demo agent.
    """

    def __init__(self, url: str, elements: List[Element]):
        self.url = url
        self.elements = elements
        # Build fast lookup indices
        self._by_id = {el.id: el for el in elements}
        self._by_tag: Dict[str, List[Element]] = {}
        for el in elements:
            self._by_tag.setdefault(el.tag, []).append(el)

    @classmethod
    def from_html(cls, html: str, url: str = "") -> "DOMSnapshot":
        soup = BeautifulSoup(html, "html.parser")
        elements: List[Element] = []
        next_id = 1

        for node in soup.find_all(True):
            text = (node.get_text(strip=True) or "")[:200]
            attrs = {k: v for k, v in node.attrs.items()}

            selectors = {
                "id": node.get("id"),
                "name": node.get("name"),
                "aria-label": node.get("aria-label"),
                "class": " ".join(node.get("class", [])) if node.get("class") else None,
            }

            el = Element(id=next_id, tag=node.name.lower(), text=text, attributes=attrs, selectors=selectors, visible=True)
            elements.append(el)
            next_id += 1

        return cls(url=url, elements=elements)

    def get_element_by_id(self, element_id: int) -> Optional[Element]:
        return self._by_id.get(element_id)

    def get_elements_by_tag(self, tag: str) -> List[Element]:
        return self._by_tag.get(tag.lower(), [])

    def get_visible_elements(self) -> List[Element]:
        return [el for el in self.elements if el.visible]

    def find_elements_by_text(self, text: str, case_sensitive: bool = False) -> List[Element]:
        if not case_sensitive:
            text = text.lower()
        matches: List[Element] = []
        for el in self.elements:
            t = el.text if case_sensitive else el.text.lower()
            if text in t:
                matches.append(el)
        return matches

    def find_input_by_name(self, name: str) -> Optional[Element]:
        for el in self.get_elements_by_tag("input"):
            if el.selectors.get("name") == name or el.attributes.get("name") == name:
                return el
        return None
