"""
Twitter Monitoring Service
Monitors Twitter for stock mentions and analyzes sentiment
"""

import os
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import re
from dotenv import load_dotenv

load_dotenv()

try:
    import tweepy
    TWEEPY_AVAILABLE = True
except ImportError:
    TWEEPY_AVAILABLE = False
    print("⚠️  tweepy not available - Twitter monitoring disabled")

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️  transformers not available - using simple sentiment analysis")

# Initialize sentiment analyzer (FinBERT if available, else simple)
sentiment_analyzer = None
if TRANSFORMERS_AVAILABLE:
    try:
        sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
            device=-1  # CPU
        )
    except Exception as e:
        print(f"⚠️  Could not load FinBERT: {e}")
        sentiment_analyzer = None


class TwitterMonitor:
    """
    Monitors Twitter for stock mentions and analyzes sentiment
    """
    
    def __init__(self):
        self.api = None
        self.client = None
        self.is_configured = False
        
        if not TWEEPY_AVAILABLE:
            return
        
        # Twitter API credentials (from environment)
        bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        api_key = os.getenv("TWITTER_API_KEY")
        api_secret = os.getenv("TWITTER_API_SECRET")
        access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        
        if bearer_token:
            try:
                self.client = tweepy.Client(
                    bearer_token=bearer_token,
                    wait_on_rate_limit=True
                )
                self.is_configured = True
            except Exception as e:
                print(f"⚠️  Twitter API configuration error: {e}")
        elif api_key and api_secret and access_token and access_token_secret:
            try:
                auth = tweepy.OAuthHandler(api_key, api_secret)
                auth.set_access_token(access_token, access_token_secret)
                self.api = tweepy.API(auth, wait_on_rate_limit=True)
                self.is_configured = True
            except Exception as e:
                print(f"⚠️  Twitter API configuration error: {e}")
    
    def search_mentions(
        self,
        ticker: str,
        hours: int = 24,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search for stock mentions on Twitter
        
        Args:
            ticker: Stock ticker symbol (e.g., "RELIANCE", "TCS")
            hours: How many hours back to search
            max_results: Maximum number of tweets to return
        
        Returns:
            List of tweet dictionaries with metadata
        """
        if not self.is_configured:
            return self._mock_mentions(ticker, hours)
        
        mentions = []
        query = f"{ticker} OR ${ticker} OR #{ticker}"
        
        try:
            if self.client:  # Twitter API v2
                start_time = datetime.utcnow() - timedelta(hours=hours)
                tweets = self.client.search_recent_tweets(
                    query=query,
                    max_results=min(max_results, 100),
                    start_time=start_time,
                    tweet_fields=['created_at', 'public_metrics', 'author_id'],
                    user_fields=['username', 'public_metrics'],
                    expansions=['author_id']
                )
                
                if tweets.data:
                    users = {u.id: u for u in tweets.includes.get('users', [])}
                    for tweet in tweets.data:
                        author = users.get(tweet.author_id)
                        mentions.append({
                            'id': tweet.id,
                            'text': tweet.text,
                            'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                            'author_id': tweet.author_id,
                            'username': author.username if author else None,
                            'follower_count': author.public_metrics.get('followers_count', 0) if author else 0,
                            'likes': tweet.public_metrics.get('like_count', 0),
                            'retweets': tweet.public_metrics.get('retweet_count', 0),
                            'replies': tweet.public_metrics.get('reply_count', 0),
                        })
            elif self.api:  # Twitter API v1.1
                tweets = self.api.search_tweets(
                    q=query,
                    count=min(max_results, 100),
                    result_type='recent',
                    lang='en'
                )
                for tweet in tweets:
                    mentions.append({
                        'id': tweet.id,
                        'text': tweet.text,
                        'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                        'username': tweet.user.screen_name,
                        'follower_count': tweet.user.followers_count,
                        'likes': tweet.favorite_count,
                        'retweets': tweet.retweet_count,
                    })
        except Exception as e:
            print(f"⚠️  Twitter search error: {e}")
            return self._mock_mentions(ticker, hours)
        
        return mentions
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text using FinBERT or simple analysis
        
        Args:
            text: Text to analyze
        
        Returns:
            Dictionary with sentiment label and score
        """
        if sentiment_analyzer:
            try:
                result = sentiment_analyzer(text)[0]
                label = result['label'].lower()
                score = result['score']
                
                # Map FinBERT labels to our format
                if 'positive' in label:
                    sentiment = 'positive'
                elif 'negative' in label:
                    sentiment = 'negative'
                else:
                    sentiment = 'neutral'
                
                return {
                    'sentiment': sentiment,
                    'score': score,
                    'confidence': score
                }
            except Exception as e:
                print(f"⚠️  Sentiment analysis error: {e}")
        
        # Fallback: Simple keyword-based sentiment
        return self._simple_sentiment(text)
    
    def _simple_sentiment(self, text: str) -> Dict[str, Any]:
        """Simple keyword-based sentiment analysis"""
        text_lower = text.lower()
        
        positive_words = ['buy', 'bullish', 'moon', 'pump', 'gains', 'profit', 'up', 'rise', 'surge']
        negative_words = ['sell', 'bearish', 'crash', 'dump', 'loss', 'down', 'fall', 'drop', 'scam']
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = 'positive'
            score = min(0.7 + (positive_count * 0.1), 0.95)
        elif negative_count > positive_count:
            sentiment = 'negative'
            score = min(0.7 + (negative_count * 0.1), 0.95)
        else:
            sentiment = 'neutral'
            score = 0.5
        
        return {
            'sentiment': sentiment,
            'score': score,
            'confidence': 0.6
        }
    
    def get_stock_social_data(
        self,
        ticker: str,
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get comprehensive social media data for a stock
        
        Args:
            ticker: Stock ticker
            hours: Hours to look back
        
        Returns:
            Dictionary with aggregated social metrics
        """
        mentions = self.search_mentions(ticker, hours=hours)
        
        if not mentions:
            return {
                'ticker': ticker,
                'mention_count': 0,
                'sentiment_distribution': {'positive': 0, 'negative': 0, 'neutral': 0},
                'avg_sentiment_score': 0.5,
                'total_engagement': 0,
                'influencer_count': 0,
                'hype_score': 0,
                'recent_mentions': []
            }
        
        # Analyze sentiment for each mention
        sentiments = []
        total_engagement = 0
        influencer_count = 0
        sentiment_dist = {'positive': 0, 'negative': 0, 'neutral': 0}
        
        for mention in mentions:
            sentiment_result = self.analyze_sentiment(mention['text'])
            mention['sentiment'] = sentiment_result['sentiment']
            mention['sentiment_score'] = sentiment_result['score']
            
            sentiments.append(sentiment_result['score'])
            sentiment_dist[sentiment_result['sentiment']] += 1
            
            engagement = mention.get('likes', 0) + mention.get('retweets', 0) + mention.get('replies', 0)
            total_engagement += engagement
            
            # Consider influencer if > 10k followers
            if mention.get('follower_count', 0) > 10000:
                influencer_count += 1
        
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.5
        
        # Calculate hype score (0-100)
        # Based on: mention volume, sentiment, engagement, influencers
        volume_score = min(len(mentions) / 50 * 100, 100)  # 50 mentions = 100
        sentiment_score = (avg_sentiment - 0.5) * 100  # -50 to +50
        engagement_score = min(total_engagement / 1000 * 100, 100)  # 1000 engagement = 100
        influencer_score = min(influencer_count / 5 * 100, 100)  # 5 influencers = 100
        
        hype_score = (volume_score * 0.3 + abs(sentiment_score) * 0.2 + engagement_score * 0.3 + influencer_score * 0.2)
        hype_score = min(max(hype_score, 0), 100)
        
        return {
            'ticker': ticker,
            'mention_count': len(mentions),
            'sentiment_distribution': sentiment_dist,
            'avg_sentiment_score': round(avg_sentiment, 3),
            'total_engagement': total_engagement,
            'influencer_count': influencer_count,
            'hype_score': round(hype_score, 2),
            'recent_mentions': mentions[:10]  # Top 10 most recent
        }
    
    def _mock_mentions(self, ticker: str, hours: int) -> List[Dict[str, Any]]:
        """Generate mock mentions for testing when API is not configured"""
        import random
        mock_texts = [
            f"${ticker} looking bullish today! 🚀",
            f"Just bought more {ticker}, expecting big gains",
            f"{ticker} is going to the moon!",
            f"Be careful with {ticker}, seems like a pump",
            f"{ticker} showing strong momentum",
        ]
        
        mentions = []
        for i in range(random.randint(5, 20)):
            mentions.append({
                'id': f"mock_{i}",
                'text': random.choice(mock_texts),
                'created_at': (datetime.now() - timedelta(hours=random.randint(0, hours))).isoformat(),
                'username': f"user_{random.randint(1000, 9999)}",
                'follower_count': random.randint(100, 50000),
                'likes': random.randint(0, 100),
                'retweets': random.randint(0, 50),
                'replies': random.randint(0, 20),
            })
        
        return mentions


# Global instance
twitter_monitor = TwitterMonitor()

