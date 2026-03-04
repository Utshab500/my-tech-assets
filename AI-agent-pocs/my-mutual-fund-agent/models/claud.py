from langchain_anthropic import ChatAnthropic
from dotenv import load_dotenv
import os

def get_model() -> ChatAnthropic:
    """
    Returns an instance of the ChatAnthropic model.
    
    Returns:
        ChatAnthropic: An instance of the ChatAnthropic model initialized with the specified model name.
    """
    load_dotenv()

    # Set your Anthropic API key as an environment variable: ANTHROPIC_API_KEY
    # You can also pass it directly to ChatAnthropic(api_key="...")

    # Choose your model via env var ANTHROPIC_MODEL if needed.
    # Default is set to an ID that is available for this API key.
    model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
    model = ChatAnthropic(model=model_name)
    return model