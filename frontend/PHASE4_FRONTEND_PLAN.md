# Phase 4: Frontend Dashboard Plan
## Complete Frontend Implementation Strategy

**Goal:** Build a professional, production-ready web dashboard that showcases the entire SentinelMarket system with visual impact for resume reviewers.

---

## 🎯 Dashboard Requirements

### Core Features to Display:

1. **Stock Market Selection**
   - Toggle between NSE (National Stock Exchange) and BSE (Bombay Stock Exchange)
   - Show stocks from both exchanges
   - Filter by exchange

2. **Risk Level Display**
   - Visual risk indicators (color-coded)
   - Risk level badges (LOW, MEDIUM, HIGH, EXTREME)
   - Risk score visualization (0-100 scale)

3. **Real-Time Monitoring**
   - Live stock data updates
   - Real-time risk score calculations
   - Alert notifications

4. **Data Visualization**
   - Charts showing price movements
   - Volume analysis
   - Risk score trends
   - Historical patterns

---

## 📊 Dashboard Pages & Components

### Page 1: **Home/Dashboard** (Main Page)

**Purpose:** Overview of all monitored stocks with risk levels

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Header: SentinelMarket | NSE/BSE Toggle | Settings    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Total Stocks │  │ High Risk    │  │ Alerts Today │  │
│  │     150      │  │      12     │  │      8       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Stock List Table (Sortable, Filterable)         │  │
│  ├──────┬────────┬────────┬────────┬────────┬───────┤  │
│  │Ticker│Exchange│Risk    │Score   │Status  │Action │  │
│  ├──────┼────────┼────────┼────────┼────────┼───────┤  │
│  │SUZLON│  NSE   │🟠 HIGH │  72/100│⚠️ Alert│ View  │  │
│  │RELIANCE│ NSE  │🟢 LOW  │  15/100│✅ Safe │ View  │  │
│  │...   │  ...   │  ...   │  ...   │  ...   │  ...  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Recent Alerts Feed                               │  │
│  │  • SUZLON flagged as HIGH RISK (2 min ago)       │  │
│  │  • YESBANK volume spike detected (15 min ago)    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Components Needed:**
- `Header` - Navigation, exchange toggle, settings
- `StatsCards` - Total stocks, high risk count, alerts
- `StockTable` - Sortable table with all stocks
- `AlertFeed` - Recent alerts/notifications
- `RiskBadge` - Color-coded risk level indicator

---

### Page 2: **Stock Detail Page**

**Purpose:** Detailed analysis of a single stock

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back | SUZLON (NSE) | Last Updated: 2:30 PM         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Risk Assessment                                 │  │
│  │  Risk Score: 72/100  [████████░░] 🟠 HIGH RISK  │  │
│  │  Recommendation: ⚠️ AVOID - High risk detected │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Price Chart  │  │ Volume Chart │  │ Risk Trend   │  │
│  │  (Line)      │  │  (Bar)       │  │  (Area)      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Detection Breakdown                             │  │
│  │  Volume Spike:    35/100 (35% weight)           │  │
│  │  Price Anomaly:   40/100 (40% weight)           │  │
│  │  ML Detection:    76/100 (25% weight) ← NEW!    │  │
│  │  Social Sentiment: 0/100 (10% weight)           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Red Flags                                        │  │
│  │  ⚠️ HIGH volume spike (3.5x normal)              │  │
│  │  ⚠️ UNUSUAL price movement (14.2%)               │  │
│  │  🤖 ML MODEL: High risk detected (score: 76)     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Key Metrics                                      │  │
│  │  Current Price: ₹51.48                           │  │
│  │  Volume: 58.3M (0.81x average)                  │  │
│  │  RSI: 78.5 (Overbought)                          │  │
│  │  Z-Score: 2.9                                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Components Needed:**
- `RiskMeter` - Visual risk score (0-100)
- `PriceChart` - Price movement over time
- `VolumeChart` - Volume analysis
- `RiskTrendChart` - Risk score over time
- `DetectionBreakdown` - Individual scores breakdown
- `RedFlagsList` - List of detected red flags
- `KeyMetrics` - Current stock metrics

---

### Page 3: **Alerts Page**

**Purpose:** All alerts and notifications

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Alerts & Notifications                                  │
├─────────────────────────────────────────────────────────┤
│  Filter: [All] [High Risk] [ML Alerts] [Today] [Week]   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🟠 HIGH RISK - SUZLON                           │  │
│  │  Risk Score: 72/100 | 2 minutes ago              │  │
│  │  ML model detected anomaly pattern               │  │
│  │  [View Details]                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ⚠️ MEDIUM RISK - YESBANK                        │  │
│  │  Risk Score: 45/100 | 15 minutes ago             │  │
│  │  Volume spike detected                           │  │
│  │  [View Details]                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Components Needed:**
- `AlertCard` - Individual alert component
- `AlertFilters` - Filter alerts by type/date
- `AlertTimeline` - Chronological alert list

---

### Page 4: **Analytics/Insights Page** (Optional)

