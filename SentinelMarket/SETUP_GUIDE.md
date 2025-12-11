# StockGuard - Setup Guide

This guide will help you set up and run the Stock Price Detector system.

---

## 📋 Prerequisites

- Python 3.8 or higher
- Internet connection (for fetching stock data)
- Windows/Linux/MacOS

---

## 🚀 Quick Start

### Step 1: Install Python Dependencies

Open terminal/command prompt in the project directory and run:

```bash
pip install -r requirements.txt
```

This will install:
- `yfinance` - For fetching stock data
- `pandas` - For data manipulation
- `numpy` - For numerical calculations
- `scikit-learn` - For machine learning (future use)
- `matplotlib` - For visualization (future use)

### Step 2: Verify Installation

Run this command to verify all dependencies are installed:

```bash
python -c "import yfinance, pandas, numpy; print('✅ All dependencies installed successfully!')"
```

### Step 3: Run Tests

Test the detection system with real stock data:

```bash
python test_detection_system.py
```

This will:
1. Fetch historical data for test stocks (SUZLON, YESBANK, RELIANCE, TATASTEEL)
2. Run volume spike detection
3. Run price anomaly detection
4. Calculate risk scores
5. Display results

---

## 📁 Project Structure

```
SentimelMarket/
│
├── src/
│   ├── data/
│   │   ├── __init__.py
│   │   └── stock_data_fetcher.py      # Fetches stock data using yfinance
│   │
│   ├── detectors/
│   │   ├── __init__.py
│   │   ├── volume_spike_detector.py   # Detects volume anomalies
│   │   ├── price_anomaly_detector.py  # Detects price anomalies
│   │   └── risk_scorer.py             # Combines all detectors
│   │
│   └── __init__.py
│
├── test_detection_system.py           # Test suite
├── requirements.txt                   # Python dependencies
├── .env.example                       # Environment variables template
├── SETUP_GUIDE.md                     # This file
├── PROJECT_OVERVIEW.md                # Project overview
├── PUMP_AND_DUMP_DETECTION_GUIDE.md   # Detection methodology
└── REALTIME_DETECTION_STRATEGY.md     # Real-time detection strategy
```

---

## 🧪 Testing Individual Components

### Test Volume Spike Detector

```bash
cd src/detectors
python volume_spike_detector.py
```

This will run an example with sample data showing how volume spike detection works.

### Test Price Anomaly Detector

```bash
cd src/detectors
python price_anomaly_detector.py
```

This demonstrates price anomaly detection with sample data.

### Test Stock Data Fetcher

```bash
cd src/data
python stock_data_fetcher.py
```

This fetches real stock data for SUZLON, RELIANCE and displays it.

### Test Risk Scorer

```bash
cd src/detectors
python risk_scorer.py
```

This combines all detectors and calculates a comprehensive risk score.

---

## 💡 Usage Examples

### Example 1: Analyze a Single Stock

```python
from src.data.stock_data_fetcher import StockDataFetcher
from src.detectors.risk_scorer import RiskScorer

# Initialize
fetcher = StockDataFetcher()
scorer = RiskScorer()

# Fetch data
data = fetcher.fetch_historical_data("SUZLON", period="3mo")

# Calculate risk
result = scorer.calculate_risk_score(data, "SUZLON")

# Display results
print(f"Risk Score: {result['risk_score']}/100")
print(f"Risk Level: {result['risk_level']}")
print(f"Recommendation: {result['recommendation']}")
```

### Example 2: Analyze Multiple Stocks

```python
from src.data.stock_data_fetcher import StockDataFetcher
from src.detectors.risk_scorer import RiskScorer

fetcher = StockDataFetcher()
scorer = RiskScorer()

# Fetch multiple stocks
tickers = ["SUZLON", "YESBANK", "RELIANCE"]
stock_data = fetcher.fetch_multiple_stocks(tickers, period="3mo")

# Calculate risk for all
results = scorer.batch_calculate_risk(stock_data)

# Get high-risk stocks
high_risk = scorer.get_high_risk_stocks(results, threshold=60)

for stock in high_risk:
    print(f"{stock['ticker']}: {stock['risk_score']}/100")
```

### Example 3: Real-Time Monitoring

```python
from src.data.stock_data_fetcher import StockDataFetcher
from src.detectors.risk_scorer import RiskScorer
import time

fetcher = StockDataFetcher()
scorer = RiskScorer()

# Monitor every minute
while True:
    # Fetch latest data
    data = fetcher.fetch_historical_data("SUZLON", period="1d")

    # Calculate risk
    result = scorer.calculate_risk_score(data, "SUZLON")

    # Alert if suspicious
    if result['is_suspicious']:
        print(f"🚨 ALERT: {result['ticker']} - Risk Score: {result['risk_score']}")
        print(scorer.generate_alert_summary(result))

    # Wait 60 seconds
    time.sleep(60)
```

---

## 🎯 Understanding Risk Scores

The system calculates risk scores from **0-100**:

| Risk Score | Risk Level | Meaning | Recommendation |
|------------|------------|---------|----------------|
| 0-30 | MINIMAL/LOW RISK | Normal trading activity | ✅ NORMAL |
| 31-60 | MEDIUM RISK | Some unusual activity | ⚡ CAUTION |
| 61-80 | HIGH RISK | Suspicious patterns detected | ⚠️ AVOID |
| 81-100 | EXTREME RISK | Likely pump-and-dump | ⛔ DO NOT BUY |

