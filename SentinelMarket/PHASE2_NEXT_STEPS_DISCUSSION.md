# Phase 2: Next Steps Discussion
## What We Need to Do After Feature Engineering

**Current Status:**
- ✅ Phase 1: Statistical detection (complete)
- ✅ Feature Engineering: 47 features extracted (complete)
- 🔄 Next: Use features with ML models

---

## 🎯 Goal

**Use the 47 features we extracted to train ML models that can detect pump-and-dump patterns better than statistical methods alone.**

---

## 📋 Next Steps Overview

### Step 1: **Data Collection & Preparation** (Foundation)
### Step 2: **Train Isolation Forest Model** (First ML Model)
### Step 3: **Evaluate & Optimize** (Make sure it works)
### Step 4: **Integrate with Risk Scorer** (Connect to existing system)
### Step 5: **Add LSTM Model** (Optional, for pattern matching)

---

## 🔍 Step 1: Data Collection & Preparation

### What We Need:
1. **Training Data**
   - Historical stock data for 100+ stocks
   - 3-6 months of data per stock
   - Mix of normal and potentially suspicious days

2. **Feature Extraction**
   - Extract 47 features for each day
   - Handle missing values (NaN)
   - Normalize/scale features if needed

3. **Data Format**
   - DataFrame with: Date, Stock, 47 features
   - Ready for ML model training

