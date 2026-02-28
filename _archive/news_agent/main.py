import time
import schedule
import argparse
import logging
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
import html
import uuid
import requests

from modules.news import get_latest_news
from modules.ai import summarize_news, generate_image
from modules.notifications import send_telegram_message, send_email  # 既存を使う（下で推奨改修も書く）

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("news_agent.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path("outputs")
OUTPUT_DIR.mkdir(exist_ok=True)

def _save_image_any(image_result) -> Path | None:
    """
    Accept image_result as:
      - URL (str starting with http)
      - local path (str or Path)
      - bytes
      - dict like {"url": "..."} or {"path": "..."} or {"bytes": b"..."}
    Save into outputs/ as PNG/JPG and return Path.
    """
    if not image_result:
        return None

    # dict case
    if isinstance(image_result, dict):
        if image_result.get("path"):
            p = Path(image_result["path"])
            return p if p.exists() else None
        if image_result.get("url"):
            image_result = image_result["url"]
        elif image_result.get("bytes"):
            image_result = image_result["bytes"]

    # bytes case
    if isinstance(image_result, (bytes, bytearray)):
        filename = OUTPUT_DIR / f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.png"
        filename.write_bytes(image_result)
        return filename

    # str/path case
    if isinstance(image_result, (str, Path)):
        s = str(image_result)

        # URL -> download
        if s.startswith("http://") or s.startswith("https://"):
            try:
                r = requests.get(s, timeout=30)
                r.raise_for_status()
                # try infer extension
                ext = ".png"
                ct = r.headers.get("Content-Type", "").lower()
                if "jpeg" in ct or "jpg" in ct:
                    ext = ".jpg"
                elif "webp" in ct:
                    ext = ".webp"

                filename = OUTPUT_DIR / f"news_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}{ext}"
                filename.write_bytes(r.content)
                return filename
            except Exception as e:
                logger.warning(f"Failed to download image URL: {e}")
                return None

        # local path
        p = Path(s)
        return p if p.exists() else None

    return None


def job():
    logger.info("Starting Daily News Job...")

    # 1) Fetch
    news_data = get_latest_news()
    if not news_data.get("Tech") and not news_data.get("World"):
        logger.warning("No news found. Aborting.")
        return

    # 2) Summarize
    summary = summarize_news(news_data)
    if not summary or (isinstance(summary, str) and summary.strip().lower().startswith("error")):
        logger.error("Summarization failed. Aborting.")
        return
    logger.info(f"Summary generated ({len(summary)} chars).")

    # 3) Generate Image
    image_result = None
    image_path = None
    try:
        image_result = generate_image(summary)
        image_path = _save_image_any(image_result)
        if image_path:
            logger.info(f"Image ready: {image_path} ({image_path.stat().st_size} bytes)")
        else:
            logger.warning("Image generation returned no usable image. Continue without image.")
    except Exception as e:
        logger.exception(f"Image generation failed: {e}")

    # Load credentials
    tg_token = os.getenv("TELEGRAM_BOT_TOKEN")
    tg_chat_id = os.getenv("TELEGRAM_CHAT_ID")

    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_APP_PASSWORD")
    email_to = os.getenv("EMAIL_RECIPIENT")

    # 4) Notify
    # Telegram: 画像があれば「画像付き」、なければテキストのみ
    if tg_token and tg_chat_id:
        try:
            # modules側が「image_url前提」なら、image_pathがある場合はfile送信に改修するのが理想
            send_telegram_message(tg_token, tg_chat_id, summary, image_path=image_path)
        except TypeError:
            # 互換性のため：既存関数が image_url 引数しか受けない場合
            send_telegram_message(tg_token, tg_chat_id, summary, str(image_path) if image_path else None)
    else:
        logger.warning("Telegram credentials not set.")

    # Email: 画像はCID埋め込みが一番確実（外部URL依存しない）
    if gmail_user and gmail_pass and email_to:
        safe_summary_html = html.escape(summary).replace("\n", "<br>")
        try:
            if image_path:
                # modules側で cid_image_path を受け取れるようにするのがおすすめ
                html_body = f"""
                <html><body>
                  <h2>Daily News Digest</h2>
                  <img src="cid:news_image" width="600"><br>
                  <p>{safe_summary_html}</p>
                </body></html>
                """
                send_email(
                    gmail_user, gmail_pass, email_to,
                    "Daily Verified News Digest",
                    html_body,
                    cid_image_path=image_path,  # send_email側の改修ポイント（下に例）
                    cid_name="news_image"
                )
            else:
                html_body = f"""
                <html><body>
                  <h2>Daily News Digest</h2>
                  <p>{safe_summary_html}</p>
                </body></html>
                """
                send_email(gmail_user, gmail_pass, email_to, "Daily Verified News Digest", html_body)
        except TypeError:
            # 互換性のため：既存send_emailが画像CIDを受けない場合は、とりあえずURL方式にフォールバック
            image_url = image_result if isinstance(image_result, str) else ""
            html_body = f"<html><body><h2>Daily News Digest</h2>"
            if image_url.startswith("http"):
                html_body += f"<img src='{html.escape(image_url)}' width='600'><br>"
            html_body += f"<p>{safe_summary_html}</p></body></html>"
            send_email(gmail_user, gmail_pass, email_to, "Daily Verified News Digest", html_body)
    else:
        logger.warning("Email credentials not set.")

    logger.info("Job finished successfully.")


if __name__ == "__main__":
    load_dotenv()

    parser = argparse.ArgumentParser(description="Automated News Agent")
    parser.add_argument("--run-now", action="store_true", help="Run the job immediately and exit")
    parser.add_argument("--time", default="07:00", help="Daily run time (HH:MM), default 07:00")
    args = parser.parse_args()

    if args.run_now:
        job()
    else:
        logger.info(f"Scheduler started. Waiting for {args.time}...")
        schedule.every().day.at(args.time).do(job)

        while True:
            schedule.run_pending()
            time.sleep(60)