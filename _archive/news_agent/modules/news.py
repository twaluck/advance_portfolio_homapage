import feedparser
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# List of RSS feeds to fetch
feeds = {
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
    
    for category, urls in feeds.items():
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
                
    logger.info(f"Total Tech articles: {len(news_data['Tech'])}")
    logger.info(f"Total World articles: {len(news_data['World'])}")
    
    return news_data

if __name__ == "__main__":
    # Test run
    data = get_latest_news()
    for cat, articles in data.items():
        print(f"\n--- {cat} News ---")
        for i, art in enumerate(articles, 1):
            print(f"{i}. {art['title']}")
