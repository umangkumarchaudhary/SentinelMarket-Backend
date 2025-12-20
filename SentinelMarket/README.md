# 🛡️ StockGuard - AI-Powered Stock Anomaly Detection System

**Protect retail investors from pump-and-dump schemes in Indian stock markets**

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Phase%201%20Complete-success.svg)](.)

---

## 🎯 What is StockGuard?

StockGuard is a real-time stock anomaly detection system that identifies suspicious trading patterns in NSE-listed stocks. It helps retail investors avoid pump-and-dump scams by analyzing:

- 📊 **Volume Spikes** - Unusual trading volume increases
- 💹 **Price Anomalies** - Abnormal price movements
- 🤖 **ML Patterns** - Machine learning-based anomaly detection (Coming in Phase 2)
- 📱 **Social Sentiment** - Telegram/Reddit manipulation detection (Coming in Phase 3)

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd SentimelMarket

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_detection_system.py
```

### Basic Usage

```python
from src.data.stock_data_fetcher import StockDataFetcher
from src.detectors.risk_scorer import RiskScorer

# Initialize
fetcher = StockDataFetcher()
scorer = RiskScorer()

# Analyze a stock
data = fetcher.fetch_historical_data("SUZLON", period="3mo")
result = scorer.calculate_risk_score(data, "SUZLON")

# Check results
print(f"Risk Score: {result['risk_score']}/100")
print(f"Recommendation: {result['recommendation']}")
```

---

## 📊 Features (Phase 1 - COMPLETE ✅)

### ✅ Volume Spike Detection
- Detects when trading volume exceeds 2x+ normal levels
- 30-day rolling average baseline
- Configurable sensitivity thresholds

### ✅ Price Anomaly Detection
- Statistical analysis using Z-scores
- RSI (Relative Strength Index) monitoring
- Bollinger Bands analysis
- Price momentum detection

### ✅ Risk Scoring System
- Combined risk score (0-100 scale)
- Weighted algorithm (Volume: 35%, Price: 40%, ML: 10%, Social: 15%)
- Human-readable explanations
- Actionable recommendations

### ✅ Real-Time Data Fetching
- Integration with yfinance API
- Historical data (up to 5 years)
- Intraday data (1-minute intervals)
- Batch processing for multiple stocks

---

## 📈 Risk Score Interpretation

| Score | Risk Level | Action | Indicator |
|-------|------------|--------|-----------|
| 0-30 | **LOW** | ✅ Normal trading | No significant anomalies |
| 31-60 | **MEDIUM** | ⚡ Caution | Some unusual activity |
| 61-80 | **HIGH** | ⚠️ Avoid | Suspicious patterns |
| 81-100 | **EXTREME** | ⛔ Do Not Buy | Likely manipulation |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      STOCKGUARD SYSTEM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  DATA FETCHER    │─────▶│  DETECTORS       │─────▶│  RISK SCORER     │
│  (yfinance)      │      │                  │      │                  │
│  • Historical    │      │  • Volume Spike  │      │  • Weighted      │
│  • Real-time     │      │  • Price Anomaly │      │    Combination   │
│  • Intraday      │      │  • RSI/Bollinger │      │  • Explanations  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │  ALERTS & REPORTS│
                                                    │  • Risk Level    │
                                                    │  • Red Flags     │
                                                    │  • Recommendation│
                                                    └──────────────────┘
```

---

## 📁 Project Structure

```
SentimelMarket/
│
├── src/
│   ├── data/
│   │   ├── stock_data_fetcher.py      # Data collection from yfinance
│   │   └── __init__.py
│   │
│   ├── detectors/
│   │   ├── volume_spike_detector.py   # Volume anomaly detection
│   │   ├── price_anomaly_detector.py  # Price anomaly detection
│   │   ├── risk_scorer.py             # Combined risk scoring
│   │   └── __init__.py
│   │
│   └── __init__.py
│
├── test_detection_system.py           # Comprehensive test suite
├── requirements.txt                   # Python dependencies
├── .env.example                       # Environment configuration
├── SETUP_GUIDE.md                     # Detailed setup instructions
├── README.md                          # This file
│
└── docs/
    ├── PROJECT_OVERVIEW.md            # Project goals & roadmap
    ├── PUMP_AND_DUMP_DETECTION_GUIDE.md  # Detection methodology
    └── REALTIME_DETECTION_STRATEGY.md    # Real-time detection approach
```

---

## 🧪 Testing

### Run Full Test Suite

```bash
python test_detection_system.py
```

This will:
1. ✅ Test single stock analysis (SUZLON)
2. ✅ Test batch analysis (4 stocks)
3. ✅ Test historical pump-and-dump detection
4. ✅ Test real-time monitoring simulation

### Test Individual Components

