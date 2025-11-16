from voice_agent import Agent

def main():
    """Entry point for running the demo and generating narration"""
    agent = Agent('sample_page.html')
    logs = agent.run_demo()
    script = agent.generate_narration_script()
    print("Actions:", logs)
    print("Narration script:", script)
    # Try to generate voiceover using OpenAI TTS
    try:
        audio_file = agent.generate_voiceover(script)
        print(f"Voiceover generated in {audio_file}")
    except Exception as e:
        print(f"Voiceover generation failed: {e}")

if __name__ == '__main__':
    main()
