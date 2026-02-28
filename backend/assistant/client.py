from openai import OpenAI
client = OpenAI(
 api_key ="REDACTED_OPENAI_API_KEY",
)
completion = client.chat.completions.create(
    model ="gpt-3.5-turbo",
    messages=[
        {"role":"system","content":"you are a virtual assitance named jarvis skilled in educational and general tasks like chatgpt and google cloud"},
        {"role":"user","content":"cybersucerity and ethical hacking"}
]
)
print(completion.choices[0].message.content)