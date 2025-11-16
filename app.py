from agent import Agent


def main():
    """Entry point for running the demo"""
    agent = Agent('sample_page.html')
    agent.run_demo()


if __name__ == '__main__':
    main()
