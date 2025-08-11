import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {'Yes' if api_key else 'No'}")

if not api_key:
    print("ERROR: GROQ_API_KEY not found in environment variables!")
    print("Please check your .env file.")
    exit(1)

client = Groq(api_key=api_key)
print("Groq client initialized successfully")

try:
    print("Making simple text API call to Groq...")
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": "Hello! Can you tell me what 2+2 equals?"
            }
        ],
        temperature=0.7,
        max_completion_tokens=100,
        top_p=1,
        stream=False,
        stop=None,
    )

    print("API call successful!")
    print("Response:")
    print(completion.choices[0].message.content)
    
except Exception as e:
    print(f"Error calling Groq API: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