```bash
# Test volume detector
cd src/detectors
python volume_spike_detector.py

# Test price detector
python price_anomaly_detector.py

# Test risk scorer
python risk_scorer.py

# Test data fetcher
cd ../data
python stock_data_fetcher.py
```

---

## 📊 Example Output

```
📊 ANALYZING: SUZLON

--- COMBINED RISK ASSESSMENT ---
Final Risk Score: 72/100
Risk Level: HIGH RISK
Is Suspicious: True

Explanation: Trading volume is 3.5x above normal | Price increased
abnormally (14.2%, Z-score: 2.9) | RSI indicates overbought (81.2)

🚩 Red Flags:
  ⚠️ HIGH volume spike (3.5x normal)
  ⚠️ UNUSUAL price movement (14.2%)
  🚨 RSI extremely overbought (81.2)
  🚨 CRITICAL: Both volume AND price showing anomalies

💡 Recommendation:
⚠️ AVOID - High risk detected. Wait for more information.
```

---

## 🎓 Tech Stack

**Phase 1 (Current):**
- Python 3.8+
- yfinance - Stock data API
- pandas - Data manipulation
- numpy - Numerical computing
- scikit-learn - Statistical analysis
- scipy - Scientific computing

**Phase 2 (Upcoming - ML):**
- TensorFlow / PyTorch - Deep learning
- Isolation Forest - Anomaly detection
- LSTM - Time series prediction

**Phase 3 (Upcoming - Real-time):**
- Telethon - Telegram monitoring
- Redis - Real-time caching
- WebSocket - Live data streaming

**Phase 4 (Upcoming - Frontend):**
- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Recharts - Data visualization

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Detection (COMPLETE)
- [x] Volume spike detection
- [x] Price anomaly detection
- [x] Risk scoring system
- [x] Testing framework

### 🔄 Phase 2: Machine Learning (Week 2)
- [ ] Train Isolation Forest model
- [ ] LSTM for price prediction
- [ ] Feature engineering
- [ ] Model evaluation

### 📅 Phase 3: Real-Time Detection (Week 3)
- [ ] Telegram channel monitoring
- [ ] Reddit/Twitter scraping
- [ ] Sentiment analysis (FinBERT)
- [ ] Real-time alert system

### 📅 Phase 4: Web Dashboard (Week 4)
- [ ] Next.js frontend
- [ ] Interactive charts
- [ ] User authentication
- [ ] Email/push notifications
- [ ] Deployment (Vercel + Render)

---

## 🎯 Use Cases

### For Retail Investors
- Get real-time alerts about suspicious stocks
- Avoid pump-and-dump scams
- Make informed investment decisions

### For Researchers
- Study market manipulation patterns
- Analyze historical pump-and-dump cases
- Test detection algorithms

### For Portfolio Projects
- Demonstrate full-stack + ML skills
- Show production-ready code quality
- Prove end-to-end system design ability

---

## 📝 Configuration

Create a `.env` file (copy from `.env.example`):

```bash
# Detection thresholds
VOLUME_SPIKE_THRESHOLD=2.0      # Volume must be 2x+ normal
PRICE_CHANGE_THRESHOLD=5.0      # Price change > 5%
RISK_SCORE_THRESHOLD=60         # Alert if risk > 60

# Data collection
MONITORING_INTERVAL=60          # Check every 60 seconds
DATA_RETENTION_DAYS=90          # Keep 90 days of history
```

---

## 🤝 Contributing

Contributions are welcome! Areas to contribute:

1. **Detection Algorithms** - Improve accuracy, reduce false positives
2. **Data Sources** - Add more stock exchanges (BSE, US markets)
3. **ML Models** - Implement advanced anomaly detection
4. **Testing** - Add more test cases, edge cases
5. **Documentation** - Improve guides, add examples

---

## ⚠️ Disclaimer

**IMPORTANT:** This tool is for **educational purposes only** and is NOT financial advice.

- ❌ This is NOT a trading bot or investment recommendation system
- ❌ Do not use this as the sole basis for investment decisions
- ❌ Always conduct your own research (DYOR)
- ❌ The creators are not SEBI-registered advisors
- ✅ Use this as ONE tool among many for due diligence
- ✅ Past detection accuracy does not guarantee future results

**Investing in stocks involves risk. You can lose money.**

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 👤 Author

**Your Name**
- B.Tech CSE, LPU (2024)
- Portfolio: [your-portfolio.com]
- LinkedIn: [your-linkedin]
- GitHub: [your-github]

---

## 🙏 Acknowledgments

- yfinance API for stock data
- NSE India for market data
- Open-source community

---

## 📧 Contact

Questions or suggestions? Open an issue or reach out:
- Email: your-email@example.com
- Twitter: @yourhandle
- LinkedIn: your-profile

---

**Built with ❤️ to protect retail investors from market manipulation**

⭐ Star this repo if you find it helpful!
