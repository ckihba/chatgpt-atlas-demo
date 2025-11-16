from playwright_agent import PlaywrightAgent
import asyncio

async def main():
    """Entry point for running the Playwright demo and generating narration"""
    agent = PlaywrightAgent()
    await agent.setup()
    logs = await agent.run_demo()
    script = agent.generate_narration_script()
    print("Actions:", logs)
    print("Narration script:", script)
    # Try to generate voiceover using OpenAI TTS
    try:
        audio_file = agent.generate_voiceover(script)
        print(f"Voiceover generated in {audio_file}")
    except Exception as e:
        print(f"Voiceover generation failed: {e}")
    await agent.close()

if __name__ == "__main__":
    asyncio.run(main())
