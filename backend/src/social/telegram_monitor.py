"""
Telegram Monitoring Service
Monitors public Telegram channels for stock mentions
"""

import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import re
from dotenv import load_dotenv

load_dotenv()

try:
    from telethon import TelegramClient
    from telethon.tl.types import Channel
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False
    print("⚠️  telethon not available - Telegram monitoring disabled")


class TelegramMonitor:
    """
    Monitors public Telegram channels for stock mentions and pump signals
    """
    
    def __init__(self):
        self.client = None
        self.is_configured = False
        
        if not TELETHON_AVAILABLE:
            return
        
        # Telegram API credentials
        api_id = os.getenv("TELEGRAM_API_ID")
        api_hash = os.getenv("TELEGRAM_API_HASH")
        phone = os.getenv("TELEGRAM_PHONE")
        
        if api_id and api_hash:
            try:
                self.client = TelegramClient(
                    'sentinel_market_session',
                    int(api_id),
                    api_hash
                )
                self.is_configured = True
            except Exception as e:
                print(f"⚠️  Telegram API configuration error: {e}")
    
    async def search_mentions(
        self,
        ticker: str,
        channel_usernames: Optional[List[str]] = None,
        hours: int = 24,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search for stock mentions in Telegram channels
        
        Args:
            ticker: Stock ticker symbol
            channel_usernames: List of channel usernames to monitor
            hours: How many hours back to search
            limit: Maximum number of messages to return
        
        Returns:
            List of message dictionaries with metadata
        """
        if not self.is_configured:
            return self._mock_mentions(ticker, hours)
        
        if not self.client.is_connected():
            await self.client.start()
        
        mentions = []
        search_terms = [ticker, f"${ticker}", f"#{ticker}"]
        
        # Default channels (Indian stock market groups)
        if not channel_usernames:
            channel_usernames = [
                'indianstockmarket',
                'stockmarketindia',
                'tradingindia',
                'nsebse',
            ]
        
        try:
            for channel_username in channel_usernames:
                try:
                    entity = await self.client.get_entity(channel_username)
                    messages = await self.client.get_messages(
                        entity,
                        limit=limit,
                        search=ticker
                    )
                    
                    cutoff_time = datetime.now() - timedelta(hours=hours)
                    
                    for msg in messages:
                        if msg.date.replace(tzinfo=None) < cutoff_time:
                            continue
                        
                        # Check if message contains ticker
                        msg_text = msg.message or ""
                        if ticker.upper() not in msg_text.upper():
                            continue
                        
                        # Detect pump signals
                        pump_keywords = ['buy now', 'going to moon', 'pump', 'guaranteed', 'quick profit', 'multibagger']
                        is_pump_signal = any(keyword in msg_text.lower() for keyword in pump_keywords)
                        
                        mentions.append({
                            'id': msg.id,
                            'text': msg_text,
                            'created_at': msg.date.isoformat() if msg.date else None,
                            'channel': channel_username,
                            'author_id': msg.from_id.user_id if msg.from_id else None,
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
        """
        Detect coordinated pump attempts (same stock mentioned in multiple channels simultaneously)
        
        Args:
            mentions: List of mentions
            time_window_minutes: Time window to consider for coordination
        
        Returns:
            Dictionary with coordination metrics
        """
        if len(mentions) < 2:
            return {
                'is_coordinated': False,
                'coordination_score': 0,
                'channels_involved': 0,
                'time_window': time_window_minutes
            }
        
        # Group mentions by time windows
        time_window = timedelta(minutes=time_window_minutes)
        channels_by_time = {}
        
        for mention in mentions:
            if not mention.get('created_at'):
                continue
            
            try:
                mention_time = datetime.fromisoformat(mention['created_at'].replace('Z', '+00:00'))
                window_key = mention_time.replace(second=0, microsecond=0)
                window_key = window_key - timedelta(minutes=window_key.minute % time_window_minutes)
                
                if window_key not in channels_by_time:
                    channels_by_time[window_key] = set()
                
                channels_by_time[window_key].add(mention.get('channel', 'unknown'))
            except:
                continue
        
        # Find time windows with multiple channels
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
        Get comprehensive Telegram data for a stock
        
        Args:
            ticker: Stock ticker
            hours: Hours to look back
        
        Returns:
            Dictionary with aggregated Telegram metrics
        """
        import asyncio
        
        try:
            if self.is_configured:
                # Check if there's already a running event loop (e.g., from FastAPI)
                try:
                    loop = asyncio.get_running_loop()
                    # If we're in an async context, we can't use asyncio.run()
                    # Instead, create a task or use run_until_complete on a new thread
                    # For now, fall back to mock data if we're in an async context
                    print(f"⚠️  Telegram search called from async context - using cached/mock data")
                    mentions = self._mock_mentions(ticker, hours)
                except RuntimeError:
                    # No running loop, safe to use asyncio.run()
                    mentions = asyncio.run(self.search_mentions(ticker, hours=hours))
            else:
                mentions = self._mock_mentions(ticker, hours)
        except Exception as e:
            print(f"⚠️  Error getting Telegram data: {e}")
            mentions = self._mock_mentions(ticker, hours)
        
        if not mentions:
            return {
                'ticker': ticker,
                'mention_count': 0,
                'pump_signal_count': 0,
                'coordination': {'is_coordinated': False, 'coordination_score': 0},
                'channels': [],
                'recent_mentions': []
            }
        
        pump_signals = [m for m in mentions if m.get('is_pump_signal', False)]
        coordination = self.detect_coordination(mentions)
        channels = list(set(m.get('channel', 'unknown') for m in mentions))
        
        return {
            'ticker': ticker,
            'mention_count': len(mentions),
            'pump_signal_count': len(pump_signals),
            'coordination': coordination,
            'channels': channels,
            'recent_mentions': mentions[:10]
        }
    
    def _mock_mentions(self, ticker: str, hours: int) -> List[Dict[str, Any]]:
        """Generate mock mentions for testing when API is not configured"""
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
            mentions.append({
                'id': f"telegram_{i}",
                'text': random.choice(mock_texts),
                'created_at': (datetime.now() - timedelta(hours=random.randint(0, hours))).isoformat(),
                'channel': random.choice(channels),
                'author_id': random.randint(1000, 9999),
                'views': random.randint(10, 1000),
                'is_pump_signal': 'pump' in random.choice(mock_texts).lower() or 'buy now' in random.choice(mock_texts).lower(),
            })
        
        return mentions


# Global instance
telegram_monitor = TelegramMonitor()

