# StockGuard - AI-Powered Stock Anomaly Detection System

## 🎯 Project Purpose

**Primary Goal**: Build a portfolio project that demonstrates full-stack development + machine learning skills to help land software engineering interviews.

**Secondary Goal**: Create a functional system that detects suspicious trading patterns in Indian stock markets, protecting retail investors from pump-and-dump schemes and market manipulation.

---

## 🚀 What You Are Building

A **complete end-to-end application** that:

1. **Monitors Indian stocks** (NSE-listed) for unusual trading activity
2. **Detects anomalies** using machine learning and statistical methods
3. **Analyzes social sentiment** from news and social media
4. **Calculates risk scores** (0-100) for each stock
5. **Displays alerts** via a clean web dashboard
6. **Provides explanations** for why a stock is flagged as risky

---

## 🎓 Skills You Will Demonstrate

### Frontend Skills
- ✅ **Next.js 14** with TypeScript
- ✅ **Server-side rendering (SSR)** for SEO and performance
- ✅ **Tailwind CSS** for modern UI
- ✅ **Data visualization** with Recharts/Chart.js
- ✅ **Responsive design** for mobile/desktop
- ✅ **Real-time updates** using WebSockets/polling

### Backend Skills
- ✅ **Node.js + Express** REST API
- ✅ **PostgreSQL** for data storage
- ✅ **Authentication** (JWT-based, optional)
- ✅ **Microservices architecture** (Node.js + Python services)
- ✅ **API design** (RESTful endpoints)
- ✅ **Error handling** and validation

### Machine Learning/AI Skills
- ✅ **Time series analysis** (stock price/volume patterns)
- ✅ **Anomaly detection** using Isolation Forest
- ✅ **LSTM neural networks** for price prediction
- ✅ **NLP sentiment analysis** with FinBERT/VADER
- ✅ **Feature engineering** for financial data
- ✅ **Model evaluation** and accuracy metrics

### DevOps/Deployment Skills
- ✅ **Docker** for containerization
- ✅ **GitHub Actions** for automated data collection
- ✅ **Vercel** deployment (frontend)
- ✅ **Render/Railway** deployment (backend)
- ✅ **Environment variables** and secrets management
- ✅ **Database hosting** (Supabase/Railway PostgreSQL)

---

## 📦 What You Will Deliver (Final Product)

### 1. **Live Web Application**
- **URL**: `stockguard-ai.vercel.app` (or similar)
- **Features**:
  - Homepage explaining the project
  - Dashboard showing monitored stocks
  - Individual stock detail pages with risk analysis
  - Alert feed of recent suspicious activity
  - Search functionality to analyze any stock on-demand

### 2. **GitHub Repository**
- **Clean codebase** with proper folder structure
- **README.md** with:
  - Project description
  - Architecture diagram
  - Setup instructions
  - API documentation
  - Screenshots/demo
- **Proper commits** showing development progression
- **Documentation** in code (comments, JSDoc)

### 3. **ML Models & Notebooks**
- **Jupyter notebooks** showing:
  - Data exploration and analysis
  - Model training process
  - Accuracy metrics and evaluation
  - Comparison of different approaches
- **Trained models** saved and versioned
- **Explanation** of feature selection and hyperparameters

### 4. **Technical Blog Post** (Optional but Recommended)
- **Medium/Dev.to article** explaining:
  - Problem you're solving
  - Technical challenges you faced
  - Architecture decisions
  - What you learned
- **Helps with**: SEO for your name, shows communication skills

