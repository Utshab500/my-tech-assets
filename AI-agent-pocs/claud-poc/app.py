from langchain_anthropic import ChatAnthropic
from dotenv import load_dotenv
import os

load_dotenv()

# Set your Anthropic API key as an environment variable: ANTHROPIC_API_KEY
# You can also pass it directly to ChatAnthropic(api_key="...")

# Choose your model via env var ANTHROPIC_MODEL if needed.
# Default is set to an ID that is available for this API key.
model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
model = ChatAnthropic(model=model_name)

def get_completion(prompt, system_prompt=''):
    system_prompt = "You are an accountant."
    messages = [
        {
            "role":"system",
            "content": system_prompt
        },
        {
            "role": "user", 
            "content": prompt
        }
    ]

    # Call the model
    response = model.invoke(
        messages,
        temperature=0.0,
        max_tokens=200,
        top_p=1
    )
    return response.content

# Example usage
prompt = "How much is the tax on a $1000 purchase?"
# prompt = "Hello, Claude!"
print(get_completion(prompt))