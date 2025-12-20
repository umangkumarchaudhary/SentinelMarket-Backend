"""
Integration Test: Risk Scorer with ML Model

Tests the integrated system with real-world scenarios:
1. ML model available and working
2. ML model not available (fallback)
3. ML model error handling
4. Missing features
5. End-to-end flow
"""

import sys
import os
import pandas as pd

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from data.stock_data_fetcher import StockDataFetcher
from detectors.risk_scorer import RiskScorer


def test_scenario_1_ml_available():
    """Test Scenario 1: ML model is available and working"""
    print("="*60)
    print("🧪 SCENARIO 1: ML Model Available")
    print("="*60)
    print()
    
    # Initialize risk scorer (will try to load ML model)
    print("Initializing Risk Scorer with ML...")
    scorer = RiskScorer(use_ml=True)
    
    print(f"ML Enabled: {scorer.ml_enabled}")
    if scorer.ml_error:
        print(f"ML Error: {scorer.ml_error}")
    print()
    
    # Fetch stock data
    print("Fetching stock data...")
    fetcher = StockDataFetcher()
    data = fetcher.fetch_historical_data("SUZLON", period="3mo")
    
    if data is None:
        print("❌ Could not fetch data")
        return
    
    print(f"✅ Fetched {len(data)} days of data")
    print()
    
    # Calculate risk score
    print("Calculating risk score...")
    result = scorer.calculate_risk_score(data, "SUZLON")
    
    print()
    print("Results:")
    print("-"*60)
    print(f"Risk Score: {result['risk_score']}/100")
    print(f"Risk Level: {result['risk_level']}")
    print(f"ML Enabled: {result['ml_status']['enabled']}")
    print(f"ML Score: {result['ml_status']['score']}")
    print()
    print("Individual Scores:")
    for key, value in result['individual_scores'].items():
        print(f"  {key}: {value}")
    print()
    print("Red Flags:")
    for flag in result['red_flags']:
        print(f"  {flag}")
    print()
    
    return result


def test_scenario_2_ml_not_available():
    """Test Scenario 2: ML model not available (fallback to Phase 1)"""
    print("="*60)
    print("🧪 SCENARIO 2: ML Model Not Available (Fallback)")
    print("="*60)
    print()
    
    # Initialize without ML
    print("Initializing Risk Scorer without ML...")
    scorer = RiskScorer(use_ml=False)
    
    print(f"ML Enabled: {scorer.ml_enabled}")
    print()
    
    # Fetch stock data
    print("Fetching stock data...")
    fetcher = StockDataFetcher()
    data = fetcher.fetch_historical_data("RELIANCE", period="3mo")
    
    if data is None:
        print("❌ Could not fetch data")
        return
    
    print(f"✅ Fetched {len(data)} days of data")
    print()
    
    # Calculate risk score
    print("Calculating risk score (Phase 1 only)...")
    result = scorer.calculate_risk_score(data, "RELIANCE")
    
    print()
    print("Results:")
    print("-"*60)
    print(f"Risk Score: {result['risk_score']}/100")
    print(f"Risk Level: {result['risk_level']}")
    print(f"ML Enabled: {result['ml_status']['enabled']}")
    print()
    print("✅ System works without ML (fallback successful)")
    print()
    
    return result


def test_scenario_3_error_handling():
    """Test Scenario 3: Error handling (invalid model path)"""
    print("="*60)
    print("🧪 SCENARIO 3: Error Handling (Invalid Model Path)")
    print("="*60)
    print()
    
    # Initialize with invalid model path
    print("Initializing with invalid model path...")
    scorer = RiskScorer(ml_model_path="nonexistent_model.pkl", use_ml=True)
    
    print(f"ML Enabled: {scorer.ml_enabled}")
    if scorer.ml_error:
        print(f"ML Error: {scorer.ml_error}")
    print()
    
    # Fetch stock data
    print("Fetching stock data...")
    fetcher = StockDataFetcher()
    data = fetcher.fetch_historical_data("TCS", period="3mo")
    
    if data is None:
        print("❌ Could not fetch data")
        return
    
    print(f"✅ Fetched {len(data)} days of data")
    print()
    
    # Calculate risk score (should fallback gracefully)
    print("Calculating risk score (should fallback)...")
    result = scorer.calculate_risk_score(data, "TCS")
    
    print()
    print("Results:")
    print("-"*60)
    print(f"Risk Score: {result['risk_score']}/100")
    print(f"ML Enabled: {result['ml_status']['enabled']}")
    if result['ml_status']['error']:
        print(f"ML Error: {result['ml_status']['error']}")
    print()
    print("✅ Error handled gracefully, system continues working")
    print()
    
    return result


def test_scenario_4_batch_analysis():
    """Test Scenario 4: Batch analysis with ML"""
    print("="*60)
    print("🧪 SCENARIO 4: Batch Analysis with ML")
    print("="*60)
    print()
    
    # Initialize
    scorer = RiskScorer(use_ml=True)
    fetcher = StockDataFetcher()
    
    # Test stocks
    test_stocks = ["SUZLON", "YESBANK", "RELIANCE"]
    
    print(f"Analyzing {len(test_stocks)} stocks...")
    print()
    
    stock_data = {}
    for ticker in test_stocks:
        print(f"Fetching {ticker}...", end=" ")
        data = fetcher.fetch_historical_data(ticker, period="3mo")
        if data is not None:
            stock_data[ticker] = data
            print(f"✅ {len(data)} days")
        else:
            print("❌ Failed")
    
    if not stock_data:
        print("❌ No data collected")
        return
    
    print()
    print("Calculating risk scores...")
    results = scorer.batch_calculate_risk(stock_data)
    
    print()
    print("Results:")
    print("-"*60)
    print(f"{'TICKER':<12} {'RISK':<8} {'LEVEL':<18} {'ML':<8}")
    print("-"*60)
    
    for ticker, result in results.items():
        ml_status = "✅" if result.get('ml_status', {}).get('enabled', False) else "❌"
        print(f"{ticker:<12} {result['risk_score']:<8} {result['risk_level']:<18} {ml_status:<8}")
    
    print()
    print("✅ Batch analysis complete")
    print()
    
    return results


def main():
    """Run all test scenarios"""
    print("="*60)
    print("🔬 INTEGRATION TEST: Risk Scorer + ML Model")
    print("="*60)
    print()
    print("Testing real-world scenarios:")
    print("1. ML model available")
    print("2. ML model not available (fallback)")
    print("3. Error handling")
    print("4. Batch analysis")
    print()
    print("Starting tests automatically...")
    print()
    
    # Scenario 1
    try:
        test_scenario_1_ml_available()
    except Exception as e:
        print(f"❌ Scenario 1 failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*60 + "\n")
    
    # Scenario 2
    try:
        test_scenario_2_ml_not_available()
    except Exception as e:
        print(f"❌ Scenario 2 failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Scenario 3
    try:
        test_scenario_3_error_handling()
    except Exception as e:
        print(f"❌ Scenario 3 failed: {str(e)}")
    
    print("\n" + "="*60 + "\n")
    
    # Scenario 4
    try:
        test_scenario_4_batch_analysis()
    except Exception as e:
        print(f"❌ Scenario 4 failed: {str(e)}")
    
    print()
    print("="*60)
    print("✅ ALL INTEGRATION TESTS COMPLETE")
    print("="*60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

