from openai import OpenAI
import os

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(
    api_key=api_key,
)
completion = client.chat.completions.create(
    model ="gpt-3.5-turbo",
    messages=[
        {"role":"system","content":"you are a virtual assitance named jarvis skilled in educational and general tasks like chatgpt and google cloud"},
        {"role":"user","content":"cybersucerity and ethical hacking"}
]
)
print(completion.choices[0].message.content)
