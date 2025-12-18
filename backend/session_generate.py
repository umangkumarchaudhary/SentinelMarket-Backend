import os
from dotenv import load_dotenv
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

# Load .env variables
load_dotenv()

API_ID = int(os.getenv("TELEGRAM_API_ID"))
API_HASH = os.getenv("TELEGRAM_API_HASH")

if not API_ID or not API_HASH:
    raise ValueError("❌ TELEGRAM_API_ID or TELEGRAM_API_HASH not found in .env")

with TelegramClient(StringSession(), API_ID, API_HASH) as client:
    print("\n✅ TELEGRAM SESSION STRING (copy & save safely):\n")
    print(client.session.save())