### 5. **Demo Video** (Optional)
- **2-3 minute walkthrough** of the application
- **Shows**: Real-time anomaly detection, risk scoring, UI
- **Upload to**: YouTube (link in README)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                   Next.js + TypeScript                       │
│              (Deployed on Vercel - Free)                     │
│   - Dashboard, Charts, Stock Detail Pages, Alerts           │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/REST API
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                     │
│                   Express + PostgreSQL                       │
│              (Deployed on Render - Free)                     │
│   - User requests, data orchestration, caching              │
└─────────────────┬───────────────────────────────────────────┘
                  │ Calls ML Service
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              ML SERVICE (Python + Flask)                     │
│          Isolation Forest + LSTM + FinBERT                   │
│           (Deployed on Render/HF Spaces)                     │
│   - Anomaly detection, sentiment analysis, risk scoring     │
└─────────────────┬───────────────────────────────────────────┘
                  │ Reads from
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                       │
│                  (Supabase/Railway - Free)                   │
│   - Stock data, anomalies, risk scores, user watchlists     │
└─────────────────────────────────────────────────────────────┘
                  ▲
                  │ Data Pipeline (Python Scripts)
┌─────────────────┴───────────────────────────────────────────┐
│              DATA COLLECTION (Python)                        │
│        yfinance + News API + Reddit API                      │
│          (Runs on GitHub Actions - Cron)                     │
│   - Fetches stock data every 4 hours, stores in DB          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Core Features & How They Work

### Feature 1: Volume Spike Detection
**What it does**: Flags stocks when trading volume suddenly increases (sign of manipulation)

**How it works**:
1. Calculate 30-day average volume for each stock
2. Compare today's volume to the average
3. If today's volume > 2x average → FLAG as suspicious
4. Contributes 30% to risk score

**Example**:
```
Stock: SUZLON.NS
Average volume: 10 million shares/day
Today's volume: 35 million shares/day
Ratio: 3.5x → HIGH RISK
```

### Feature 2: Price Movement Anomaly
**What it does**: Detects unusual price changes (pump-and-dump indicator)

**How it works**:
1. Calculate daily price return (% change)
2. Calculate standard deviation of returns over 30 days
3. If today's return > 2 standard deviations → FLAG
4. Contributes 40% to risk score

**Example**:
```
Stock: YESBANK.NS
Average volatility: ±2% per day
Today's change: +12% in 2 hours with no news
→ HIGH RISK (likely manipulation)
```

### Feature 3: Machine Learning Anomaly Detection
**What it does**: Uses Isolation Forest to find unusual patterns humans might miss

**How it works**:
1. Train model on features: Volume, Close, High, Low, Open, RSI, MACD
2. Model learns what "normal" trading looks like
3. New data points that don't fit the pattern → Anomalies
4. Contributes 30% to risk score

**Why it's powerful**: Detects complex patterns (e.g., "volume spike + price drop + low volatility" = insider selling)

### Feature 4: Social Media Sentiment Analysis
**What it does**: Monitors if a stock is being hyped on social media (pump-and-dump warning)

**How it works**:
1. Scrape mentions from:
   - Google News (stock ticker mentions)
   - Reddit r/IndianStockMarket
   - StockTwits (free API)
2. Run sentiment analysis (FinBERT: positive/negative/neutral)
3. Calculate:
   - Mention spike (mentions today vs. 7-day average)
   - Sentiment score (-1 to +1)
4. Flag if: High mentions + extreme sentiment (very positive = pump hype)

**Example**:
```
Stock: PAYTM.NS
Normal mentions: 5/day
Today's mentions: 150/day
Sentiment: 85% positive (unusual for a struggling stock)
→ HIGH RISK (coordinated pump campaign)
```

### Feature 5: Risk Score Calculation
**What it does**: Combines all signals into a single 0-100 score

**Formula**:
```
Risk Score =
  (Volume Anomaly × 30) +
  (Price Anomaly × 40) +
  (ML Anomaly × 30) +
  (Social Sentiment Spike × 20)
```

**Interpretation**:
- 0-30: Low risk (normal trading)
- 31-60: Medium risk (monitor)
- 61-80: High risk (suspicious activity)
- 81-100: Extreme risk (likely manipulation)

---

## 🎯 Resume Impact

### Before This Project:
```
JOHN DOE
B.Tech CSE, LPU (2024)
Skills: JavaScript, Python, React

Experience:
- Management work (cold calling)
```

