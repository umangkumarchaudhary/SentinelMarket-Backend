"""
Telegram Monitoring Service
Monitors public Telegram channels for stock mentions
"""

import os
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import re
from dotenv import load_dotenv

load_dotenv()

try:
    from telethon import TelegramClient
    from telethon.sessions import StringSession
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False
    print("⚠️  telethon not available - Telegram monitoring disabled")


class TelegramMonitor:
    """
    Monitors public Telegram channels for stock mentions and pump signals.
    Includes a background poller that keeps a hot cache for realtime endpoints.
    """
    
    def __init__(self):
        self.client = None
        self.is_configured = False
        self.poll_task: Optional[asyncio.Task] = None
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.seen_message_ids = set()
        self.last_poll: Optional[datetime] = None
        
        # Defaults that can be overridden via env
        self.poll_interval = int(os.getenv("TELEGRAM_POLL_INTERVAL_SEC", "90"))
        self.max_messages = int(os.getenv("TELEGRAM_MAX_MESSAGES", "200"))
        self.lookback_hours = int(os.getenv("TELEGRAM_LOOKBACK_HOURS", "24"))
        channels_env = os.getenv("TELEGRAM_CHANNELS")
        self.default_channels = (
            [c.strip() for c in channels_env.split(",") if c.strip()]
            if channels_env else [
                "indianstockmarket",
                "stockmarketindia",
                "tradingindia",
                "nsebse",
            ]
        )
        
        if not TELETHON_AVAILABLE:
            return
        
        # Telegram API credentials
        api_id = os.getenv("TELEGRAM_API_ID")
        api_hash = os.getenv("TELEGRAM_API_HASH")
        session_str = os.getenv("TELEGRAM_SESSION_STRING")
        phone = os.getenv("TELEGRAM_PHONE")
        
        if api_id and api_hash:
            try:
                # Prefer session string (no runtime login)
                session = StringSession(session_str) if session_str else "sentinel_market_session"
                self.client = TelegramClient(session, int(api_id), api_hash)
                self.phone = phone
                self.is_configured = True
            except Exception as e:
                print(f"⚠️  Telegram API configuration error: {e}")
    
    async def _ensure_client(self):
        if not self.is_configured:
            return False
        if not self.client.is_connected():
            try:
                await self.client.start(phone=self.phone)
            except Exception as e:
                print(f"⚠️  Telegram connect error: {e}")
                return False
        return True
    
    async def search_mentions(
        self,
        ticker: str,
        channel_usernames: Optional[List[str]] = None,
        hours: int = 24,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Ad-hoc search for a ticker (used as fallback)."""
        if not await self._ensure_client():
            return self._mock_mentions(ticker, hours)
        
        mentions = []
        
        if not channel_usernames:
            channel_usernames = self.default_channels
        
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            for channel_username in channel_usernames:
                try:
                    entity = await self.client.get_entity(channel_username)
                    messages = await self.client.get_messages(
                        entity,
                        limit=limit,
                        search=ticker
                    )
                    
                    for msg in messages:
                        if not msg or not msg.date:
                            continue
                        if msg.date.replace(tzinfo=None) < cutoff_time:
                            continue
                        
                        msg_text = msg.message or ""
                        if ticker.upper() not in msg_text.upper():
                            continue
                        
                        pump_keywords = ['target', 'entry', 'exit', 'sl', 'stoploss', 'pump', 'circuit', 'upper', 'quick profit']
                        is_pump_signal = any(keyword in msg_text.lower() for keyword in pump_keywords)
                        
                        mentions.append({
                            'id': msg.id,
                            'text': msg_text,
                            'created_at': msg.date.isoformat() if msg.date else None,
                            'channel': channel_username,
                            'author_id': getattr(msg.from_id, "user_id", None) if msg.from_id else None,
                            'views': msg.views or 0,
                            'is_pump_signal': is_pump_signal,
                        })
                except Exception as e:
                    print(f"⚠️  Error searching channel {channel_username}: {e}")
                    continue
        except Exception as e:
            print(f"⚠️  Telegram search error: {e}")
            return self._mock_mentions(ticker, hours)
        
        return mentions[:limit]
    
    def detect_coordination(
        self,
        mentions: List[Dict[str, Any]],
        time_window_minutes: int = 30
    ) -> Dict[str, Any]:
        """Detect coordinated pump attempts across channels in a short window."""
        if len(mentions) < 2:
            return {
                'is_coordinated': False,
                'coordination_score': 0,
                'channels_involved': 0,
                'time_window': time_window_minutes
            }
        
        time_window = timedelta(minutes=time_window_minutes)
        channels_by_time = {}
        
        for mention in mentions:
            if not mention.get('created_at'):
                continue
            try:
                mention_time = datetime.fromisoformat(mention['created_at'].replace('Z', '+00:00'))
                window_key = mention_time.replace(second=0, microsecond=0)
                window_key = window_key - timedelta(minutes=window_key.minute % time_window_minutes)
                channels_by_time.setdefault(window_key, set()).add(mention.get('channel', 'unknown'))
            except Exception:
                continue
        
        coordinated_windows = [
            (time, channels) for time, channels in channels_by_time.items()
            if len(channels) >= 2
        ]
        
        if coordinated_windows:
            max_channels = max(len(channels) for _, channels in coordinated_windows)
            coordination_score = min((max_channels / 5) * 100, 100)  # 5 channels = 100
            
            return {
                'is_coordinated': True,
                'coordination_score': round(coordination_score, 2),
                'channels_involved': max_channels,
                'coordinated_windows': len(coordinated_windows),
                'time_window': time_window_minutes
            }
        
        return {
            'is_coordinated': False,
            'coordination_score': 0,
            'channels_involved': 0,
            'time_window': time_window_minutes
        }
    
    def get_stock_social_data(
        self,
        ticker: str,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get comprehensive Telegram data for a stock.
        Uses hot cache from the poller; falls back to an on-demand fetch or mock.
        """
        ticker_upper = ticker.upper()
        
        # Prefer cache from the background poller
        cached = self.cache.get(ticker_upper)
        if cached and cached.get("last_updated"):
            age_sec = (datetime.now() - cached["last_updated"]).total_seconds()
            # Consider cache fresh if < 10 minutes old
            if age_sec < 600:
                return cached
        
        # Fallback to an ad-hoc fetch (slow, but ensures data)
        try:
            mentions = asyncio.run(self.search_mentions(ticker_upper, hours=hours)) if self.is_configured else self._mock_mentions(ticker_upper, hours)
        except Exception as e:
            print(f"⚠️  Error getting Telegram data: {e}")
            mentions = self._mock_mentions(ticker_upper, hours)
        
        return self._build_metrics(ticker_upper, mentions)
    
    async def poll_once(self):
        """Fetch recent messages from configured channels and refresh cache."""
        if not await self._ensure_client():
            return
        
        cutoff_time = datetime.now() - timedelta(hours=self.lookback_hours)
        ticker_pattern = re.compile(r"\b[A-Z]{2,10}\b")
        pump_keywords = ['target', 'entry', 'exit', 'sl', 'stoploss', 'pump', 'circuit', 'upper', 'quick profit']
        
        messages_by_ticker: Dict[str, List[Dict[str, Any]]] = {}
        
        for channel_username in self.default_channels:
            try:
                entity = await self.client.get_entity(channel_username)
                messages = await self.client.get_messages(entity, limit=self.max_messages)
                
                for msg in messages:
                    if not msg or not msg.date:
                        continue
                    if msg.id in self.seen_message_ids:
                        continue
                    if msg.date.replace(tzinfo=None) < cutoff_time:
                        continue
                    
                    msg_text = msg.message or ""
                    tickers = ticker_pattern.findall(msg_text.upper())
                    if not tickers:
                        continue
                    
                    is_pump_signal = any(keyword in msg_text.lower() for keyword in pump_keywords)
                    
                    payload = {
                        'id': msg.id,
                        'text': msg_text,
                        'created_at': msg.date.isoformat() if msg.date else None,
                        'channel': channel_username,
                        'author_id': getattr(msg.from_id, "user_id", None) if msg.from_id else None,
                        'views': msg.views or 0,
                        'is_pump_signal': is_pump_signal,
                    }
                    
                    for t in tickers:
                        t_upper = t.upper()
                        messages_by_ticker.setdefault(t_upper, []).append(payload)
                    
                    self.seen_message_ids.add(msg.id)
            except Exception as e:
                print(f"⚠️  Error polling channel {channel_username}: {e}")
                continue
        
        # Build cache entries
        for ticker, mentions in messages_by_ticker.items():
            metrics = self._build_metrics(ticker, mentions)
            metrics["last_updated"] = datetime.now()
            self.cache[ticker] = metrics
        
        self.last_poll = datetime.now()
    
    def _build_metrics(self, ticker: str, mentions: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not mentions:
            return {
                'ticker': ticker,
                'mention_count': 0,
                'pump_signal_count': 0,
                'coordination': {'is_coordinated': False, 'coordination_score': 0},
                'channels': [],
                'recent_mentions': [],
                'hype_score': 0,
                'last_updated': datetime.now()
            }
        
        pump_signals = [m for m in mentions if m.get('is_pump_signal', False)]
        coordination = self.detect_coordination(mentions)
        channels = list(set(m.get('channel', 'unknown') for m in mentions))
        
        mention_count = len(mentions)
        pump_count = len(pump_signals)
        hype_score = min(mention_count * 2 + pump_count * 10 + coordination.get('coordination_score', 0) * 0.2, 100)
        
        return {
            'ticker': ticker,
            'mention_count': mention_count,
            'pump_signal_count': pump_count,
            'coordination': coordination,
            'channels': channels,
            'recent_mentions': mentions[:10],
            'hype_score': round(hype_score, 2),
            'last_updated': datetime.now()
        }
    
    async def start_polling(self):
        """Start the background polling loop."""
        if not self.is_configured:
            print("⚠️  Telegram not configured; polling skipped.")
            return
        if self.poll_task and not self.poll_task.done():
            return
        
        async def _run():
            print("🔄 Starting Telegram polling loop")
            while True:
                try:
                    await self.poll_once()
                except Exception as e:
                    print(f"⚠️  Telegram polling error: {e}")
                await asyncio.sleep(self.poll_interval)
        
        self.poll_task = asyncio.create_task(_run())
    
    def _mock_mentions(self, ticker: str, hours: int) -> List[Dict[str, Any]]:
        """Generate mock mentions for testing when API is not configured."""
        import random
        mock_texts = [
            f"🚀 {ticker} is going to the moon! Buy now!",
            f"Pump alert: {ticker} - guaranteed returns",
            f"Quick profit opportunity: {ticker}",
            f"Multibagger alert: {ticker}",
            f"Discussion about {ticker} performance",
        ]
        
        channels = ['indianstockmarket', 'stockmarketindia', 'tradingindia']
        
        mentions = []
        for i in range(random.randint(3, 15)):
            msg_text = random.choice(mock_texts)
            mentions.append({
                'id': f"telegram_{i}",
                'text': msg_text,
                'created_at': (datetime.now() - timedelta(hours=random.randint(0, hours))).isoformat(),
                'channel': random.choice(channels),
                'author_id': random.randint(1000, 9999),
                'views': random.randint(10, 1000),
                'is_pump_signal': 'pump' in msg_text.lower() or 'buy now' in msg_text.lower(),
            })
        
        return mentions


# Global instance
telegram_monitor = TelegramMonitor()

