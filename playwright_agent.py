import os
import asyncio
from playwright.async_api import async_playwright
import openai

class PlaywrightAgent:
    def __init__(self, base_url):
        self.base_url = base_url
        self.action_log = []
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def setup(self):
        # start Playwright and browser
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()

    async def close(self):
        # close browser and playwright
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def load_page(self, url=None):
        target_url = url or self.base_url
        await self.page.goto(target_url)
        self.action_log.append(f"Loaded page: {target_url}")

    async def click_by_text(self, text):
        # click the first element matching text exactly
        locator = self.page.get_by_text(text, exact=True)
        await locator.first.click()
        self.action_log.append(f"Clicked element with text '{text}'")

    async def input_text(self, selector, text):
        await self.page.fill(selector, text)
        self.action_log.append(f"Input '{text}' into '{selector}'")

    async def run_demo(self):
        await self.setup()
        try:
            await self.load_page(self.base_url)
            # example interactions: fill username and click Submit
            try:
                await self.input_text("input[name='username']", "test_user")
            except Exception:
                pass
            try:
                await self.click_by_text('Submit')
            except Exception:
                pass
        finally:
            await self.close()
        return self.action_log

    def generate_narration_script(self):
        lines = []
        for action in self.action_log:
            if action.startswith("Loaded page"):
                url = action.split(": ", 1)[1]
                lines.append(f"I opened the page {url}.")
            elif action.startswith("Input"):
                parts = action.split("'")
                # parts example: ["Input ", text, " into ", selector, "'"]
                if len(parts) >= 4:
                    text_val = parts[1]
                    selector = parts[3]
                    lines.append(f"I entered {text_val} into the field {selector}.")
            elif action.startswith("Clicked element"):
                text_val = action.split("'",2)[1]
                lines.append(f"Then I clicked the element with text {text_val}.")
        return " ".join(lines) if lines else "The agent completed the task."

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
        with open(output_file, 'wb') as f:
            f.write(response.content)
        return output_file