### After This Project:
```
JOHN DOE
Full-Stack Developer | ML Enthusiast
B.Tech CSE, LPU (2024)

PROJECTS:
StockGuard - AI-Powered Stock Anomaly Detection System
• Built full-stack application using Next.js, Node.js, and Python
  to detect market manipulation patterns in 100+ Indian stocks
• Implemented Isolation Forest and LSTM models achieving 78%
  accuracy in flagging pump-and-dump schemes
• Integrated NLP sentiment analysis (FinBERT) across 5000+ daily
  social media posts to generate real-time risk scores
• Designed microservices architecture with REST APIs, WebSocket
  updates, and automated data pipelines processing 50K+ records/day
• Deployed on cloud infrastructure (Vercel + Render + Supabase)
  with CI/CD using GitHub Actions

Tech Stack: Next.js, TypeScript, Node.js, Express, Python, Flask,
TensorFlow, PostgreSQL, Docker, Tailwind CSS

🔗 Live Demo | 🔗 GitHub | 🔗 Blog Post

Skills:
Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts
Backend: Node.js, Express, REST APIs, PostgreSQL, Redis
ML/AI: Python, TensorFlow, Scikit-learn, NLP, Time Series Analysis
DevOps: Docker, GitHub Actions, Vercel, Render, Supabase
```

**Interview conversation**:
```
Interviewer: "Tell me about this StockGuard project."

You: "I noticed retail investors in India lose money to pump-and-dump
scams, so I built a system to detect them early. It monitors 100 stocks
in real-time using machine learning.

For the ML side, I used Isolation Forest for anomaly detection and LSTM
for time series prediction. The interesting challenge was feature
engineering - I had to combine volume patterns, price movements, and
social sentiment into meaningful signals.

On the architecture side, I built it as microservices - a Next.js
frontend, Node.js API layer, and Python Flask service for ML inference.
The Python service was separate because TensorFlow dependencies are heavy,
so I didn't want to bloat the Node.js container.

The hardest part was handling false positives - legitimate stocks can have
volume spikes during earnings. I solved this by cross-referencing with news
APIs to filter out known events.

It's deployed on Vercel and Render, with GitHub Actions running data
collection every 4 hours. The database is PostgreSQL on Supabase."

[Interviewer is impressed - you've shown technical depth, problem-solving,
and production deployment experience]
```

---

## ⏰ Timeline: 4-Week Build Plan

### Week 1: Data + ML Foundation
- Set up project structure
- Build data collection pipeline (yfinance)
- Implement anomaly detection models
- Create Jupyter notebooks showing model training
- **Deliverable**: Working Python scripts that detect anomalies

### Week 2: Backend Development
- Build Flask API (ML service)
- Build Node.js Express API (main backend)
- Set up PostgreSQL database
- Create REST endpoints
- **Deliverable**: Working APIs tested with Postman

### Week 3: Frontend Development
- Set up Next.js project with TypeScript
- Build dashboard page (list of stocks + risk scores)
- Build stock detail page (charts + analysis)
- Build alert feed
- Add real-time updates
- **Deliverable**: Functional web app (local)

### Week 4: Integration + Deployment
- Connect frontend to backend
- Add social media sentiment analysis
- Polish UI/UX
- Write documentation (README)
- Deploy to production (Vercel + Render)
- Create demo video
- **Deliverable**: Live application + GitHub repo

---

## 🎓 Learning Outcomes

By building this, you will learn:

### Technical Skills
- How to build and deploy a **production-grade full-stack app**
- How to **train and serve ML models** in a web application
- How to **design REST APIs** and microservices
- How to **work with financial data** and time series
- How to **optimize database queries** for performance
- How to **deploy to cloud platforms** (Vercel, Render, Supabase)

### Soft Skills
- How to **scope a project** realistically
- How to **prioritize features** (MVP vs. nice-to-have)
- How to **document your work** for others
- How to **explain technical concepts** to non-technical people
- How to **showcase your work** in interviews

