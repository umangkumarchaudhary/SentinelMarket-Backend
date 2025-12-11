# Pump and Dump Detection & Prevention Guide

## 🎯 What is a Pump-and-Dump Scheme?

A **pump-and-dump** is a form of market manipulation where:

1. **Pump Phase**: Bad actors artificially inflate a stock's price through:
   - Spreading false/misleading information
   - Coordinated buying to create artificial demand
   - Social media hype campaigns
   - Fake news releases

2. **Dump Phase**: Once the price rises, the manipulators sell their holdings at inflated prices, leaving retail investors with worthless shares when the price crashes.

### Real Example (India):
```
Stock: SUZLON Energy (2021)
- Normal price: ₹5-6
- Pump phase: Social media campaigns, "green energy boom" hype
- Peak: ₹12-14 (100% increase in 2 weeks)
- Dump phase: Insiders sold, price crashed to ₹6
- Retail investors lost: 40-50% of investment
```

---

## 🔍 How to Detect Pump-and-Dump Schemes

### Detection Method 1: Volume Spike Analysis

**What to look for:**
- Sudden, unexplained increase in trading volume
- Volume 2-5x higher than 30-day average
- No corresponding fundamental news

**Technical Implementation:**
```python
def detect_volume_spike(stock_data):
    """
    Detects abnormal volume spikes
    Returns: (is_suspicious, severity_score)
    """
    # Calculate 30-day average volume
    avg_volume = stock_data['Volume'].rolling(window=30).mean()
    current_volume = stock_data['Volume'].iloc[-1]

    # Calculate ratio
    volume_ratio = current_volume / avg_volume.iloc[-1]

    # Thresholds
    if volume_ratio > 5:
        return (True, 90)  # Extreme risk
    elif volume_ratio > 3:
        return (True, 70)  # High risk
    elif volume_ratio > 2:
        return (True, 50)  # Moderate risk
    else:
        return (False, 0)  # Normal
```

**Red Flags:**
- Volume spike WITHOUT major news (earnings, acquisitions, etc.)
- Volume concentrated in first/last hour of trading (manipulation window)
- Volume spike + price increase + low market cap stock

---

### Detection Method 2: Price Movement Anomaly

**What to look for:**
- Sudden price increase (>10% in a day) without news
- Price volatility exceeding historical norms
- Price patterns that don't match overall market movement

**Technical Implementation:**
```python
import numpy as np

def detect_price_anomaly(stock_data):
    """
    Detects unusual price movements using statistical analysis
    """
    # Calculate daily returns
    returns = stock_data['Close'].pct_change()

    # Calculate mean and standard deviation (30-day window)
    mean_return = returns.rolling(window=30).mean()
    std_return = returns.rolling(window=30).std()

    # Current return
    current_return = returns.iloc[-1]

    # Z-score (how many standard deviations from mean)
    z_score = (current_return - mean_return.iloc[-1]) / std_return.iloc[-1]

    # Thresholds
    if abs(z_score) > 3:
        return (True, 85)  # Extreme anomaly
    elif abs(z_score) > 2:
        return (True, 60)  # Moderate anomaly
    else:
        return (False, 0)
```

**Red Flags:**
- Price increases >15% in a single day (small-cap stocks)
- Price chart shows "hockey stick" pattern (flat, then sudden spike)
- Price increase not correlated with sector/market movement

---

### Detection Method 3: Social Media Sentiment Spike

**What to look for:**
- Sudden surge in social media mentions
- Overly positive sentiment (unrealistic claims)
- Coordinated posting patterns (bots/paid promoters)

