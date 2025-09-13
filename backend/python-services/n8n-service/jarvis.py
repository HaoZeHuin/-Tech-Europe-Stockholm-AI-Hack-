from dotenv import load_dotenv
import asyncio
from typing import AsyncGenerator

from openai import OpenAI
from openai.types.responses import ResponseTextDeltaEvent
from agents import Agent, Runner

SYSTEM_PROMPT = """
You are Jarvis, a helpful personal assistant build to help the user with their day to day tasks.
You have 2 main functions:
    1. Over long periods of use, build up a knowledge base of the user, empowering your ability to assist them
    2. Make use of the provided tools to interact with external services
"""

load_dotenv()

class Jarvis():
    def __init__(self):
        self.client = OpenAI()
        self.jarvis = Agent(
            name = 'jarvis',
            model = 'gpt-5',
        )

        # Initialize chat history with system prompt
        self.chat_history = self.client.conversations.create(
            items=[{
                "type": "message",
                "role": "developer",
                "content": SYSTEM_PROMPT
            }]
        )

    async def chat(self, prompt: str) -> AsyncGenerator[str, None]:
        response = Runner.run_streamed(
            starting_agent=self.jarvis,
            conversation_id=self.chat_history.id,
            input=prompt
        )

        async for event in response.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                yield event.data.delta

    async def cli_loop(self):
        while True:
            prompt = input("Enter query: ")
            if prompt == "exit":
                return
            generator = self.chat(prompt)
            async for e in generator:
                print(e, end = "", flush=True)
            print()

if __name__ == "__main__":
    jarvis = Jarvis()
    asyncio.run(jarvis.cli_loop())
        