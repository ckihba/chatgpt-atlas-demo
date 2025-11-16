import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import openai

class Agent:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.action_log = []

    def fetch_page(self, url):
        if url.startswith("http"):
            response = self.session.get(url)
            response.raise_for_status()
            return response.text
        else:
            # local file
            with open(url, 'r', encoding='utf-8') as f:
                return f.read()

    def find_element_by_text(self, soup, tag, text):
        elements = soup.find_all(tag)
        for elem in elements:
            if elem.get_text(strip=True) == text:
                return elem
        return None

    def click_link(self, page_content, link_text):
        soup = BeautifulSoup(page_content, 'html.parser')
        link = self.find_element_by_text(soup, 'a', link_text)
        if link and link.get('href'):
            href = link['href']
            next_url = urljoin(self.base_url, href)
            self.action_log.append(f"Clicked link: {link_text}")
            return self.fetch_page(next_url)
        else:
            raise ValueError(f"Link with text '{link_text}' not found")

    def input_text(self, page_content, field_name, text):
        # For demonstration, we just log; no actual field update
        self.action_log.append(f"Input '{text}' into field '{field_name}'")
        return page_content

    def get_action_log(self):
        return self.action_log

    def run_demo(self):
        page = self.fetch_page(self.base_url)
        # example: input username and click
        page = self.input_text(page, 'username', 'test_user')
        # click submit button or link by text
        try:
            page = self.click_link(page, 'Submit')
        except Exception:
            pass
        return self.get_action_log()

    def generate_narration_script(self):
        lines = []
        for action in self.action_log:
            if action.startswith("Clicked link"):
                link = action.split(": ",1)[1]
                lines.append(f"Then I clicked the link labelled {link}.")
            elif action.startswith("Input"):
                part = action.split("'",2)
                text = part[1]
                rest = part[2]
                field = rest.split("'")[1]
                lines.append(f"I entered {text} into the {field} field.")
        if not lines:
            lines.append("The agent executed the steps.")
        return " ".join(lines)

    def generate_voiceover(self, script, output_file='narration.mp3'):
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set.")
        openai.api_key = api_key
        response = openai.audio.speech.create(
            model="tts-1",
            input=script,
            voice="alloy"
        )
        # save file
        with open(output_file, 'wb') as f:
            f.write(response.content)
        return output_file
