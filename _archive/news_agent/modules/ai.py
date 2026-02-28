from openai import OpenAI
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def summarize_news(news_data):
    """
    Summarizes the news data into a Japanese newsletter format using GPT-4.
    """
    if not client.api_key:
        logger.error("OpenAI API Key not found!")
        return "Error: No API Key"

    # Prepare context
    content = "Latest News:\n"
    for category, articles in news_data.items():
        content += f"\n## {category}\n"
        for art in articles:
            content += f"- {art['title']}: {art['summary'][:200]}...\n"

    prompt = """
    You are a professional editor for a Japanese tech and world news digest.
    Your task is to summarize the provided news articles into a concise, engaging daily report in JAPANESE.
    
    Structure:
    1. 📰 **Headline** (Catchy title for today's summary)
    2. 💡 **Tech Trends** (Summarize key tech stories)
    3. 🌍 **Global Updates** (Summarize key world stories)
    4. 🖊️ **Editor's Note** (One sentence closing thought)
    
    Requirements:
    - Language: Japanese (Natural, Professional, "Desu/Masu" style).
    - Format: Use emojis and bullet points.
    - Keep it under 600 words.
    """

    try:
        logger.info("Sending news to GPT-4 for summarization...")
        response = client.chat.completions.create(
            model="gpt-4", # Or gpt-4o, gpt-4-turbo
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": content}
            ],
            temperature=0.7
        )
        summary = response.choices[0].message.content
        logger.info("Summarization complete.")
        return summary
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return "Error creating summary."

def generate_image(summary_text):
    """
    Generates an image based on the summary using DALL-E 3.
    Returns the image URL.
    """
    if not client.api_key:
        return None

    try:
        # First, extract a prompt idea from the summary (optional, but cheaper to just construct one)
        # We will use a generic prompt + the main headline idea if possible.
        # For simplicity/speed, we'll ask GPT to generate a prompt or just use a style.
        
        image_prompt = f"A futuristic, high-tech editorial illustration describing the main theme of this news: Tech and World events. Style: Minimalist vector art, isometric, vibrant colors, professional media style."
        
        logger.info("Generating image with DALL-E 3...")
        response = client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        
        image_url = response.data[0].url
        logger.info("Image generated successfully.")
        return image_url
        
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        return None
