from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os

def get_model() -> ChatGoogleGenerativeAI:
    """
    Returns an instance of the ChatGoogleGenerativeAI model.
    
    Returns:
        ChatGoogleGenerativeAI: An instance of the ChatGoogleGenerativeAI model initialized with the specified model name.

    """

    load_dotenv()

    # Set your Google API key as an environment variable: GOOGLE_API_KEY
    # gemini-1.5-pro
    # gemini-1.5-flash
    # gemini-2.0-flash
    model_name = os.getenv("GOOGLE_MODEL", "gemini-3-flash-preview")
    model = ChatGoogleGenerativeAI(model=model_name, api_key=os.getenv("GOOGLE_API_KEY"))

    return model