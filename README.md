# SentinelMarket - AI-Powered Retail Investor Protection System

## 🎯 Project Vision

**SentinelMarket** is an AI-powered system designed to protect retail investors in the Indian stock market (BSE/NSE) by detecting suspicious trading patterns, social media manipulation, and potential scams in real-time.

## 🚨 The Problem

Retail investors in India lose crores annually due to:
- **Pump-and-dump schemes** (small-cap manipulation)
- **Insider trading patterns** (unrecognized by investors)
- **Penny stock scams**
- **Social media "finfluencer" scams**
- **Telegram/WhatsApp group tips** (blind following)
- **FOMO trading** during market manipulation

## 💡 Solution Overview

An AI system that analyzes stocks in real-time and warns retail investors about suspicious patterns **before** they invest.

### Core Features

1. **Unusual Volume & Price Movement Detector**
   - Monitors sudden volume spikes (manipulation signals)
   - Detects "pump and dump" patterns
   - Real-time alerts for suspicious activity

2. **Social Media Manipulation Scanner**
   - Scrapes Twitter, Telegram, WhatsApp (public groups)
   - Identifies coordinated stock promotion
   - Tracks hype across multiple platforms

3. **Penny Stock Risk Scoring**
   - Analyzes fundamentals of small-cap/penny stocks
   - Checks: promoter holding, financial health, regulatory warnings
   - Risk score: 1-100 (100 = extremely risky)

4. **Historical Pattern Matching**
   - Compares current stock behavior to known scam patterns
   - Machine learning-based pattern recognition

5. **Real-Time Alert System**
   - Browser extension OR mobile app
   - Pre-trade warnings: "⚠️ Warning: Unusual activity detected"
   - Post-analysis risk factor display

6. **Education Dashboard**
   - Recent scams analysis
   - Case studies of manipulation
   - "Learn from others' mistakes"

## 🏗️ Tech Stack

### Data Collection
- **NSE/BSE APIs** - Real-time stock data
- **Twitter API** - Monitor stock mentions
- **Reddit API** - r/IndianStreetBets, r/IndianStockMarket
- **News API** - Cross-check news vs price movement
- **Web scraping** - Telegram public groups (for detection)

### Backend
- **Python + FastAPI** - Main backend API
- **PostgreSQL** - Historical data storage
- **Redis** - Real-time caching
- **Celery** - Background tasks (scraping, analysis)

### ML/AI
- **Anomaly Detection** - Isolation Forest, LSTM for time series
- **Pattern Matching** - Compare current to historical pump-dump patterns
- **NLP** - Sentiment analysis (BERT, FinBERT)
- **Risk Scoring** - Random Forest classifier trained on scam data

### Frontend
- **React + Recharts** - Dashboard visualization
- **WebSockets** - Real-time updates
- **Chrome Extension** - Pre-trade warnings (Zerodha/Groww integration)

### Deployment
- **AWS/Google Cloud** - Cloud infrastructure
- **Docker + Kubernetes** - Containerization and orchestration

## 📋 MVP Development Phases

### Phase 1: Anomaly Detection (2 weeks)
- [ ] Connect to NSE/BSE API (or yfinance for demo)
- [ ] Monitor 100-200 small-cap stocks in real-time
- [ ] Detect unusual volume spikes (>200% of average)
- [ ] Detect price spikes (>10% in hour without news)
- [ ] Simple dashboard showing flagged stocks

### Phase 2: Social Media Monitoring (2 weeks)
- [ ] Scrape Twitter for stock mentions
- [ ] Count mentions per stock per hour
- [ ] Detect coordinated promotion (50+ mentions in short time)
- [ ] Show "social media hype score"

### Phase 3: Risk Scoring System (1 week)
- [ ] Combine: Volume anomaly + Price movement + Social media hype + Fundamentals
- [ ] Calculate risk score 1-100
- [ ] Show clear warning if >70

## 🎯 Career Goals

This project demonstrates expertise in:
- **Data Engineering**: Real-time data pipelines, ETL processes
- **Machine Learning**: Anomaly detection, pattern recognition, NLP
- **Data Science**: Statistical analysis, risk modeling, predictive analytics
- **Full-Stack Development**: API development, real-time systems, frontend visualization

## 📁 Project Structure

```
sentinel-market/
├── backend/              # FastAPI backend
│   ├── api/             # API endpoints
│   ├── models/          # ML models
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── frontend/            # React dashboard
├── ml_engine/           # ML/AI components
│   ├── anomaly_detection/
│   ├── pattern_matching/
│   └── risk_scoring/
├── data_collectors/     # Data scraping/collection
│   ├── stock_data/
│   ├── social_media/
│   └── news/
├── database/            # Database schemas and migrations
├── docker/              # Docker configurations
└── docs/                # Documentation
```

## 🚀 Getting Started

(To be implemented)

## 📝 License

MIT License

## 🤝 Contributing

This is a portfolio project for career advancement in Data Engineering, ML, and Data Science roles.

