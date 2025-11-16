import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

from agent_lib.dom_snapshot import DOMSnapshot
from agent_lib.selector_engine import SelectorEngine

class Agent:
    """A simple agent that can fetch pages, parse them, and simulate interactions."""

    def __init__(self, base_url: str):
        """
        Initialize the agent with a base URL or local HTML file path.
        :param base_url: The starting URL or path to the HTML file.
        """
        self.session = requests.Session()
        self.base_url = base_url
        self.current_url = base_url
        self.soup = None
        self.action_log = []
        # Selector engine used to map natural-language goals to elements
        self.selector = SelectorEngine()

    def fetch_page(self, url: str = None) -> None:
        """Fetch the given URL (or the current URL if None) and parse it with BeautifulSoup."""
        target = url or self.current_url
        # Support local files (file:// or plain path)
        if target.startswith("file://"):
            file_path = target[len("file://"):]
            with open(file_path, "r", encoding="utf-8") as f:
                html = f.read()
        elif os.path.isfile(target):
            with open(target, "r", encoding="utf-8") as f:
                html = f.read()
        else:
            response = self.session.get(target)
            response.raise_for_status()
            html = response.text
        self.current_url = target
        self.soup = BeautifulSoup(html, "html.parser")
        # Build a lightweight DOM snapshot for downstream components
        try:
            self.snapshot = DOMSnapshot.from_html(html, url=target)
        except Exception:
            # Fallback: keep snapshot None if DOMSnapshot creation fails
            self.snapshot = None
        self.action_log.append(f"Fetched page: {target}")

    def find_element_by_text(self, tag: str, text: str):
        """Find the first element with the given tag containing the specified text (case-insensitive)."""
        if not self.soup:
            raise RuntimeError("No page loaded. Call fetch_page() first.")
        return self.soup.find(tag, string=lambda s: s and text.lower() in s.lower())

    def click_link(self, link_text: str) -> None:
        """Find an anchor (or other clickable element) by its text/goal and follow its href when available.

        Uses the `SelectorEngine` with a "click" goal to prefer snapshot-based selection.
        """
        # Prefer selector engine if snapshot available
        el = None
        confidence = 0.0
        if getattr(self, "snapshot", None):
            el, confidence = self.selector.find_element(f"click {link_text}", self.snapshot)

        # If selector engine didn't find a suitable element, fall back to simple anchor text search
        if not el:
            element = self.find_element_by_text('a', link_text)
            el = None
            if element:
                # build a lightweight proxy with attributes expected by downstream logic
                class _Proxy:
                    pass
                p = _Proxy()
                p.tag = element.name
                p.attributes = dict(element.attrs)
                p.text = element.get_text(strip=True)
                el = p

        if el:
            href = None
            if hasattr(el, 'attributes'):
                href = el.attributes.get('href')
            if hasattr(el, 'tag') and el.tag == 'a' and href:
                next_url = urljoin(self.current_url, href)
                self.action_log.append(f"Clicking link with text '{link_text}' -> {next_url} (confidence={confidence:.3f})")
                self.fetch_page(next_url)
                return
            # For non-anchor clickables (buttons, inputs), log the click but no navigation
            tag = getattr(el, 'tag', 'element')
            self.action_log.append(f"Clicking {tag} with text '{getattr(el, 'text', '')}' (confidence={confidence:.3f})")
        else:
            self.action_log.append(f"No link/button found with text '{link_text}'")

    def input_text(self, name: str, value: str) -> None:
        """Simulate entering text into an input field. Uses selector heuristics when available."""
        if not self.soup:
            raise RuntimeError("No page loaded. Call fetch_page() first.")

        el = None
        confidence = 0.0
        # Try selector engine first (natural-language goal)
        if getattr(self, "snapshot", None):
            el, confidence = self.selector.find_element(f"enter {name}", self.snapshot)

        # If selector didn't find an input element, fall back to name-based search
        if not el:
            input_tag = self.soup.find('input', attrs={'name': name})
            if input_tag:
                class _Proxy:
                    pass
                p = _Proxy()
                p.tag = input_tag.name
                p.attributes = dict(input_tag.attrs)
                p.text = input_tag.get_text(strip=True)
                el = p

        if el and getattr(el, 'tag', '') == 'input':
            self.action_log.append(f"Inputting '{value}' into field '{name}' (not submitted) (confidence={confidence:.3f})")
        else:
            self.action_log.append(f"Input field '{name}' not found")

    def get_action_log(self):
        """Return the list of actions performed."""
        return list(self.action_log)

    def run_demo(self) -> None:
        """Run a demo sequence showing basic interactions."""
        # Load the starting page
        self.fetch_page()
        # Example actions: this part can be customized per site
        # For a simple HTML sample, try clicking a link and filling a form
        # Find and click a link if exists
        self.click_link('Submit')  # example: follow a link named 'Submit'
        # Simulate inputting text into a username field
        self.input_text('username', 'demo_user')
        # Print the log
        for action in self.action_log:
            print(action)
