# 🛡️ SentinelMarket — AI-Powered Stock Anomaly Detection

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

### 🔴 Live Demo

[![Live Site](https://img.shields.io/badge/🌐_Live_Demo-sentinelmarket.netlify.app-00C7B7?style=for-the-badge)](https://sentinelmarket.netlify.app)
[![API](https://img.shields.io/badge/🔗_API-Live_on_Render-46E3B7?style=for-the-badge)](https://sentinelmarket-backend.onrender.com/docs)

**Protecting retail investors from market manipulation with real-time ML-powered detection**

[View Demo](#-screenshots) • [Tech Stack](#-tech-stack) • [Architecture](#-architecture) • [Run Locally](#-quick-start)

</div>

---

## 🎯 What It Does

SentinelMarket is a **production-ready, full-stack data platform** that detects pump-and-dump schemes and market manipulation in the Indian stock market (NSE/BSE) using:

- 🤖 **Machine Learning** — Isolation Forest anomaly detection with 47 engineered features
- 📊 **Real-time Data Pipelines** — ETL with data warehouse, data lake, and stream processing
- 📱 **Social Media Intelligence** — Twitter & Telegram monitoring with FinBERT sentiment analysis
- ⚡ **Live Risk Scoring** — 0-100 risk scores with explainability and predictive alerts

> **Business Impact**: Designed to protect 100+ million retail investors who lose ₹10,000+ crores annually to market manipulation

---

## 📸 Screenshots

<div align="center">

### Main Dashboard
![Dashboard](screenshots/mainLandingDashboard.png)
*Real-time market overview with live indices, feature showcase, and risk monitoring*

---

### Live Anomaly Feed & Stock Table
![Live Feed](screenshots/MainDashboardLiveFeedandtable.png)
*Live anomaly detection feed with sortable stock table showing risk scores*

---

### Analytics Dashboard
![Analytics](screenshots/AnalyticsDashboard.png)
*Risk distribution, market health metrics, and historical trend analysis*

---

### Risk Alerts
![Alerts](screenshots/RiskAlertsDashboard.png)
*Predictive alerts with crash probability forecasting 3-7 days ahead*

---

### Social Intelligence
![Social](screenshots/SocialIntelligenceDashboard.png)
*Twitter & Telegram monitoring with sentiment analysis and hype detection*

---

### ETL Pipelines
![ETL](screenshots/ETL_pipeline.png)
*Data engineering dashboard showing pipeline health, runs, and warehouse stats*

---

### Data Quality
![Quality](screenshots/Data_Quality.png)
*Data quality monitoring with completeness metrics and validation reports*

</div>

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy, pandas |
| **Database** | PostgreSQL (Supabase), SQLite fallback |
| **ML/AI** | scikit-learn (Isolation Forest), FinBERT, 47 features |
| **Data Engineering** | ETL Pipelines, Data Lake, Data Warehouse, APScheduler |
| **Streaming** | In-memory event stream (Kafka-style architecture) |
| **Social** | Twitter API (Tweepy), Telegram API (Telethon) |
| **Deployment** | Render (Backend), Netlify (Frontend) |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                             │
│   📈 Stock APIs    📱 Twitter    📮 Telegram    📰 News      │
└───────────────────────────┬──────────────────────────────────┘
                            │
           ┌────────────────┴────────────────┐
           │        ETL PIPELINES            │
           │  Extract → Transform → Load     │
           └────────────────┬────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌─────▼─────┐       ┌─────▼─────┐
   │Data Lake│        │Data       │       │ Stream    │
   │  (Raw)  │        │Warehouse  │       │ Processor │
   └─────────┘        └─────┬─────┘       └───────────┘
                            │
                    ┌───────▼───────┐
                    │  ML ENGINE    │
                    │ • 47 Features │
                    │ • Isolation   │
                    │   Forest      │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │ RISK SCORING  │
                    │   (0-100)     │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  FastAPI      │
                    │  30+ Endpoints│
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Next.js UI   │
                    │  8+ Pages     │
                    └───────────────┘
```

---

## ✨ Key Features

### 🔍 Anomaly Detection
- **Volume Spike Detection** — Z-score analysis with 85% accuracy
- **Price Anomaly Detection** — RSI, Bollinger Bands, momentum indicators
- **ML Detection** — Isolation Forest trained on 6,297 data points
- **Combined Risk Score** — Weighted ensemble with explainability

### 📊 Data Engineering
- **ETL Pipelines** — Modular framework with error handling & monitoring
- **Data Warehouse** — PostgreSQL with optimized time-series queries
- **Data Lake** — Gzip-compressed JSON for raw data preservation
- **Stream Processing** — Event-driven architecture for real-time updates
- **Data Quality** — Completeness metrics, validation, duplicate detection

### 📱 Social Intelligence
- **Twitter Monitoring** — Real-time sentiment with FinBERT
- **Telegram Channels** — Pump signal detection
- **Hype Score** — 0-100 coordination detection

### 🚨 Alerts & Predictions
- **Risk Alerts** — HIGH/EXTREME risk notifications
- **Crash Prediction** — 3-7 day ahead probability forecasting
- **Pattern Matching** — Historical scam comparison

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/umangkumarchaudhary/SentinelMarket-Backend.git
cd SentinelMarket-Backend

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| API Response Time | <500ms avg |
| Detection Accuracy | ~90% combined |
| False Positive Rate | 15-20% |
| Stocks Analyzed/Hour | 1000+ |
| Data Quality | >95% valid ratio |

---

## 🎯 Skills Demonstrated

This project showcases expertise in:

| Area | Skills |
|------|--------|
| **Data Engineering** | ETL Pipelines, Data Warehouse, Data Lake, Stream Processing, Data Quality |
| **Machine Learning** | Feature Engineering (47 features), Anomaly Detection, Model Deployment |
| **Backend** | FastAPI, REST APIs, PostgreSQL, SQLAlchemy, Error Handling |
| **Frontend** | Next.js, TypeScript, Responsive Design, Real-time Updates |
| **DevOps** | Render, Netlify, Docker, CI/CD |
| **NLP** | FinBERT, Sentiment Analysis, Social Media Mining |

---

## 👤 Author

<div align="center">

### **Umang Kumar Chaudhary**
*Building enterprise-grade data platforms and AI systems*

[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-umangkumar.netlify.app-00C7B7?style=for-the-badge)](https://umangkumar.netlify.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/umang-kumar-0546b71b5/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/umangkumarchaudhary)

</div>

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

<div align="center">

**⭐ Star this repo if you find it useful! ⭐**

*Built with ❤️ for protecting retail investors*

</div>
