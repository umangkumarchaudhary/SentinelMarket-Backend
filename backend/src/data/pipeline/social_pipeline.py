"""
Social Media Data ETL Pipeline
Extracts, transforms, and loads social media mentions
"""

import sys
import os
from typing import Dict, List, Any
from datetime import datetime, timedelta
from .base_pipeline import BasePipeline

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

# Don't import social modules at module level - import lazily in methods
# This prevents PyTorch/transformers DLL errors from blocking the pipeline
SOCIAL_AVAILABLE = None  # Will be checked lazily
twitter_monitor = None
telegram_monitor = None

def _get_social_modules():
    """Lazy import of social media modules to avoid DLL errors"""
    global SOCIAL_AVAILABLE, twitter_monitor, telegram_monitor
    
    if SOCIAL_AVAILABLE is not None:
        return SOCIAL_AVAILABLE, twitter_monitor, telegram_monitor
    
    try:
        from src.social import twitter_monitor, telegram_monitor
        SOCIAL_AVAILABLE = True
        return True, twitter_monitor, telegram_monitor
    except (ImportError, OSError) as e:
        # OSError catches PyTorch DLL errors on Windows
        SOCIAL_AVAILABLE = False
        return False, None, None

class SocialMediaPipeline(BasePipeline):
    """ETL pipeline for social media mentions from Twitter and Telegram"""
    
    def __init__(self):
        super().__init__("social_media")
        # Track stocks to monitor
        self.stocks = [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
            "HINDUNILVR", "BHARTIARTL", "WIPRO", "ADANIENT", "TATAMOTORS"
        ]
        self.hours_back = 24
    
    def extract(self) -> List[Dict[str, Any]]:
        """
        Extract social media mentions from Twitter and Telegram
        
        Returns:
            List of raw social media mentions
        """
        all_mentions = []
        
        # Lazy import social modules
        social_available, twitter_mon, telegram_mon = _get_social_modules()
        
        if not social_available or not twitter_mon or not telegram_mon:
            self.logger.warning("Social media modules not available")
            return all_mentions
        
        # Extract from Twitter
        try:
            for ticker in self.stocks:
                try:
                    twitter_data = twitter_mon.get_stock_social_data(ticker, hours=self.hours_back)
                    if twitter_data and twitter_data.get("mentions"):
                        for mention in twitter_data["mentions"]:
                            mention["ticker"] = ticker
                            mention["platform"] = "twitter"
                            mention["extracted_at"] = datetime.now().isoformat()
                            all_mentions.append(mention)
                except Exception as e:
                    self.logger.warning(f"Twitter extraction failed for {ticker}: {str(e)[:50]}")
        except Exception as e:
            self.logger.error(f"Twitter extraction error: {str(e)}")
        
        # Extract from Telegram (async, but we'll handle it)
        try:
            import asyncio
            for ticker in self.stocks:
                try:
                    # Try async method first
                    if hasattr(telegram_mon, 'get_stock_social_data_async'):
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            # If loop is running, use direct search
                            mentions = loop.run_until_complete(
                                telegram_mon.search_mentions(ticker, hours=self.hours_back)
                            )
                        else:
                            mentions = asyncio.run(
                                telegram_mon.search_mentions(ticker, hours=self.hours_back)
                            )
                    else:
                        # Fallback to direct search
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        mentions = loop.run_until_complete(
                            telegram_mon.search_mentions(ticker, hours=self.hours_back)
                        )
                        loop.close()
                    
                    for mention in mentions:
                        mention["ticker"] = ticker
                        mention["platform"] = "telegram"
                        mention["extracted_at"] = datetime.now().isoformat()
                        all_mentions.append(mention)
                        
                except Exception as e:
                    self.logger.warning(f"Telegram extraction failed for {ticker}: {str(e)[:50]}")
        except Exception as e:
            self.logger.error(f"Telegram extraction error: {str(e)}")
        
        return all_mentions
    
    def transform(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform and enrich social media mentions
        
        Args:
            data: Raw social media mentions
            
        Returns:
            List of transformed mentions
        """
        transformed = []
        
        for record in data:
            try:
                # Validate required fields
                if not record.get("ticker") or not record.get("platform"):
                    continue
                
                # Extract text
                text = record.get("text", "") or record.get("message", "")
                if not text or len(text) < 5:
                    continue
                
                # Determine sentiment (simple keyword-based)
                text_lower = text.lower()
                sentiment = "neutral"
                if any(word in text_lower for word in ["bullish", "buy", "profit", "moon", "gains", "strong"]):
                    sentiment = "positive"
                elif any(word in text_lower for word in ["bearish", "sell", "loss", "crash", "weak", "avoid"]):
                    sentiment = "negative"
                
                # Detect pump signals
                pump_keywords = [
                    'buy now', 'going to moon', 'pump', 'guaranteed', 'quick profit',
                    'multibagger', 'premium', 'join', 'fee', '2995', '10k', 'last day',
                    'offer', 'hurry', "don't miss", 'guaranteed returns', 'single trade'
                ]
                is_pump_signal = any(keyword in text_lower for keyword in pump_keywords)
                
                # Transform to standardized format
                transformed_record = {
                    "ticker": str(record["ticker"]).upper(),
                    "platform": record["platform"],
                    "text": text[:1000],  # Limit text length
                    "sentiment": sentiment,
                    "is_pump_signal": is_pump_signal,
                    "channel": record.get("channel") or record.get("username", "unknown"),
                    "timestamp": record.get("created_at") or record.get("timestamp") or datetime.now().isoformat(),
                    "views": record.get("views", 0) or record.get("likes", 0),
                    "processed_at": datetime.now().isoformat(),
                    # Store metadata
                    "metadata": {
                        "author_id": record.get("author_id"),
                        "has_media": record.get("has_media", False),
                        "raw_data": {k: v for k, v in record.items() if k not in ["text", "message"]}
                    }
                }
                
                transformed.append(transformed_record)
                
            except Exception as e:
                self.logger.warning(f"Transform error: {str(e)[:50]}")
                continue
        
        return transformed
    
    def load(self, data: List[Dict[str, Any]]) -> bool:
        """
        Load transformed social media data to warehouse
        
        Args:
            data: Transformed social mentions
            
        Returns:
            True if load successful
        """
        try:
            from ..storage.warehouse import DataWarehouse
            
            warehouse = DataWarehouse()
            warehouse.insert_social_mentions(data)
            self.logger.info(f"Successfully loaded {len(data)} social mentions to warehouse")
            return True
        except Exception as e:
            self.logger.error(f"Load failed: {str(e)}")
            return False

