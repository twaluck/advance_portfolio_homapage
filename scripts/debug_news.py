
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

# Load env from root
load_dotenv()

try:
    from backend.news_service import fetch_and_save_digest
except ImportError as e:
    print(f"Import Error: {e}")
    print("Ensure you are running this from the project root.")
    sys.exit(1)

print(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}")

print("Attempting to fetch and save digest...")
try:
    result = fetch_and_save_digest()
    if result:
        print("Success!")
        print(result)
    else:
        print("Failed: fetch_and_save_digest returned None.")
except Exception as e:
    print(f"Exception occurred: {e}")
    import traceback
    traceback.print_exc()
