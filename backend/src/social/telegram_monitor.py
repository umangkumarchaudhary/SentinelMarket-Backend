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
        # Hardcoded channels - user has joined these channels with their account
        # https://t.me/Stock_Gainerss_o (or Stock_Gainerss_2 - user will update)
        # https://t.me/hindustan_om_unique_traders
        # NOTE: These will be overridden on startup in main.py
        self.default_channels = ['Stock_Gainerss_o', 'hindustan_om_unique_traders']
        
        print("🔧 [TelegramMonitor] Initializing...")
        
        if not TELETHON_AVAILABLE:
            print("❌ [TelegramMonitor] Telethon not available - Telegram monitoring disabled")
            return
        
        # Telegram API credentials
        api_id = os.getenv("TELEGRAM_API_ID")
        api_hash = os.getenv("TELEGRAM_API_HASH")
        phone = os.getenv("TELEGRAM_PHONE")
        session_string = os.getenv("TELEGRAM_SESSION_STRING")
        
        print(f"📋 [TelegramMonitor] API_ID: {'✅ Set' if api_id else '❌ Missing'}")
        print(f"📋 [TelegramMonitor] API_HASH: {'✅ Set' if api_hash else '❌ Missing'}")
        print(f"📋 [TelegramMonitor] SESSION_STRING: {'✅ Set' if session_string else '❌ Missing'}")
        print(f"📋 [TelegramMonitor] Default channels: {self.default_channels}")
        
        if api_id and api_hash:
            try:
                if session_string:
                    # Use session string if available
                    print("🔐 [TelegramMonitor] Using session string authentication")
                    from telethon.sessions import StringSession
                    session = StringSession(session_string)
                    self.client = TelegramClient(session, int(api_id), api_hash)
                else:
                    # Use file-based session
                    print("📁 [TelegramMonitor] Using file-based session")
                    self.client = TelegramClient(
                        'sentinel_market_session',
                        int(api_id),
                        api_hash
                    )
                self.is_configured = True
                print("✅ [TelegramMonitor] Client initialized successfully")
            except Exception as e:
                print(f"❌ [TelegramMonitor] Configuration error: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("⚠️  [TelegramMonitor] Missing API credentials - will use mock data")
    
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
        import sys
        print(f"🚀 [TelegramMonitor] search_mentions called for ticker: {ticker}", flush=True)
        print(f"🚀 [TelegramMonitor] is_configured: {self.is_configured}", flush=True)
        print(f"🚀 [TelegramMonitor] client exists: {self.client is not None}", flush=True)
        print(f"🚀 [TelegramMonitor] default_channels: {self.default_channels}", flush=True)
        sys.stdout.flush()
        
        if not self.is_configured:
            print("⚠️  [TelegramMonitor] Not configured - returning mock data")
            return self._mock_mentions(ticker, hours)
        
        if not self.client:
            print("❌ [TelegramMonitor] Client is None - cannot search")
            return []
        
        print("🔌 [TelegramMonitor] Checking client connection...")
        try:
            if not self.client.is_connected():
                print("🔌 [TelegramMonitor] Client not connected - starting...")
                await self.client.start()
                print("✅ [TelegramMonitor] Client connected successfully")
            else:
                print("✅ [TelegramMonitor] Client already connected")
        except Exception as e:
            print(f"❌ [TelegramMonitor] Error connecting client: {e}")
            import traceback
            traceback.print_exc()
            return []
        
        mentions = []
        search_terms = [ticker, f"${ticker}", f"#{ticker}"]
        
        # ALWAYS use hardcoded default channels (ignore any passed channels)
        # These are the channels the user has joined:
        # https://t.me/Stock_Gainerss_o
        # https://t.me/hindustan_om_unique_traders
        channel_usernames = self.default_channels
        print(f"📢 [TelegramMonitor] FORCING use of hardcoded channels: {channel_usernames}")
        print(f"📢 [TelegramMonitor] Ignoring any other channel list")
        
        print(f"🔍 [TelegramMonitor] Searching for '{ticker}' in {len(channel_usernames)} channels...")
        
        try:
            for channel_username in channel_usernames:
                try:
                    print(f"  📡 [TelegramMonitor] Checking channel: @{channel_username}")
                    
                    # Try multiple formats to find the channel
                    entity = None
                    formats_to_try = [
                        f"@{channel_username}",  # With @
                        channel_username,  # Without @
                        f"https://t.me/{channel_username}",  # Full URL
                        channel_username.lower(),  # Lowercase
                        channel_username.upper(),  # Uppercase
                    ]
                    
                    for fmt in formats_to_try:
                        try:
                            print(f"    🔄 [TelegramMonitor] Trying format: {fmt}")
                            entity = await self.client.get_entity(fmt)
                            print(f"    ✅ [TelegramMonitor] Found with format: {fmt}")
                            break
                        except Exception as e:
                            print(f"    ❌ [TelegramMonitor] Failed with {fmt}: {str(e)[:50]}")
                            continue
                    
                    if not entity:
                        print(f"  ❌ [TelegramMonitor] Could not find channel @{channel_username} with any format")
                        print(f"  💡 [TelegramMonitor] TIP: Make sure you've joined this channel: https://t.me/{channel_username}")
                        print(f"  💡 [TelegramMonitor] The channel might be private or the username might be different")
                        # Try to list user's dialogs to see what channels they have access to
                        try:
                            print(f"  🔍 [TelegramMonitor] Checking your accessible channels...")
                            dialogs = await self.client.get_dialogs(limit=20)
                            channel_names = [d.name for d in dialogs if hasattr(d.entity, 'username') and d.entity.username]
                            print(f"  📋 [TelegramMonitor] You have access to {len(channel_names)} channels with usernames")
                            if channel_names:
                                print(f"  📋 [TelegramMonitor] Sample channels: {channel_names[:5]}")
                        except Exception as e:
                            print(f"  ⚠️  [TelegramMonitor] Could not list dialogs: {str(e)[:50]}")
                        continue
                    
                    channel_title = entity.title if hasattr(entity, 'title') else channel_username
                    print(f"  ✅ [TelegramMonitor] Found channel: {channel_title} (ID: {entity.id})")
                    
                    # Get recent messages from the channel
                    # NOTE: These channels share trading signals via images, not text mentions
                    # So we'll get recent messages regardless of ticker mentions
                    cutoff_time = datetime.now() - timedelta(hours=hours)
                    print(f"  ⏰ [TelegramMonitor] Looking for messages after: {cutoff_time}")
                    
                    # Get recent messages (channels share images/screenshots, not text mentions)
                    all_recent_messages = await self.client.get_messages(
                        entity,
                        limit=limit
                    )
                    print(f"  📨 [TelegramMonitor] Found {len(all_recent_messages)} recent messages in @{channel_username}")
                    
                    matching_count = 0
                    for msg in all_recent_messages:
                        # Check message age
                        if msg.date.replace(tzinfo=None) < cutoff_time:
                            continue
                        
                        msg_text = msg.message or ""
                        
                        # Check if message contains ticker (exact match or with $/#)
                        contains_ticker = (
                            ticker.upper() in msg_text.upper() or
                            f"${ticker.upper()}" in msg_text.upper() or
                            f"#{ticker.upper()}" in msg_text.upper()
                        )
                        
                        # Even if no ticker mention, include if it's trading-related and recent
                        # (channels share signals via images, so text might not have ticker)
                        is_trading_related = False
                        if not contains_ticker:
                            trading_keywords = [
                                'stock', 'trade', 'buy', 'sell', 'equity', 'nse', 'bse',
                                'profit', 'loss', 'signal', 'call', 'target', 'stop loss',
                                'premium', 'multibagger', 'intraday', 'swing', 'position'
                            ]
                            msg_lower = msg_text.lower()
                            is_trading_related = any(kw in msg_lower for kw in trading_keywords)
                            
                            # Only include trading-related messages from last 12 hours
                            msg_age = (datetime.now() - msg.date.replace(tzinfo=None)).total_seconds() / 3600
                            if msg_age > 12:
                                continue
                        
                        # Include if it mentions ticker OR is trading-related
                        if contains_ticker or is_trading_related:
                            # Check if message has media (image/screenshot)
                            has_media = msg.media is not None
                            media_type = None
                            if has_media:
                                media_type = type(msg.media).__name__
                            
                            # Split long messages that might contain multiple stock mentions
                            # Look for patterns like "---" or multiple tickers/newlines
                            message_parts = []
                            if len(msg_text) > 200 and ('---' in msg_text or '\n\n' in msg_text):
                                # Try to split by double newlines or section markers
                                parts = re.split(r'\n\n+|---+', msg_text)
                                for part in parts:
                                    part = part.strip()
                                    if part and (ticker.upper() in part.upper() or any(kw in part.lower() for kw in trading_keywords)):
                                        message_parts.append(part)
                            
                            # If no splits found, use original message
                            if not message_parts:
                                message_parts = [msg_text]
                            
                            # Create a mention for each relevant part
                            for part_text in message_parts:
                                # Check if this part mentions the ticker
                                part_contains_ticker = ticker.upper() in part_text.upper()
                                
                                # Only include if it mentions ticker OR is very recent trading-related
                                if part_contains_ticker or (is_trading_related and msg_age < 6):
                                    matching_count += 1
                                    
                                    print(f"    ✓ [TelegramMonitor] Message #{matching_count} in @{channel_username}: {part_text[:60]}... [Media: {has_media}]")
                                    
                                    # Detect pump signals (common in trading channels)
                                    pump_keywords = [
                                        'buy now', 'going to moon', 'pump', 'guaranteed', 'quick profit',
                                        'multibagger', 'premium', 'join', 'fee', '2995', '10k', 'last day',
                                        'offer', 'hurry', 'don\'t miss', 'guaranteed returns', 'single trade'
                                    ]
                                    is_pump_signal = any(keyword in part_text.lower() for keyword in pump_keywords)
                                    
                                    mentions.append({
                                        'id': f"{msg.id}_{matching_count}",  # Unique ID for split messages
                                        'text': part_text,
                                        'created_at': msg.date.isoformat() if msg.date else None,
                                        'channel': channel_username,
                                        'author_id': msg.from_id.user_id if msg.from_id else None,
                                        'views': msg.views or 0,
                                        'is_pump_signal': is_pump_signal,
                                        'contains_ticker': part_contains_ticker,
                                        'has_media': has_media,
                                        'media_type': media_type,
                                    })
                    
                    print(f"  📊 [TelegramMonitor] Total relevant messages in @{channel_username}: {matching_count}")
                except Exception as e:
                    print(f"  ❌ [TelegramMonitor] Error searching channel @{channel_username}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
        except Exception as e:
            print(f"❌ [TelegramMonitor] Telegram search error: {e}")
            import traceback
            traceback.print_exc()
            return self._mock_mentions(ticker, hours)
        
        print(f"✅ [TelegramMonitor] Total mentions found: {len(mentions)}")
        return mentions[:limit]
        
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
    
    async def get_stock_social_data_async(
        self,
        ticker: str,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get comprehensive Telegram data for a stock (async version)
        
        Args:
            ticker: Stock ticker
            hours: Hours to look back
        
        Returns:
            Dictionary with aggregated Telegram metrics
        """
        print(f"📊 [TelegramMonitor] get_stock_social_data_async called for: {ticker}")
        
        try:
            if self.is_configured:
                print("✅ [TelegramMonitor] Configuration OK - fetching real data")
                mentions = await self.search_mentions(ticker, hours=hours)
            else:
                print("⚠️  [TelegramMonitor] Not configured - using mock data")
                mentions = self._mock_mentions(ticker, hours)
        except Exception as e:
            print(f"❌ [TelegramMonitor] Error getting Telegram data: {e}")
            import traceback
            traceback.print_exc()
            mentions = self._mock_mentions(ticker, hours)
        
        if not mentions:
            print("⚠️  [TelegramMonitor] No mentions found - returning empty data")
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
        
        print(f"📈 [TelegramMonitor] Results for {ticker}:")
        print(f"   - Total mentions: {len(mentions)}")
        print(f"   - Pump signals: {len(pump_signals)}")
        print(f"   - Channels: {channels}")
        print(f"   - Coordination detected: {coordination.get('is_coordinated', False)}")
        
        result = {
            'ticker': ticker,
            'mention_count': len(mentions),
            'pump_signal_count': len(pump_signals),
            'coordination': coordination,
            'channels': channels,
            'recent_mentions': mentions[:10]
        }
        
        print(f"✅ [TelegramMonitor] Returning data for {ticker}")
        return result
    
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
        
        # Use same hardcoded channels as real search
        channels = self.default_channels
        
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


# Global instance - will be initialized on import
print("🔄 [TelegramMonitor] Module loaded, creating instance...")
telegram_monitor = TelegramMonitor()
print(f"✅ [TelegramMonitor] Instance created with channels: {telegram_monitor.default_channels}")

