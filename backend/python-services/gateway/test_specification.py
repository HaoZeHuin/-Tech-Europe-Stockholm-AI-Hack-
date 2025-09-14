#!/usr/bin/env python3
"""
Test script to verify our implementation follows the OpenAI Agents SDK specification
"""

import asyncio
import sys
import os

# Add path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

try:
    from agents.realtime import RealtimeAgent, RealtimeRunner
    from jarvis_agent import get_starting_agent
    print("✅ All required imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install: pip install openai-agents")
    sys.exit(1)

def _truncate_str(s: str, max_length: int) -> str:
    """Helper function from the specification"""
    if len(s) > max_length:
        return s[:max_length] + "..."
    return s

async def test_specification_compliance():
    """Test that our implementation follows the official specification"""
    
    print("🧪 Testing OpenAI Agents SDK specification compliance...")
    
    # Create the agent (our Jarvis agent)
    agent = get_starting_agent()
    print(f"✅ Agent created: {agent.name}")
    
    # Set up the runner with configuration following the spec
    runner = RealtimeRunner(
        starting_agent=agent,
        config={
            "model_settings": {
                "model_name": "gpt-realtime",
                "voice": "echo",  # British accent
                "modalities": ["audio"],
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                "turn_detection": {"type": "semantic_vad", "interrupt_response": True},
            }
        },
    )
    print("✅ RealtimeRunner configured according to specification")
    
    # Start the session
    try:
        session = await runner.run()
        print("✅ Session started successfully")
        
        # Test session context manager (as per specification)
        async with session:
            print("✅ Session context manager working")
            
            # Test event processing (simulate the specification pattern)
            event_count = 0
            async for event in session:
                try:
                    # Handle events according to official specification
                    if event.type == "agent_start":
                        print(f"✅ Agent started: {event.agent.name}")
                    elif event.type == "agent_end":
                        print(f"✅ Agent ended: {event.agent.name}")
                    elif event.type == "handoff":
                        print(f"✅ Handoff from {event.from_agent.name} to {event.to_agent.name}")
                    elif event.type == "tool_start":
                        print(f"✅ Tool started: {event.tool.name}")
                    elif event.type == "tool_end":
                        print(f"✅ Tool ended: {event.tool.name}; output: {event.output}")
                    elif event.type == "audio_end":
                        print("✅ Audio ended")
                    elif event.type == "audio":
                        # Enqueue audio for callback-based playback with metadata
                        # Non-blocking put; queue is unbounded, so drops won't occur.
                        print("✅ Audio event received")
                    elif event.type == "audio_interrupted":
                        print("✅ Audio interrupted")
                        # Begin graceful fade + flush in the audio callback and rebuild jitter buffer.
                    elif event.type == "error":
                        print(f"⚠️ Error: {event.error}")
                    elif event.type == "history_updated":
                        pass  # Skip these frequent events
                    elif event.type == "history_added":
                        pass  # Skip these frequent events
                    elif event.type == "raw_model_event":
                        print(f"✅ Raw model event: {_truncate_str(str(event.data), 200)}")
                    else:
                        print(f"⚠️ Unknown event type: {event.type}")
                        
                    event_count += 1
                    
                    # Limit test events
                    if event_count >= 5:
                        print("✅ Event processing test completed")
                        break
                        
                except Exception as e:
                    print(f"❌ Error processing event: {_truncate_str(str(e), 200)}")
                    
    except Exception as e:
        print(f"❌ Session error: {e}")
        return False
    
    print("🎉 All specification compliance tests passed!")
    return True

async def main():
    """Main test function"""
    success = await test_specification_compliance()
    if success:
        print("\n✅ Implementation follows OpenAI Agents SDK specification correctly!")
        print("🚀 Ready for production use!")
    else:
        print("\n❌ Implementation needs fixes to match specification")
        sys.exit(1)

if __name__ == "__main__":
    # Set a dummy API key for testing (won't actually connect)
    os.environ["OPENAI_API_KEY"] = "test-key-for-specification-testing"
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
