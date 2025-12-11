# Feature Engineering Guide
## What Makes Pump-and-Dump Days Different from Normal Days?

This document explains the **NEW features** we extract to detect pump-and-dump schemes. These features go beyond the basic volume/price analysis from Phase 1.

---

## 🎯 Core Insight

**Pump-and-dump schemes have distinct patterns that normal trading days don't:**

1. **Volume-Price Divergence** - Volume spikes but price doesn't sustain
2. **Rapid Acceleration** - Price accelerates quickly then reverses
3. **Unusual Intraday Patterns** - Concentrated trading, unusual ranges
4. **Multi-Day Momentum** - Momentum builds then collapses
5. **Liquidity Anomalies** - Low liquidity makes manipulation easier
6. **Price Instability** - More oscillation during manipulation
7. **Reversal Patterns** - Classic pump-then-dump pattern

---

## 📊 Feature Categories

### 1. **Volume-Price Divergence Features** (5 features)

**Why it matters:**
- Normal trading: Volume and price move together
- Pump-and-dump: Volume spikes but price doesn't sustain (divergence)

**Features:**
- `volume_price_correlation` - Rolling correlation (low = divergence)
- `volume_price_ratio` - Volume spike vs price change ratio
- `volume_acceleration` - How fast volume is changing
- `price_acceleration` - How fast price is changing
- `volume_price_divergence` - Combined divergence score

**Example:**
```
Normal Day: Volume 2x, Price +5% → Correlation: 0.7 (high)
Pump Day: Volume 5x, Price +3% → Correlation: 0.2 (low = divergence!)
```

---

### 2. **Price Acceleration Features** (5 features)

**Why it matters:**
- Normal trading: Gradual price changes
- Pump-and-dump: Rapid acceleration (pump) then deceleration (dump)

**Features:**
- `price_acceleration` - Rate of change of returns
- `price_acceleration_rate` - How fast acceleration is changing
- `price_accel_magnitude` - Absolute acceleration value
- `sudden_acceleration_zscore` - Z-score of acceleration (detects sudden spikes)
- `acceleration_reversal` - Positive then negative acceleration (pump→dump)

**Example:**
```
Normal Day: Price changes gradually → Acceleration: 0.001
Pump Day: Price jumps 10% in 2 hours → Acceleration: 0.05 (50x higher!)
```

---

### 3. **Intraday Pattern Features** (6 features)

**Why it matters:**
- Normal trading: Price moves within normal range
- Pump-and-dump: Unusual intraday patterns (close near high during pump, near low during dump)

