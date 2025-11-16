import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

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
        self.action_log.append(f"Fetched page: {target}")

    def find_element_by_text(self, tag: str, text: str):
        """Find the first element with the given tag containing the specified text (case-insensitive)."""
        if not self.soup:
            raise RuntimeError("No page loaded. Call fetch_page() first.")
        return self.soup.find(tag, string=lambda s: s and text.lower() in s.lower())

    def click_link(self, link_text: str) -> None:
        """Find an anchor by its text and follow its href if present."""
        element = self.find_element_by_text('a', link_text)
        if element and element.get('href'):
            next_url = urljoin(self.current_url, element['href'])
            self.action_log.append(f"Clicking link with text '{link_text}' -> {next_url}")
            self.fetch_page(next_url)
        else:
            self.action_log.append(f"No link found with text '{link_text}'")

    def input_text(self, name: str, value: str) -> None:
        """Simulate entering text into an input field. Logs the action."""
        if not self.soup:
            raise RuntimeError("No page loaded. Call fetch_page() first.")
        input_tag = self.soup.find('input', attrs={'name': name})
        if input_tag:
            self.action_log.append(f"Inputting '{value}' into field '{name}' (not submitted)")
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
