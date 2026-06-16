import logging
import os
import feedparser
from openai import OpenAI
from database import get_connection

# Configure logging
logger = logging.getLogger(__name__)

# List of RSS feeds to fetch
FEEDS = {
    'Tech': [
        'https://feeds.feedburner.com/TechCrunch/', # TechCrunch
        'https://news.ycombinator.com/rss',       # Hacker News
        'https://www.theverge.com/rss/index.xml'  # The Verge
    ],
    'World': [
        'http://feeds.bbci.co.uk/news/world/rss.xml', # BBC World
        'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' # NYT World
    ]
}

def get_latest_news():
    """
    Fetches the latest news from the defined RSS feeds.
    Returns a dictionary with 'Tech' and 'World' lists of articles.
    Each article is a dict: {title, link, summary, published}
    """
    news_data = {'Tech': [], 'World': []}
    
    for category, urls in FEEDS.items():
        logger.info(f"Fetching {category} news...")
        for url in urls:
            try:
                feed = feedparser.parse(url)
                logger.info(f"Parsed {url}: found {len(feed.entries)} entries")
                
                # Take top 3 articles from each feed to avoid overload
                for entry in feed.entries[:3]:
                    article = {
                        'title': entry.get('title', 'No Title'),
                        'link': entry.get('link', ''),
                        'summary': entry.get('summary', '') or entry.get('description', ''),
                        'published': entry.get('published', '')
                    }
                    news_data[category].append(article)
                    
            except Exception as e:
                logger.error(f"Failed to fetch {url}: {e}")
                
    return news_data

def summarize_news(news_data):
    """
    Summarizes the news data into a Japanese newsletter format using GPT-4.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OpenAI API Key not found!")
        return "Error: No API Key"

    client = OpenAI(api_key=api_key)

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
            model="gpt-4o", 
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
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
        
    client = OpenAI(api_key=api_key)

    try:
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

def fetch_and_save_digest():
    """
    Orchestrates the fetch, summarize, and save process.
    Returns the new digest dict.
    """
    # 1. Fetch
    logger.info("Starting News Job...")
    news_data = get_latest_news()
    if not news_data['Tech'] and not news_data['World']:
        return None

    # 2. Summarize
    summary = summarize_news(news_data)
    if "Error" in summary:
        return None
        
    # 3. Generate Image
    image_url = generate_image(summary)
    
    # 4. Save to DB
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO news_digests (summary, image_url)
            VALUES (?, ?)
            """,
            (summary, image_url)
        )
        new_id = cursor.lastrowid
        
        row = connection.execute(
            "SELECT id, summary, image_url, created_at FROM news_digests WHERE id = ?",
            (new_id,)
        ).fetchone()
        
    return {
        "id": row["id"],
        "summary": row["summary"],
        "image_url": row["image_url"],
        "created_at": row["created_at"]
    }

def get_latest_digest():
    """
    Retrieves the most recent digest from the DB.
    """
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, summary, image_url, created_at 
            FROM news_digests 
            ORDER BY id DESC LIMIT 1
            """
        ).fetchone()
        
    if not row:
        return None
        
    return {
        "id": row["id"],
        "summary": row["summary"],
        "image_url": row["image_url"],
        "created_at": row["created_at"]
    }