**Technical Implementation:**
```python
def detect_social_sentiment_spike(stock_ticker, social_data):
    """
    Analyzes social media activity for manipulation signs
    """
    # Calculate mention frequency
    avg_mentions = social_data['mentions'].rolling(window=7).mean()
    current_mentions = social_data['mentions'].iloc[-1]
    mention_ratio = current_mentions / avg_mentions.iloc[-1]

    # Sentiment analysis (using FinBERT or VADER)
    positive_ratio = social_data['positive_sentiment'].iloc[-1]

    # Red flags
    suspicious = False
    risk_score = 0

    # Mention spike + overly positive sentiment
    if mention_ratio > 10 and positive_ratio > 0.8:
        suspicious = True
        risk_score = 95
    elif mention_ratio > 5 and positive_ratio > 0.7:
        suspicious = True
        risk_score = 70

    # Check for bot patterns
    unique_users = social_data['unique_users'].iloc[-1]
    total_mentions = social_data['mentions'].iloc[-1]
    user_diversity = unique_users / total_mentions

    if user_diversity < 0.3:  # Same users posting repeatedly
        risk_score += 20

    return (suspicious, min(risk_score, 100))
```

**Red Flags:**
- Stock mentioned 10x more than usual on Reddit/Twitter
- Generic usernames (pump123, stockguru456) promoting the stock
- Claims like "guaranteed 500% returns" or "next Tesla"
- All posts use similar language (copy-paste campaigns)

---

### Detection Method 4: Machine Learning Anomaly Detection

**What to look for:**
- Complex patterns that traditional rules miss
- Combinations of multiple suspicious indicators

**Technical Implementation:**
```python
from sklearn.ensemble import IsolationForest
import pandas as pd

def train_anomaly_detector(historical_data):
    """
    Trains Isolation Forest model to detect abnormal trading patterns
    """
    # Feature engineering
    features = pd.DataFrame({
        'volume_ratio': historical_data['Volume'] / historical_data['Volume'].rolling(30).mean(),
        'price_change': historical_data['Close'].pct_change(),
        'volatility': historical_data['Close'].rolling(14).std(),
        'rsi': calculate_rsi(historical_data['Close']),  # Relative Strength Index
        'macd': calculate_macd(historical_data['Close']),  # Moving Average Convergence Divergence
        'high_low_ratio': (historical_data['High'] - historical_data['Low']) / historical_data['Close']
    })

    # Remove NaN values
    features = features.dropna()

    # Train Isolation Forest
    model = IsolationForest(
        contamination=0.05,  # Expect 5% of data to be anomalies
        random_state=42
    )
    model.fit(features)

    return model

def detect_ml_anomaly(model, current_data):
    """
    Uses trained model to detect anomalies in current data
    """
    # Prepare features for current day
    current_features = prepare_features(current_data)

    # Predict (-1 = anomaly, 1 = normal)
    prediction = model.predict([current_features])[0]

    # Get anomaly score (lower = more anomalous)
    anomaly_score = model.decision_function([current_features])[0]

    if prediction == -1:
        # Convert anomaly score to risk score (0-100)
        risk_score = int((1 - anomaly_score) * 50) + 50
        return (True, risk_score)
    else:
        return (False, 0)

def calculate_rsi(prices, window=14):
    """Calculate Relative Strength Index"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(prices):
    """Calculate MACD indicator"""
    exp1 = prices.ewm(span=12, adjust=False).mean()
    exp2 = prices.ewm(span=26, adjust=False).mean()
    macd = exp1 - exp2
    return macd
```

**What ML Detects:**
- Patterns like: "volume spike + price drop + RSI divergence" = insider selling
- Unusual correlation between volume and price
- Trading patterns that deviate from stock's historical behavior

---

### Detection Method 5: News Verification & Cross-Reference

**What to look for:**
- Price/volume spike without credible news
- Fake press releases or unverified sources
- News that contradicts company fundamentals

