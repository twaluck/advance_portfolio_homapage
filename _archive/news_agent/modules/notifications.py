import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

def send_telegram_message(token, chat_id, text, image_url=None):
    """
    Sends a message to Telegram. If image_url is provided, sends a photo with caption.
    """
    if not token or not chat_id:
        logger.warning("Telegram credentials missing. Skipping.")
        return

    try:
        if image_url:
            url = f"https://api.telegram.org/bot{token}/sendPhoto"
            payload = {
                'chat_id': chat_id,
                'photo': image_url,
                'caption': text[:1024], # Telegram caption limit
                'parse_mode': 'Markdown'
            }
            # If text is too long, we might need to split it. 
            # For now, if text > 1024, we send photo first, then text.
            if len(text) > 1020:
                payload['caption'] = text[:1000] + "..."
                requests.post(url, data=payload)
                # Send the rest as text
                send_telegram_text(token, chat_id, text)
            else:
                requests.post(url, data=payload)
        else:
            send_telegram_text(token, chat_id, text)
            
        logger.info("Telegram message sent.")
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}")

def send_telegram_text(token, chat_id, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        # 'parse_mode': 'Markdown' # Optional, be careful with special chars
    }
    requests.post(url, data=payload)

def send_email(user, password, recipient, subject, body_html):
    """
    Sends an HTML email via Gmail SMTP.
    """
    if not user or not password or not recipient:
        logger.warning("Email credentials missing. Skipping.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = user
        msg['To'] = recipient
        msg['Subject'] = subject

        msg.attach(MIMEText(body_html, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(user, password)
        text = msg.as_string()
        server.sendmail(user, recipient, text)
        server.quit()
        
        logger.info(f"Email sent to {recipient}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