### Domain Knowledge
- **Financial markets**: How stocks work, what manipulation looks like
- **Data engineering**: ETL pipelines, data cleaning, storage
- **Model deployment**: Difference between training and serving models
- **Real-time systems**: Handling streaming data, caching strategies

---

## 🎯 Success Metrics

**This project is successful if**:

1. ✅ You can **deploy it live** and share a working URL
2. ✅ It **accurately detects** at least 5 real historical pump-and-dump cases
3. ✅ The code is **clean and documented** (other developers can understand it)
4. ✅ You can **confidently explain** every technical decision in interviews
5. ✅ Your **resume gets shortlisted** for at least 3 interviews within 2 months

**Bonus achievements**:
- 🏆 Blog post gets >500 views
- 🏆 GitHub repo gets >50 stars
- 🏆 Someone actually uses it to avoid a scam
- 🏆 You get an interview specifically because of this project

---

## 🚫 What This Project Is NOT

**This is NOT**:
- ❌ A get-rich-quick trading bot
- ❌ Financial advice (you're not SEBI registered)
- ❌ A replacement for professional due diligence
- ❌ Going to predict stock prices with 100% accuracy
- ❌ Going to be sold to BSE/NSE (not the goal)

**This IS**:
- ✅ A **learning project** to demonstrate your skills
- ✅ A **portfolio piece** to get interviews
- ✅ A **functional prototype** that solves a real problem
- ✅ A **conversation starter** in technical interviews
- ✅ **Proof you can build end-to-end systems**

---

## 💡 Key Differentiators (Why This Project Stands Out)

Most B.Tech projects are:
- 😴 To-do lists, blog clones, chat apps
- 😴 Using dummy data
- 😴 Not deployed anywhere
- 😴 No real-world application

**Your project**:
- 🔥 Solves a real problem (investor protection)
- 🔥 Uses real data (live stock markets)
- 🔥 Combines multiple skills (frontend + backend + ML)
- 🔥 Deployed and usable
- 🔥 Has measurable impact (can you detect scams? yes/no)

**When recruiters see 100 resumes with "blog app using MERN stack," yours will stand out.**

---

## 🎤 Elevator Pitch (30 seconds)

*"I built StockGuard, an AI system that protects retail investors from pump-and-dump scams in Indian stock markets. It monitors 100+ stocks in real-time using machine learning to detect unusual trading patterns and social media manipulation. The system combines Isolation Forest anomaly detection, LSTM time series prediction, and NLP sentiment analysis to generate risk scores. It's built with Next.js, Node.js, Python, and deployed on cloud infrastructure. I can show you the live demo."*

**[Hand them your phone showing the live website]**

---

## 📚 Resources You'll Use

### Documentation
- Next.js Docs: https://nextjs.org/docs
- yfinance API: https://pypi.org/project/yfinance/
- Scikit-learn Isolation Forest: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html
- FinBERT for Sentiment: https://huggingface.co/ProsusAI/finbert

### Deployment Platforms
- Vercel (Frontend): https://vercel.com
- Render (Backend): https://render.com
- Supabase (Database): https://supabase.com
- GitHub Actions (Automation): https://github.com/features/actions

### Learning Resources
- Time Series Anomaly Detection: https://www.youtube.com/watch?v=12Xq9OLdQwQ
- Building ML APIs with Flask: https://www.youtube.com/watch?v=s_ht4AKnWZg
- Next.js Full Course: https://www.youtube.com/watch?v=ZVnjOPwW4ZA

---

## ✅ You Are Ready When...

- ✅ You can explain what pump-and-dump schemes are
- ✅ You understand how Isolation Forest works (conceptually)
- ✅ You can describe REST APIs vs. microservices
- ✅ You've set up the project folder structure
- ✅ You've confirmed yfinance downloads stock data successfully

**Next Step**: Execute Week 1 Day-by-Day Plan (see WEEK1_PLAN.md)

---

**Now let's build this. 🚀**
