from bs4 import BeautifulSoup

class Agent:
    def __init__(self, html_file):
        self.html_file = html_file
        self.soup = None

    def load_page(self):
        """Load the HTML page into BeautifulSoup"""
        with open(self.html_file, 'r', encoding='utf-8') as f:
            self.soup = BeautifulSoup(f, 'html.parser')

    def find_element_by_text(self, text):
        """Find the first element containing the given text"""
        return self.soup.find(lambda tag: tag.string and text in tag.string)

    def click_element(self, element):
        """Simulate clicking an element by printing an action"""
        if element:
            print(f"Clicked element: <{element.name}> with text '{element.get_text(strip=True)}'")
        else:
            print("Element not found to click")

    def input_text(self, input_name, text):
        """Simulate typing text into an input field"""
        input_tag = self.soup.find('input', attrs={'name': input_name})
        if input_tag:
            print(f"Inputting '{text}' into field '{input_name}'")
        else:
            print(f"Input field '{input_name}' not found")

    def run_demo(self):
        """Run a demonstration sequence of interactions"""
        self.load_page()
        # Example actions: fill a username and click a submit button
        self.input_text('username', 'test_user')
        button = self.find_element_by_text('Submit')
        self.click_element(button)

if __name__ == '__main__':
    agent = Agent('sample_page.html')
    agent.run_demo()