**Technical Implementation:**
```python
import requests
from datetime import datetime, timedelta

def verify_news_legitimacy(stock_ticker, spike_date):
    """
    Checks if there's legitimate news explaining the price movement
    """
    # Fetch news from multiple sources
    news_sources = [
        'Google News API',
        'Economic Times API',
        'Moneycontrol RSS',
        'BSE/NSE announcements'
    ]

    # Search for news 24 hours before spike
    search_window = (spike_date - timedelta(days=1), spike_date)

    verified_news = []
    for source in news_sources:
        articles = fetch_news(source, stock_ticker, search_window)
        verified_news.extend(articles)

    # Red flags
    if len(verified_news) == 0:
        return (True, 80)  # Spike with no news = suspicious

    # Check if news is from credible sources
    credible_sources = ['Economic Times', 'Moneycontrol', 'BSE', 'NSE']
    credible_count = sum(1 for article in verified_news if article['source'] in credible_sources)

    if credible_count == 0:
        return (True, 70)  # Only dubious sources = suspicious

    return (False, 0)
```

---

## 🎯 Combined Risk Scoring System

**How to combine all detection methods:**

```python
def calculate_final_risk_score(stock_ticker, stock_data, social_data, news_data):
    """
    Combines all detection methods into a single risk score (0-100)
    """
    # Method 1: Volume spike
    volume_suspicious, volume_score = detect_volume_spike(stock_data)

    # Method 2: Price anomaly
    price_suspicious, price_score = detect_price_anomaly(stock_data)

    # Method 3: Social sentiment
    social_suspicious, social_score = detect_social_sentiment_spike(stock_ticker, social_data)

    # Method 4: ML anomaly
    ml_model = load_trained_model()
    ml_suspicious, ml_score = detect_ml_anomaly(ml_model, stock_data)

    # Method 5: News verification
    news_suspicious, news_score = verify_news_legitimacy(stock_ticker, datetime.now())

    # Weighted combination
    final_score = (
        volume_score * 0.25 +      # 25% weight
        price_score * 0.30 +        # 30% weight
        social_score * 0.20 +       # 20% weight
        ml_score * 0.15 +           # 15% weight
        news_score * 0.10           # 10% weight
    )

    # Generate explanation
    explanation = generate_explanation({
        'volume': (volume_suspicious, volume_score),
        'price': (price_suspicious, price_score),
        'social': (social_suspicious, social_score),
        'ml': (ml_suspicious, ml_score),
        'news': (news_suspicious, news_score)
    })

    return {
        'risk_score': int(final_score),
        'risk_level': get_risk_level(final_score),
        'explanation': explanation,
        'individual_scores': {
            'volume': volume_score,
            'price': price_score,
            'social': social_score,
            'ml': ml_score,
            'news': news_score
        }
    }

def get_risk_level(score):
    """Converts numeric score to risk level"""
    if score >= 80:
        return "EXTREME RISK"
    elif score >= 60:
        return "HIGH RISK"
    elif score >= 40:
        return "MEDIUM RISK"
    else:
        return "LOW RISK"

def generate_explanation(detection_results):
    """Generates human-readable explanation"""
    explanations = []

    if detection_results['volume'][0]:
        explanations.append(f"Unusual trading volume ({detection_results['volume'][1]}/100)")

    if detection_results['price'][0]:
        explanations.append(f"Abnormal price movement ({detection_results['price'][1]}/100)")

    if detection_results['social'][0]:
        explanations.append(f"Social media manipulation detected ({detection_results['social'][1]}/100)")

    if detection_results['ml'][0]:
        explanations.append(f"ML model flagged unusual pattern ({detection_results['ml'][1]}/100)")

    if detection_results['news'][0]:
        explanations.append(f"Price spike without credible news ({detection_results['news'][1]}/100)")

    return " | ".join(explanations) if explanations else "Normal trading activity"
```

---

## 🛡️ How to Stop/Prevent Being Victim of Pump-and-Dump

### For Retail Investors (Your App Users):

1. **Real-time Alerts**
   - Send notifications when risk score > 60
   - Display warning banners on stock detail pages
   - Email alerts for watchlist stocks

2. **Educational Warnings**
   ```
   ⚠️ WARNING: This stock shows signs of manipulation

   Risk Score: 85/100 (EXTREME RISK)

   Red Flags Detected:
   - Trading volume 4.2x above normal
   - Price increased 18% without news
   - Social media mentions spiked 800%

   Recommendation: DO NOT BUY
   Research thoroughly before investing.
   ```