---

## 🔍 Detection Methods

### 1. Volume Spike Detection (35% weight)
- Compares current volume to 30-day average
- Flags volumes >2x normal as suspicious
- Higher ratios = higher risk

### 2. Price Anomaly Detection (40% weight)
- Uses Z-score analysis (statistical deviation)
- Checks RSI (Relative Strength Index)
- Analyzes Bollinger Bands
- Measures price momentum

### 3. Combined Risk Scoring
- Weighted combination of all detection methods
- Generates human-readable explanations
- Provides actionable recommendations

---

## ⚙️ Configuration

### Adjusting Detection Sensitivity

Edit thresholds in the detector files:

**Volume Spike Detector** (`src/detectors/volume_spike_detector.py`):
```python
# More sensitive (detect smaller spikes)
detector = VolumeSpikeDetector(window_days=30, spike_threshold=1.5)

# Less sensitive (detect only large spikes)
detector = VolumeSpikeDetector(window_days=30, spike_threshold=3.0)
```

**Price Anomaly Detector** (`src/detectors/price_anomaly_detector.py`):
```python
# More sensitive
detector = PriceAnomalyDetector(window_days=30, z_score_threshold=1.5)

# Less sensitive
detector = PriceAnomalyDetector(window_days=30, z_score_threshold=2.5)
```

---

## 🐛 Troubleshooting

### Issue: "No data found for ticker"

**Solution:**
- Ensure you're using correct NSE ticker symbols (e.g., "SUZLON", not "SUZLON.NS")
- The system automatically adds ".NS" suffix
- Check if market is open (data updates during trading hours)

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# If still failing, install individually
pip install yfinance pandas numpy scikit-learn
```

### Issue: "Insufficient data" warnings

**Solution:**
- Some stocks have limited historical data
- Try a shorter period: `period="1mo"` instead of `period="3mo"`
- Use more liquid stocks (RELIANCE, TCS, INFY)

### Issue: yfinance rate limiting

**Solution:**
- Add delays between API calls (already implemented)
- Reduce number of stocks fetched simultaneously
- Use `time.sleep(1)` between requests

---

## 📊 Sample Output

When you run `python test_detection_system.py`, you should see output like:

```
================================================================================
STOCKGUARD - DETECTION SYSTEM TEST SUITE
================================================================================

TEST 1: SINGLE STOCK ANALYSIS
================================================================================

📊 ANALYZING: SUZLON

Fetching 3mo of historical data...
✅ Fetched 90 days of data
Date range: 2024-01-01 to 2024-03-31

--- VOLUME SPIKE DETECTION ---
Is Suspicious: True
Risk Score: 70/100
Message: HIGH VOLUME SPIKE: 3.2x normal volume detected. Suspicious activity.
Details:
  Current Volume: 45,000,000
  Average Volume: 14,000,000
  Volume Ratio: 3.2x

--- PRICE ANOMALY DETECTION ---
Is Suspicious: True
Risk Score: 65/100
Message: HIGH PRICE ANOMALY: Price increased 12.5% (Z-score: 2.8). Suspicious movement.
Details:
  Price Change: 12.50%
  Z-Score: 2.80
  Current Price: ₹18.75
  RSI: 78.5 (overbought)

--- COMBINED RISK ASSESSMENT ---
Final Risk Score: 68/100
Risk Level: HIGH RISK
Is Suspicious: True

Explanation: Trading volume is 3.2x above normal | Price increased abnormally (12.5%, Z-score: 2.8) | RSI indicates overbought condition (78.5)

🚩 Red Flags:
  ⚠️ HIGH volume spike (3.2x normal)
  ⚠️ UNUSUAL price movement (12.5%)
  🚨 RSI extremely overbought (78.5)
  🚨 CRITICAL: Both volume AND price showing anomalies (classic pump-and-dump pattern)

💡 Recommendation:
⚠️ AVOID - High risk detected. Wait for more information before investing.
```

---

## 🚀 Next Steps

Now that you have the basic detection system working:

1. **Phase 2** (Week 2): Add Machine Learning models
   - Train Isolation Forest on historical data
   - Improve detection accuracy

2. **Phase 3** (Week 3): Add Telegram monitoring
   - Monitor pump-and-dump channels
   - Real-time alert system

3. **Phase 4** (Week 4): Build web dashboard
   - Next.js frontend
   - Real-time visualization
   - User alerts

---

## 📝 Notes

- **Data Delay**: yfinance has ~15 minute delay for free tier (acceptable for this project)
- **Market Hours**: NSE trading hours are 9:15 AM - 3:30 PM IST (Monday-Friday)
- **Data Accuracy**: System is for educational purposes, not financial advice
- **Rate Limits**: Be respectful of API rate limits

---

## 🆘 Need Help?

- Check the documentation files:
  - `PUMP_AND_DUMP_DETECTION_GUIDE.md` - Detection methodology
  - `REALTIME_DETECTION_STRATEGY.md` - Real-time detection approach
  - `PROJECT_OVERVIEW.md` - Project goals and architecture

- Common stocks to test with:
  - **High volatility**: SUZLON, YESBANK (frequent manipulation targets)
  - **Stable**: RELIANCE, TCS, INFY (less manipulation, good baseline)

---

**Ready to detect pump-and-dump schemes! 🚀**