**Features:**
- `intraday_range_pct` - High-Low range as % of close
- `intraday_range_ratio` - Range vs historical average
- `close_position_in_range` - Where close falls (0=low, 1=high)
- `gap_pct` - Gap between previous close and current open
- `gap_filled` - Whether gap was filled (pump-and-dump often doesn't fill)
- `intraday_volatility_ratio` - Intraday volatility vs average

**Example:**
```
Normal Day: Range 2%, Close at 0.5 (middle) → Normal
Pump Day: Range 8%, Close at 0.95 (near high) → Suspicious!
```

---

### 4. **Multi-Day Momentum Features** (6 features)

**Why it matters:**
- Normal trading: Consistent momentum or gradual changes
- Pump-and-dump: Momentum builds over 2-3 days then collapses

**Features:**
- `momentum_3d` - 3-day cumulative returns
- `momentum_5d` - 5-day cumulative returns
- `momentum_change` - Change in momentum (acceleration)
- `momentum_reversal` - Positive momentum followed by negative
- `momentum_consistency` - How consistent momentum is (pump-and-dump: inconsistent)
- `momentum_volume_ratio` - Momentum vs volume ratio

**Example:**
```
Normal Trend: +2%, +1.5%, +1% → Consistent momentum
Pump Pattern: +5%, +8%, +12%, then -15% → Reversal detected!
```

---

### 5. **Liquidity Features** (6 features)

**Why it matters:**
- Normal trading: Consistent liquidity
- Pump-and-dump: Low liquidity stocks are easier to manipulate

**Features:**
- `volume_to_price_ratio` - Trading volume relative to price
- `volume_price_ratio_vs_avg` - Ratio vs historical average
- `dollar_volume` - Total dollar value traded (Volume × Price)
- `dollar_volume_ratio` - Dollar volume vs average
- `price_impact` - How much price moves per unit volume (low = high liquidity)
- `liquidity_score` - Inverse of price impact (lower = easier to manipulate)

**Example:**
```
High Liquidity Stock: Price impact 0.0001 → Hard to manipulate
Low Liquidity Stock: Price impact 0.01 → Easy to manipulate (pump target)
```

---

### 6. **Price Stability Features** (6 features)

**Why it matters:**
- Normal trading: Relatively stable price movements
- Pump-and-dump: Price oscillates more during manipulation

**Features:**
- `price_volatility` - Rolling standard deviation of returns
- `volatility_ratio` - Volatility vs historical average
- `price_oscillation` - Number of direction changes (up/down)
- `price_stability_score` - Inverse of volatility
- `hl_spread` - High-Low spread (intraday range)
- `hl_spread_ratio` - HL spread vs average

**Example:**
```
Normal Day: Volatility 1.5%, 2 direction changes → Stable
Pump Day: Volatility 5%, 8 direction changes → Unstable!
```

---

### 7. **Volume Distribution Features** (4 features)

**Why it matters:**
- Normal trading: Consistent volume patterns
- Pump-and-dump: Volume patterns differ (concentrated, inconsistent)

**Features:**
- `volume_trend` - Increasing/decreasing volume trend
- `volume_consistency` - How consistent volume is (pump-and-dump: inconsistent)
- `volume_spike_duration` - Consecutive days of high volume
- `volume_mean_reversion` - Distance from average volume

**Example:**
```
Normal Trading: Volume consistent (CV = 0.2) → Consistent
Pump-and-Dump: Volume spikes then drops (CV = 0.8) → Inconsistent!
```

---

### 8. **Time-Based Features** (5 features)

**Why it matters:**
- Pump-and-dump may occur on specific days (weekends, month-end)

**Features:**
- `day_of_week` - Day of week (0=Monday, 6=Sunday)
- `is_weekend` - Whether it's weekend
- `day_of_month` - Day of month (1-31)
- `is_month_end` - Last 3 days of month
- `is_month_beginning` - First 3 days of month

**Note:** These help identify patterns but may not be strong indicators alone.

---

### 9. **Reversal Pattern Features** (4 features)

**Why it matters:**
- Classic pump-and-dump: Price spikes then drops

**Features:**
- `reversal_pattern` - Positive return followed by negative (5% threshold)
- `reversal_magnitude` - Size of reversal
- `pump_dump_pattern` - High positive then high negative (10% threshold)
- `price_reversal_score` - Combined reversal likelihood

**Example:**
```
Normal Day: +2%, then +1% → No reversal
Pump-Dump: +12%, then -15% → Reversal pattern detected!
```

---

## 📈 Total Features: **47 Features**

### Summary by Category:
- Volume-Price Divergence: 5 features
- Price Acceleration: 5 features
- Intraday Patterns: 6 features
- Multi-Day Momentum: 6 features
- Liquidity: 6 features
- Price Stability: 6 features
- Volume Distribution: 4 features
- Time-Based: 5 features
- Reversal Patterns: 4 features

---

## 🔍 How These Features Help Detect Pump-and-Dump

### Normal Trading Day:
```
- Volume-Price Correlation: 0.7 (high)
- Price Acceleration: 0.001 (gradual)
- Intraday Range: 2% (normal)
- Momentum: Consistent
- Liquidity: High
- Stability: Stable
→ Risk Score: LOW
```

### Pump-and-Dump Day:
```
- Volume-Price Correlation: 0.2 (low = divergence!)
- Price Acceleration: 0.05 (rapid!)
- Intraday Range: 8% (unusual!)
- Momentum: Reversal pattern
- Liquidity: Low
- Stability: Unstable
→ Risk Score: HIGH
```

---

## 🎯 Key Differentiators

**What makes pump-and-dump DIFFERENT:**

1. **Divergence** - Volume and price don't move together
2. **Acceleration** - Rapid price changes (not gradual)
3. **Reversal** - Price spikes then drops (classic pattern)
4. **Instability** - More oscillation than normal
5. **Low Liquidity** - Easier to manipulate
6. **Inconsistent Patterns** - Volume/price patterns don't match normal trading

---

## 💻 Usage

```python
from src.ml.feature_engineer import FeatureEngineer, extract_features
from src.data.stock_data_fetcher import StockDataFetcher

# Fetch stock data
fetcher = StockDataFetcher()
data = fetcher.fetch_historical_data("SUZLON", period="3mo")

# Extract features
engineer = FeatureEngineer(window_days=30)
features = engineer.extract_features(data)

# Or use convenience function
features = extract_features(data)

print(f"Extracted {len(features.columns)} features")
print(features.head())
```

---

## 🚀 Next Steps

1. **Test feature extraction** on multiple stocks
2. **Train Isolation Forest** using these features
3. **Evaluate** which features are most important
4. **Optimize** feature selection if needed

---

## 📝 Notes

- These features complement (not replace) Phase 1 features
- Some features may have NaN values (handle in ML pipeline)
- Features are designed to capture pump-and-dump patterns specifically
- Time-based features may need market context (index data) for better results

---

**Total Features: 47**  
**Focus: What makes pump-and-dump DIFFERENT from normal trading**