3. **Historical Case Studies**
   - Show past pump-and-dump examples
   - Display "what happened next" charts
   - Teach pattern recognition

### For Your Application:

1. **Automated Detection Pipeline**
   ```
   Data Collection (every 4 hours)
        ↓
   Run Detection Algorithms
        ↓
   Calculate Risk Scores
        ↓
   Store in Database
        ↓
   Trigger Alerts (if score > threshold)
        ↓
   Display on Dashboard
   ```

2. **Watchlist Monitoring**
   - Users can add stocks to watchlist
   - Get instant alerts when watchlist stocks become risky
   - Daily summary emails

3. **Reporting to Authorities**
   - When extreme manipulation detected (score > 90)
   - Generate automated reports
   - Option to submit to SEBI (Securities and Exchange Board of India)

### For Market Regulators (Advanced):

1. **Pattern Database**
   - Store all detected pump-and-dump cases
   - Identify repeat offenders
   - Track manipulation tactics evolution

2. **Coordinated Campaign Detection**
   - Detect if multiple stocks manipulated simultaneously
   - Identify common social media accounts across schemes
   - Network analysis of coordinated actors

---

## 📊 Real-World Detection Metrics

### Typical Pump-and-Dump Characteristics:

| Metric | Normal Stock | Pump-and-Dump Stock |
|--------|--------------|---------------------|
| Volume Spike | 1-1.5x | 3-10x |
| Price Increase | 2-5% per day | 15-50% per day |
| Social Mentions | Stable | 500-1000% increase |
| News Sources | Major outlets | Obscure blogs, Telegram |
| RSI | 30-70 | >80 (overbought) |
| Duration | Gradual | 1-7 days |

### Historical Accuracy Targets:

For your ML model to be considered successful:
- **True Positive Rate**: Detect 70-80% of actual pump-and-dumps
- **False Positive Rate**: <15% (don't flag legitimate stocks)
- **Early Detection**: Flag within 24-48 hours of pump start

---

## 🚀 Implementation Priority for Your Project

### Phase 1: Core Detection (Week 1)
1. ✅ Volume spike detection
2. ✅ Price anomaly detection
3. ✅ Basic risk scoring

### Phase 2: ML Enhancement (Week 2)
1. ✅ Train Isolation Forest model
2. ✅ Feature engineering (RSI, MACD, etc.)
3. ✅ Model evaluation

### Phase 3: Social Intelligence (Week 3)
1. ✅ Reddit/Twitter scraping
2. ✅ Sentiment analysis
3. ✅ News verification

### Phase 4: User Protection (Week 4)
1. ✅ Alert system
2. ✅ Dashboard warnings
3. ✅ Educational content

---

## 💡 Key Insights

**Why This Approach Works:**
1. **Multi-signal detection**: No single metric = definitive proof, but combination is powerful
2. **Machine learning**: Catches patterns humans miss
3. **Real-time monitoring**: Early detection = early warnings
4. **Social intelligence**: Most modern pump-and-dumps originate on social media

**Limitations to Acknowledge:**
- Cannot prevent all losses (some manipulation is sophisticated)
- False positives will occur (legitimate news-driven rallies)
- Relies on data quality (garbage in = garbage out)
- Not financial advice (users must do their own research)

**Ethical Considerations:**
- Warn users, don't claim 100% accuracy
- Make detection logic transparent
- Don't create panic (balanced warnings)
- Comply with regulations (don't provide investment advice)

---

## 📝 Next Steps

To start building the detection system:

1. **Set up data collection** (yfinance for stock data)
2. **Implement volume spike detection** (simplest, high impact)
3. **Test with historical pump-and-dump cases** (validate detection works)
4. **Build ML model** (Isolation Forest)
5. **Add social media monitoring** (Reddit API)
6. **Create risk scoring system** (combine all signals)
7. **Build alert mechanism** (email/push notifications)

---

**Ready to start coding? Let's begin with setting up the data collection pipeline and implementing the first detection method (volume spike analysis).**