### Questions to Discuss:
- **How many stocks?** (100? 200? 500?)
- **How much historical data?** (3 months? 6 months? 1 year?)
- **Do we need labeled data?** (Isolation Forest doesn't need labels, but evaluation does)
- **How to handle missing values?** (Fill with median? Drop rows?)

### Challenges:
- Some features may have NaN values (rolling windows, etc.)
- Need enough data for model to learn patterns
- Data quality (yfinance may have gaps)

---

## 🤖 Step 2: Train Isolation Forest Model ✅ COMPLETE

### What Was Implemented:

1. **Isolation Forest Module** ✅
   - `src/ml/isolation_forest.py`
   - Class: `IsolationForestDetector`
   - Methods: `train()`, `predict()`, `predict_single()`, `save_model()`, `load_model()`, `get_feature_importance()`

2. **Training Script** ✅
   - `train_isolation_forest.py`
   - Interactive script to train model
   - Loads training data, trains, saves model

3. **Model Features:**
   - ✅ Trains on 47 features
   - ✅ Normalizes features (StandardScaler)
   - ✅ Handles missing values
   - ✅ Converts predictions to risk scores (0-100)
   - ✅ Saves/loads model (joblib)
   - ✅ Feature importance analysis

### Model Parameters (Default):
- `contamination`: 0.1 (10% expected anomalies)
- `n_estimators`: 100 trees
- `random_state`: 42 (reproducible)
- Uses all 47 features

### Usage:

**Train Model:**
```bash
python train_isolation_forest.py
```

**In Python:**
```python
from src.ml.isolation_forest import IsolationForestDetector
import pandas as pd

# Load training data
training_data = pd.read_csv("training_data.csv")

# Train model
detector = IsolationForestDetector(contamination=0.1, n_estimators=100)
detector.train(training_data)

# Save model
detector.save_model("models/isolation_forest.pkl")

# Predict on new data
results = detector.predict(new_data)
```

### Expected Output:
- ✅ Trained model file: `models/isolation_forest.pkl`
- ✅ Model predicts: -1 (anomaly) or +1 (normal)
- ✅ Converts to risk score: 0-100
- ✅ Training statistics and feature importance

---

## 📊 Step 3: Evaluate & Optimize ✅ COMPLETE

### What Was Implemented:

1. **Model Evaluator Module** ✅
   - `src/ml/model_evaluator.py`
   - Class: `ModelEvaluator`
   - Methods: `evaluate_model()`, `evaluate_parameters()`, `generate_report()`

2. **Evaluation Scripts** ✅
   - `evaluate_model.py` - Evaluate trained model
   - `optimize_parameters.py` - Find optimal parameters
   - `test_model_evaluation.py` - Test evaluation module

3. **Evaluation Features:**
   - ✅ Model performance statistics
   - ✅ Risk score distribution analysis
   - ✅ Per-stock analysis
   - ✅ Comparison with Phase 1 methods
   - ✅ Parameter optimization (tests multiple combinations)
   - ✅ Evaluation reports

### Evaluation Metrics:

**Without Labels (Unsupervised):**
- Anomaly detection rate
- Risk score distribution
- Per-stock risk analysis
- Comparison with Phase 1 methods

**Parameter Optimization:**
- Tests multiple contamination rates (0.05, 0.1, 0.15)
- Tests multiple tree counts (50, 100, 200)
- Finds optimal combination
- Measures actual vs expected anomaly rate

### Usage:

**Evaluate Model:**
```bash
python evaluate_model.py
```

**Optimize Parameters:**
```bash
python optimize_parameters.py
```

**In Python:**
```python
from src.ml.model_evaluator import ModelEvaluator

evaluator = ModelEvaluator()
results = evaluator.evaluate_model(predictions, phase1_scores)

# Optimize parameters
opt_results = evaluator.evaluate_parameters(
    training_data,
    contamination_range=[0.05, 0.1, 0.15],
    n_estimators_range=[50, 100, 200]
)
```

### Expected Output:
- ✅ Model performance statistics
- ✅ Risk distribution analysis
- ✅ Top risky stocks identification
- ✅ Comparison with Phase 1 (if available)
- ✅ Optimal parameter recommendations
- ✅ Evaluation reports

---

## 🔗 Step 4: Integrate with Risk Scorer ✅ COMPLETE

### What Was Implemented:

1. **ML Integration in Risk Scorer** ✅
   - Updated `risk_scorer.py` to include Isolation Forest
   - Automatic model loading with fallback
   - Feature extraction integrated
   - ML score included in weighted calculation

2. **Real-World Error Handling** ✅
   - Model file not found → Falls back to Phase 1
   - Model loading error → Graceful fallback
   - Feature extraction fails → Handles gracefully
   - Missing features → Fills with defaults
   - ML unavailable → Redistributes weights to Phase 1

3. **Updated Risk Score Calculation** ✅
   - With ML: Volume (30%) + Price (35%) + ML (25%) + Social (10%)
   - Without ML: Volume (35%) + Price (40%) + Social (15%) + ML (0%)
   - Automatic weight redistribution when ML unavailable

4. **Enhanced Output** ✅
   - ML status in results (enabled/disabled, errors)
   - ML details in output
   - ML red flags in warnings
   - Combined ML + Statistical flags

5. **Integration Test Script** ✅
   - `test_integration.py` - Tests all scenarios
   - ML available scenario
   - ML not available scenario
   - Error handling scenario
   - Batch analysis scenario

### Real-World Scenarios Handled:

✅ **Model file not found** → Falls back to Phase 1, continues working
✅ **Model loading error** → Catches exception, uses Phase 1
✅ **Feature extraction fails** → Returns ML score 0, continues
✅ **Missing features** → Handles gracefully, fills defaults
✅ **ML modules not available** → Detects at import, disables ML
✅ **Insufficient data** → Handles edge cases
✅ **Batch processing** → Works with/without ML

### Usage:

**With ML Model:**
```python
from src.detectors.risk_scorer import RiskScorer
from src.data.stock_data_fetcher import StockDataFetcher

# Initialize (automatically loads ML if available)
scorer = RiskScorer(use_ml=True)

# Or specify model path
scorer = RiskScorer(ml_model_path="models/isolation_forest.pkl", use_ml=True)

# Calculate risk (ML included automatically)
fetcher = StockDataFetcher()
data = fetcher.fetch_historical_data("SUZLON", period="3mo")
result = scorer.calculate_risk_score(data, "SUZLON")

# Check ML status
print(f"ML Enabled: {result['ml_status']['enabled']}")
print(f"ML Score: {result['ml_status']['score']}")
```

**Without ML (Fallback):**
```python
# Disable ML explicitly
scorer = RiskScorer(use_ml=False)

# Or if model not found, automatically falls back
# System continues working with Phase 1 methods
```

### Expected Output:
- ✅ Combined risk score (Phase 1 + ML)
- ✅ ML status and score in results
- ✅ ML red flags if high risk detected
- ✅ Graceful fallback if ML unavailable
- ✅ Error information in details

### ✅ Integration Test Results:
- **ML Model Trained**: ✅ 6297 samples, 47 features
- **Model Saved**: ✅ `models/isolation_forest.pkl`
- **Integration Test**: ✅ PASSED
- **ML Working**: ✅ Model loads and predicts correctly
- **Combined Scoring**: ✅ Phase 1 + ML working together

### Test Results Example:
```
Risk Score: 19/100 (MINIMAL RISK)
ML Score: 76/100 (High risk detected by ML)
ML Enabled: True
Red Flags: ⚠️ ML MODEL: High risk detected (score: 76)
```

**Note**: ML detected high risk (76) but combined score is low (19) because Phase 1 methods (Volume: 0, Price: 0) show no anomalies. This demonstrates the weighted combination working correctly.

---

## 🧠 Step 5: Add LSTM Model (Optional, Later)

### What We Need to Do:

1. **Create LSTM Module**
   - `src/ml/lstm_model.py`
   - Time-series pattern matching
   - Compare to historical pump-and-dump cases

2. **Train LSTM**
   - Input: Time-series sequences (e.g., 10 days of features)
   - Output: Pattern similarity score
   - More complex than Isolation Forest

3. **Combine with Isolation Forest**
   - Ensemble approach
   - Weighted voting
   - Best of both worlds

### Questions to Discuss:
- **Do we need LSTM now?** (Or can we start with just Isolation Forest?)
- **How much data for LSTM?** (Needs more than Isolation Forest)
- **Is it worth the complexity?** (Isolation Forest might be enough)

---

## 🎯 Recommended Order

### **Option A: Quick Path (2-3 weeks)**
1. Data Collection (Week 1, Days 1-2)
2. Train Isolation Forest (Week 1, Days 3-5)
3. Evaluate & Optimize (Week 2, Days 1-3)
4. Integrate with Risk Scorer (Week 2, Days 4-5)
5. **Skip LSTM for now** (add later if needed)

### **Option B: Complete Path (4-5 weeks)**
1. Data Collection (Week 1)
2. Train Isolation Forest (Week 2)
3. Evaluate & Optimize (Week 2-3)
4. Integrate with Risk Scorer (Week 3)
5. Add LSTM (Week 4)
6. Ensemble (Week 5)

---

## 💡 My Recommendation

**Start with Option A (Quick Path):**

**Why?**
- Isolation Forest is fast to implement
- Good baseline accuracy (85-90%)
- Can add LSTM later if needed
- Gets you working ML system quickly

**Timeline:**
- Week 1: Data + Isolation Forest
- Week 2: Evaluation + Integration
- Result: Working ML system in 2 weeks

**Then later:**
- Add LSTM if you want higher accuracy
- Or move to Phase 3 (Social Media)
- Or move to Phase 4 (Web Dashboard)

---

## 🤔 Key Decisions to Make

### 1. **Data Collection Strategy**
- How many stocks? (I suggest: 100-200)
- How much history? (I suggest: 3-6 months)
- Which stocks? (Mix of volatile + stable)

### 2. **Model Parameters**
- Contamination rate? (I suggest: 0.1 = 10%)
- Number of trees? (I suggest: 100-200)
- Use all features? (I suggest: Yes, then select important ones)

### 3. **Evaluation Strategy**
- How to evaluate without labels? (I suggest: Manual verification + compare with Phase 1)
- What's success? (I suggest: 85%+ accuracy, <15% false positives)

### 4. **Integration Strategy**
- ML weight in risk scorer? (I suggest: 20-30%)
- How to convert ML output? (I suggest: Anomaly score → 0-100 risk score)

---

## 📝 Implementation Checklist

### Week 1: Data & Model
- [ ] Create data collection script
- [ ] Collect data for 100+ stocks
- [ ] Extract features for all data
- [ ] Handle missing values
- [ ] Create Isolation Forest module
- [ ] Train model
- [ ] Save model

### Week 2: Evaluation & Integration
- [ ] Create evaluation script
- [ ] Test on sample stocks
- [ ] Calculate metrics
- [ ] Compare with Phase 1
- [ ] Optimize parameters
- [ ] Update risk scorer
- [ ] Test end-to-end

---

## 🚀 What We'll Build

### Files to Create:
1. `src/ml/data_collector.py` - Collect training data
2. `src/ml/isolation_forest.py` - Isolation Forest model
3. `src/ml/model_trainer.py` - Training pipeline
4. `src/ml/model_evaluator.py` - Evaluation metrics
5. `src/ml/utils.py` - Helper functions (data cleaning, etc.)

### Updated Files:
1. `src/detectors/risk_scorer.py` - Add ML score integration

---

## ❓ Discussion Questions

1. **Data Collection:**
   - How many stocks should we start with? (100? 200?)
   - How much historical data? (3 months? 6 months?)

2. **Model Training:**
   - Start with Isolation Forest only? (Yes/No)
   - What contamination rate? (10%? 5%?)

3. **Evaluation:**
   - How to evaluate without labeled data?
   - What's our success criteria?

4. **Integration:**
   - What weight for ML in risk scorer? (10%? 20%? 30%?)
   - How to convert ML output to risk score?

5. **Timeline:**
   - Quick path (2 weeks) or complete path (4-5 weeks)?

---

## 🎯 Next Action

**Once we discuss and decide, we'll:**
1. Create data collection script
2. Collect training data
3. Train Isolation Forest model
4. Evaluate and integrate

**Let's discuss these questions first!**

---

## 📚 What You Should Know

### Before We Start:
- ✅ Feature engineering is done (47 features)
- ✅ We understand what makes pump-and-dump different
- ✅ We know Isolation Forest algorithm

### What We Need to Learn:
- How to handle missing values in features
- How to train Isolation Forest with our features
- How to evaluate model performance
- How to integrate with existing system

---

**Ready to discuss? Let's go through each step and make decisions!**