**Purpose:** Overall system analytics

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Analytics & Insights                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Risk         │  │ Detection    │  │ Exchange     │  │
│  │ Distribution │  │ Accuracy    │  │ Comparison   │  │
│  │  (Pie Chart) │  │  (Gauge)    │  │  (Bar Chart) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Top 10 Riskiest Stocks (NSE + BSE)             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Design Requirements

### Color Scheme (Based on Your Preferences):
- **Background**: White (#FFFFFF)
- **Text**: Pure Black (#000000)
- **Primary Accent**: Red (#FF0000) - for high risk
- **Secondary Accent**: Blue (#0000FF) - for information
- **Risk Levels**:
  - LOW (0-30): Green (#00FF00)
  - MEDIUM (31-60): Yellow (#FFFF00)
  - HIGH (61-80): Orange (#FFA500)
  - EXTREME (81-100): Red (#FF0000)

### Design Principles:
- Clean, professional look
- No funky colors (as per your preference)
- Clear visual hierarchy
- Easy to read and navigate
- Mobile responsive

---

## 🔧 Technical Stack

### Frontend (Already Set Up):
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (likely, based on postcss.config.mjs)

### Additional Libraries Needed:
- **Recharts** - Chart library (for visualizations)
- **Axios/Fetch** - API calls to backend
- **WebSocket Client** - Real-time updates (optional)
- **Date-fns** - Date formatting

---

## 📡 Backend API Requirements

### API Endpoints Needed:

1. **GET /api/stocks**
   - Get list of all stocks (NSE/BSE)
   - Query params: `exchange` (nse/bse), `risk_level`, `limit`, `offset`
   - Returns: Array of stocks with risk scores

2. **GET /api/stocks/:ticker**
   - Get detailed analysis for single stock
   - Returns: Full risk assessment, charts data, metrics

3. **GET /api/stocks/:ticker/history**
   - Get historical data for charts
   - Query params: `period` (1d, 1w, 1m, 3m, 6m, 1y)
   - Returns: Price, volume, risk score history

4. **GET /api/alerts**
   - Get recent alerts
   - Query params: `limit`, `risk_level`, `exchange`
   - Returns: Array of alerts

5. **GET /api/analytics**
   - Get overall statistics
   - Returns: Total stocks, risk distribution, accuracy metrics

6. **WebSocket /ws**
   - Real-time updates for stock prices and risk scores
   - Push notifications for new alerts

---

## 🗄️ Database Schema (PostgreSQL)

### Tables Needed:

1. **stocks**
   - id, ticker, exchange (nse/bse), name, sector
   - created_at, updated_at

2. **stock_data**
   - id, stock_id, date, open, high, low, close, volume
   - risk_score, risk_level
   - created_at

3. **risk_assessments**
   - id, stock_id, timestamp
   - volume_score, price_score, ml_score, social_score
   - final_risk_score, risk_level
   - red_flags (JSON), details (JSON)

4. **alerts**
   - id, stock_id, alert_type, risk_level, message
   - created_at, read_at

5. **ml_predictions**
   - id, stock_id, timestamp
   - anomaly_score, risk_score, is_anomaly
   - features (JSON)

---

## 📱 Component Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Dashboard (home)
│   ├── stock/[ticker]/page.tsx     # Stock detail page
│   ├── alerts/page.tsx              # Alerts page
│   └── analytics/page.tsx           # Analytics page
│
├── components/
│   ├── Header.tsx                   # Navigation header
│   ├── ExchangeToggle.tsx           # NSE/BSE toggle
│   ├── StatsCards.tsx               # Summary statistics
│   ├── StockTable.tsx               # Stock list table
│   ├── RiskBadge.tsx                # Risk level badge
│   ├── RiskMeter.tsx                # Visual risk meter
│   ├── PriceChart.tsx               # Price chart
│   ├── VolumeChart.tsx              # Volume chart
│   ├── RiskTrendChart.tsx           # Risk trend chart
│   ├── DetectionBreakdown.tsx       # Score breakdown
│   ├── RedFlagsList.tsx             # Red flags display
│   ├── KeyMetrics.tsx               # Stock metrics
│   ├── AlertCard.tsx                # Alert component
│   └── AlertFeed.tsx                # Alert feed
│
├── lib/
│   ├── api.ts                       # API client
│   ├── types.ts                     # TypeScript types
│   └── utils.ts                     # Utility functions
│
└── styles/
    └── globals.css                  # Global styles
```

---

## 🎯 Key Features to Implement

### 1. **Exchange Selection (NSE/BSE)**
- Toggle button in header
- Filter stocks by exchange
- Show exchange badge on each stock
- Separate analytics for each exchange

### 2. **Risk Level Display**
- Color-coded badges (Green/Yellow/Orange/Red)
- Risk score visualization (progress bar, gauge)
- Risk level text (LOW, MEDIUM, HIGH, EXTREME)
- Visual risk meter (0-100 scale)

### 3. **Real-Time Updates**
- WebSocket connection for live data
- Auto-refresh every 30 seconds (fallback)
- Live risk score updates
- Alert notifications

### 4. **Data Visualization**
- Price chart (line chart, candlestick)
- Volume chart (bar chart)
- Risk score trend (area chart)
- Risk distribution (pie chart)
- Exchange comparison (bar chart)

### 5. **Interactive Features**
- Search stocks
- Filter by risk level
- Sort by risk score, ticker, exchange
- Click stock to see details
- Export data (CSV, PDF)

---

## 🚀 Implementation Phases



### Phase 4B: Frontend Foundation (Week 2)
- Set up Next.js pages
- Create base components
- Implement API client
- Basic layout and navigation
- Exchange toggle functionality

### Phase 4C: Dashboard & Charts (Week 3)
- Stock table with sorting/filtering
- Risk level display
- Charts (price, volume, risk trend)
- Stock detail page
- Alerts page

### Phase 4D: Real-Time & Polish (Week 4)
- WebSocket integration
- Real-time updates
- Responsive design
- Error handling
- Loading states
- Deployment

---

## 📊 Data Flow

```
User Browser
    ↓
Next.js Frontend
    ↓ (API Calls)
FastAPI Backend
    ↓
├── PostgreSQL (Historical Data)
├── ML Model (Risk Scoring)
└── yfinance API (Live Stock Data)
    ↓
Frontend Displays:
- Stock List
- Risk Scores
- Charts
- Alerts
```

---

## 🎨 UI Mockup Ideas

### Dashboard Table:
```
| Ticker  | Exchange | Risk Score | Risk Level | Status | Action |
|---------|----------|------------|------------|--------|--------|
| SUZLON  | NSE      | 72/100     | 🟠 HIGH    | ⚠️     | View   |
| RELIANCE| NSE      | 15/100     | 🟢 LOW     | ✅     | View   |
| TCS     | NSE      | 8/100      | 🟢 LOW     | ✅     | View   |
| YESBANK | BSE      | 65/100     | 🟠 HIGH    | ⚠️     | View   |
```

### Risk Badge Design:
```
🟢 LOW RISK (0-30)
🟡 MEDIUM RISK (31-60)
🟠 HIGH RISK (61-80)
🔴 EXTREME RISK (81-100)
```

### Exchange Toggle:
```
[ NSE ] [ BSE ]
  ↑       ↑
Active  Inactive
```

---

## 🔌 API Integration Points

### Connect Frontend to Backend:

1. **Stock List API**
   ```typescript
   GET /api/stocks?exchange=nse&risk_level=high
   Response: {
     stocks: [
       {
         ticker: "SUZLON",
         exchange: "NSE",
         risk_score: 72,
         risk_level: "HIGH",
         price: 51.48,
         change: -2.04
       }
     ]
   }
   ```

2. **Stock Detail API**
   ```typescript
   GET /api/stocks/SUZLON
   Response: {
     ticker: "SUZLON",
     exchange: "NSE",
     risk_score: 72,
     risk_level: "HIGH",
     individual_scores: {
       volume_spike: 35,
       price_anomaly: 40,
       ml_anomaly: 76,
       social_sentiment: 0
     },
     red_flags: [...],
     charts_data: {
       price: [...],
       volume: [...],
       risk_trend: [...]
     }
   }
   ```

---

## 📱 Responsive Design

### Desktop (Default):
- Full dashboard with all features
- Side-by-side charts
- Full table view

### Tablet:
- Stacked layout
- Collapsible sections
- Touch-friendly buttons

### Mobile:
- Simplified view
- Card-based layout
- Swipe gestures
- Bottom navigation

---

## 🎯 Success Criteria

### Must Have:
- ✅ Display NSE and BSE stocks
- ✅ Show risk levels clearly
- ✅ Real-time risk score updates
- ✅ Interactive charts
- ✅ Stock detail pages
- ✅ Alerts page
- ✅ Responsive design

### Nice to Have:
- 🔄 Real-time WebSocket updates
- 🔄 Export functionality
- 🔄 User watchlists
- 🔄 Email notifications
- 🔄 Dark mode toggle

---

## 🚦 Next Steps

1. **Review this plan** - Make sure it covers everything
2. **Set up backend API** - FastAPI with endpoints
3. **Create database** - PostgreSQL schema
4. **Build frontend components** - Start with base components
5. **Connect frontend to backend** - API integration
6. **Add charts** - Data visualization
7. **Deploy** - Make it live

---

## 💡 Key Decisions to Make

1. **Backend Framework**
   - FastAPI (Python) - matches your ML stack
   - Or Node.js/Express - if you prefer JavaScript

2. **Database**
   - PostgreSQL (recommended)
   - Or SQLite for development

3. **Real-Time Updates**
   - WebSocket (better UX)
   - Or Polling (simpler, less real-time)

4. **Deployment**
   - Vercel (frontend) + Render/Railway (backend)
   - Or AWS/GCP for full control

---

## 📝 Notes

- Keep UI clean and professional (white background, black text)
- Use red/blue as accent colors
- Make risk levels very visible
- Show both NSE and BSE clearly
- Make it easy to understand for non-technical reviewers

---

**Ready to proceed? Let me know if you want to adjust anything in this plan!**

