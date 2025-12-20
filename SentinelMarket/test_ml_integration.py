"""
Quick test: ML Integration with Trained Model
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from detectors.risk_scorer import RiskScorer
from data.stock_data_fetcher import StockDataFetcher

print("="*60)
print("🧪 TESTING ML INTEGRATION WITH TRAINED MODEL")
print("="*60)
print()

# Initialize risk scorer with ML
print("Initializing Risk Scorer with ML...")
scorer = RiskScorer(use_ml=True)

print(f"ML Enabled: {scorer.ml_enabled}")
if scorer.ml_error:
    print(f"ML Error: {scorer.ml_error}")
print()

if not scorer.ml_enabled:
    print("❌ ML model not loaded. Please train the model first:")
    print("   python train_isolation_forest.py")
    exit(1)

# Fetch stock data
print("Fetching stock data for SUZLON...")
fetcher = StockDataFetcher()
data = fetcher.fetch_historical_data("SUZLON", period="3mo")

if data is None:
    print("❌ Could not fetch data")
    exit(1)

print(f"✅ Fetched {len(data)} days of data")
print()

# Calculate risk score
print("Calculating risk score (with ML)...")
result = scorer.calculate_risk_score(data, "SUZLON")

print()
print("="*60)
print("RESULTS")
print("="*60)
print(f"Risk Score: {result['risk_score']}/100")
print(f"Risk Level: {result['risk_level']}")
print()
print("Individual Scores:")
print(f"  Volume Spike: {result['individual_scores']['volume_spike']}/100")
print(f"  Price Anomaly: {result['individual_scores']['price_anomaly']}/100")
print(f"  ML Anomaly: {result['individual_scores']['ml_anomaly']}/100")
print()
print("ML Status:")
print(f"  Enabled: {result['ml_status']['enabled']}")
print(f"  Score: {result['ml_status']['score']}")
if result['ml_status']['error']:
    print(f"  Error: {result['ml_status']['error']}")
print()

if result['red_flags']:
    print("Red Flags:")
    for flag in result['red_flags']:
        print(f"  {flag}")
else:
    print("No red flags detected")
print()

print("="*60)
print("✅ ML INTEGRATION TEST SUCCESSFUL!")
print("="*60)
print()
print("The system is now using:")
print("  - Phase 1: Statistical methods (Volume + Price)")
print("  - Phase 2: ML model (Isolation Forest)")
print("  - Combined risk score with ML contribution")

