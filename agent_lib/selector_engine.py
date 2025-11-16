from typing import Optional, Tuple
from difflib import SequenceMatcher
from enum import Enum

from agent_lib.dom_snapshot import DOMSnapshot, Element


class SelectorStrategy(Enum):
    BY_ID = "by_id"
    BY_ACCESSIBILITY = "by_accessibility"
    BY_SEMANTIC = "by_semantic"
    BY_TEXT = "by_text"
    BY_CLASS = "by_class"
    STRUCTURAL = "structural"


class SelectorEngine:
    """Simple multi-strategy selector engine for Phase 1.

    Returns (Element, confidence) or (None, 0.0).
    """

    def __init__(self):
        # Base confidences per strategy
        self.base_confidence = {
            SelectorStrategy.BY_ID: 0.99,
            SelectorStrategy.BY_ACCESSIBILITY: 0.95,
            SelectorStrategy.BY_SEMANTIC: 0.85,
            SelectorStrategy.BY_TEXT: 0.70,
            SelectorStrategy.BY_CLASS: 0.75,
            SelectorStrategy.STRUCTURAL: 0.60,
        }

    def _fuzzy(self, a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    def find_element(self, goal: str, snapshot: DOMSnapshot) -> Tuple[Optional[Element], float]:
        """Find best matching element for the given natural-language goal.

        This is a heuristic: it looks for obvious matches in id, aria-label,
        name, text, and class. It returns the highest-confidence candidate.
        """
        # Simplified parsing: target words (drop common verbs)
        target = goal.lower()
        for verb in ["click", "enter", "input", "type", "select", "find"]:
            target = target.replace(verb, "")
        target = target.strip()

        candidates = []

        # Strategy: ID
        for el in snapshot.elements:
            el_id = el.selectors.get("id") or el.attributes.get("id")
            if el_id and target and target in el_id.lower():
                candidates.append((el, self.base_confidence[SelectorStrategy.BY_ID]))

        # Accessibility (aria-label)
        for el in snapshot.elements:
            aria = el.selectors.get("aria-label")
            if aria:
                score = self._fuzzy(target, aria)
                if score > 0.5:
                    candidates.append((el, self.base_confidence[SelectorStrategy.BY_ACCESSIBILITY] + 0.04 * score))

        # Semantic (name attribute)
        for el in snapshot.elements:
            name = el.selectors.get("name") or el.attributes.get("name")
            if name:
                score = self._fuzzy(target, name)
                if score > 0.4:
                    candidates.append((el, self.base_confidence[SelectorStrategy.BY_SEMANTIC] + 0.05 * score))

        # Text matching
        for el in snapshot.elements:
            if not el.text:
                continue
            score = self._fuzzy(target, el.text)
            if score > 0.4:
                candidates.append((el, self.base_confidence[SelectorStrategy.BY_TEXT] + 0.25 * score))

        # Class name
        for el in snapshot.elements:
            cls = el.selectors.get("class")
            if cls:
                score = self._fuzzy(target, cls)
                if score > 0.5:
                    candidates.append((el, self.base_confidence[SelectorStrategy.BY_CLASS] + 0.04 * score))

        # If no candidates found, fall back to structural heuristics
        if not candidates:
            # As a fallback, prefer first input or button depending on keywords
            if "submit" in target or "button" in target:
                buttons = snapshot.get_elements_by_tag("button")
                if buttons:
                    return buttons[0], self.base_confidence[SelectorStrategy.STRUCTURAL]
            inputs = snapshot.get_elements_by_tag("input")
            if inputs:
                return inputs[0], self.base_confidence[SelectorStrategy.STRUCTURAL]
            return None, 0.0

        # Return best candidate
        best_el, best_conf = max(candidates, key=lambda x: x[1])
        # Cap confidence at 0.995
        return best_el, min(best_conf, 0.995)
