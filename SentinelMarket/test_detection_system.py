"""
Test Detection System with Real Historical Data
Tests volume spike and price anomaly detectors with known pump-and-dump cases
"""

import sys
sys.path.append('src/data')
sys.path.append('src/detectors')

from stock_data_fetcher import StockDataFetcher
from volume_spike_detector import VolumeSpikeDetector
from price_anomaly_detector import PriceAnomalyDetector
from risk_scorer import RiskScorer

import pandas as pd
from datetime import datetime


def print_separator():
    """Print visual separator"""
    print("\n" + "="*80 + "\n")


def test_single_stock(ticker: str, period: str = "3mo"):
    """
    Test detection system on a single stock

    Args:
        ticker: Stock ticker symbol
        period: Historical period to analyze
    """
    print(f"📊 ANALYZING: {ticker}")
    print_separator()

    # Fetch data
    fetcher = StockDataFetcher()
    print(f"Fetching {period} of historical data...")
    data = fetcher.fetch_historical_data(ticker, period=period)

    if data is None or len(data) == 0:
        print(f"❌ Failed to fetch data for {ticker}")
        return None

    print(f"✅ Fetched {len(data)} days of data")
    print(f"Date range: {data['Date'].iloc[0]} to {data['Date'].iloc[-1]}")

    # Test Volume Spike Detector
    print("\n--- VOLUME SPIKE DETECTION ---")
    volume_detector = VolumeSpikeDetector(window_days=30, spike_threshold=2.0)
    volume_result = volume_detector.detect(data)

    print(f"Is Suspicious: {volume_result['is_suspicious']}")
    print(f"Risk Score: {volume_result['risk_score']}/100")
    print(f"Message: {volume_result['message']}")
    print(f"Details:")
    print(f"  Current Volume: {volume_result['details']['current_volume']:,}")
    print(f"  Average Volume: {volume_result['details']['average_volume']:,}")
    print(f"  Volume Ratio: {volume_result['details']['volume_ratio']}x")

    # Test Price Anomaly Detector
    print("\n--- PRICE ANOMALY DETECTION ---")
    price_detector = PriceAnomalyDetector(window_days=30, z_score_threshold=2.0)
    price_result = price_detector.detect_multiple_indicators(data)

    print(f"Is Suspicious: {price_result['is_suspicious']}")
    print(f"Risk Score: {price_result['risk_score']}/100")
    print(f"Message: {price_result['message']}")
    print(f"Details:")
    print(f"  Price Change: {price_result['details']['price_change_percent']:.2f}%")
    print(f"  Z-Score: {price_result['details']['z_score']:.2f}")
    print(f"  Current Price: ₹{price_result['details']['current_price']:.2f}")

    if 'rsi' in price_result['details']:
        rsi_info = price_result['details']['rsi']['details']
        print(f"  RSI: {rsi_info['rsi']} ({rsi_info['status']})")

    # Test Combined Risk Scorer
    print("\n--- COMBINED RISK ASSESSMENT ---")
    scorer = RiskScorer()
    risk_result = scorer.calculate_risk_score(data, ticker)

    print(f"Final Risk Score: {risk_result['risk_score']}/100")
    print(f"Risk Level: {risk_result['risk_level']}")
    print(f"Is Suspicious: {risk_result['is_suspicious']}")
    print(f"\nExplanation: {risk_result['explanation']}")

    print(f"\nIndividual Scores:")
    for method, score in risk_result['individual_scores'].items():
        print(f"  {method}: {score}/100")

    if risk_result['red_flags']:
        print(f"\n🚩 Red Flags:")
        for flag in risk_result['red_flags']:
            print(f"  {flag}")

    print(f"\n💡 Recommendation:")
    print(f"{risk_result['recommendation']}")

    print_separator()

    return risk_result


def test_multiple_stocks(tickers: list, period: str = "3mo"):
    """
    Test detection system on multiple stocks

    Args:
        tickers: List of stock ticker symbols
        period: Historical period to analyze
    """
    print("📊 BATCH ANALYSIS")
    print(f"Analyzing {len(tickers)} stocks: {', '.join(tickers)}")
    print_separator()

    # Fetch data for all stocks
    fetcher = StockDataFetcher()
    print("Fetching data for all stocks...")
    stock_data_dict = fetcher.fetch_multiple_stocks(tickers, period=period)

    print(f"✅ Successfully fetched data for {len(stock_data_dict)}/{len(tickers)} stocks")
    print_separator()

    # Calculate risk scores
    scorer = RiskScorer()
    results = scorer.batch_calculate_risk(stock_data_dict)

    # Display summary table
    print("RISK ASSESSMENT SUMMARY")
    print(f"{'Ticker':<15} {'Risk Score':<12} {'Risk Level':<15} {'Suspicious':<12}")
    print("-" * 80)

    for ticker, result in results.items():
        suspicious = "YES ⚠️" if result['is_suspicious'] else "NO"
        print(f"{ticker:<15} {result['risk_score']:<12} {result['risk_level']:<15} {suspicious:<12}")

    # Get high-risk stocks
    high_risk = scorer.get_high_risk_stocks(results, threshold=60)

    if high_risk:
        print_separator()
        print("🚨 HIGH RISK STOCKS DETECTED:")
        for stock in high_risk:
            print(f"\n{stock['ticker']} - Risk Score: {stock['risk_score']}/100")
            print(f"  Risk Level: {stock['risk_level']}")
            if stock['red_flags']:
                print(f"  Red Flags:")
                for flag in stock['red_flags']:
                    print(f"    {flag}")
    else:
        print_separator()
        print("✅ No high-risk stocks detected in this batch")

    print_separator()

    return results


def test_historical_pump_case():
    """
    Test with a known historical pump-and-dump case
    """
    print("🔍 TESTING WITH HISTORICAL PUMP-AND-DUMP CASE")
    print_separator()

    # Note: These are examples - real pump-and-dumps would need specific date ranges
    # Testing with SUZLON (known for volatility and frequent manipulation)

    print("Testing SUZLON (frequent manipulation target)")
    print("Note: If no pump detected, the stock may be in a normal period")
    print_separator()

    result = test_single_stock("SUZLON", period="3mo")

    if result and result['risk_score'] >= 60:
        print("\n✅ DETECTION SUCCESSFUL:")
        print("System correctly identified suspicious activity!")
    else:
        print("\n📝 NOTE:")
        print("Stock may be in a normal trading period.")
        print("For accurate testing, analyze stocks during known pump events.")

    return result


def test_realtime_monitoring(ticker: str, duration_minutes: int = 5):
    """
    Test real-time monitoring (simulated with intraday data)

    Args:
        ticker: Stock ticker to monitor
        duration_minutes: How long to monitor
    """
    print(f"⏱️ REAL-TIME MONITORING TEST: {ticker}")
    print(f"Monitoring for {duration_minutes} minutes...")
    print_separator()

    fetcher = StockDataFetcher()
    scorer = RiskScorer()

    # Fetch intraday data
    print("Fetching intraday data...")
    intraday_data = fetcher.fetch_intraday_data(ticker, interval="1m")

    if intraday_data is None or len(intraday_data) == 0:
        print("❌ No intraday data available (market may be closed)")
        return None

    print(f"✅ Fetched {len(intraday_data)} minutes of intraday data")

    # Analyze last few minutes
    window_size = min(duration_minutes, len(intraday_data))
    recent_data = intraday_data.tail(window_size)

    print(f"\nAnalyzing last {window_size} minutes...")
    result = scorer.calculate_risk_score(recent_data, ticker)

    print(f"\nReal-time Risk Score: {result['risk_score']}/100")
    print(f"Risk Level: {result['risk_level']}")

    if result['is_suspicious']:
        print("\n🚨 ALERT TRIGGERED!")
        print(scorer.generate_alert_summary(result))
    else:
        print("\n✅ No suspicious activity detected")

    print_separator()

    return result


def run_all_tests():
    """Run comprehensive test suite"""
    print("="*80)
    print("STOCKGUARD - DETECTION SYSTEM TEST SUITE")
    print("="*80)

    # Test 1: Single stock analysis
    print("\n\nTEST 1: SINGLE STOCK ANALYSIS")
    test_single_stock("SUZLON", period="3mo")

    # Test 2: Multiple stocks analysis
    print("\n\nTEST 2: MULTIPLE STOCKS ANALYSIS")
    test_stocks = ["SUZLON", "YESBANK", "RELIANCE", "TATASTEEL"]
    test_multiple_stocks(test_stocks, period="3mo")

    # Test 3: Historical pump-and-dump case
    print("\n\nTEST 3: HISTORICAL PUMP-AND-DUMP DETECTION")
    test_historical_pump_case()

    # Test 4: Real-time monitoring (only if market is open)
    print("\n\nTEST 4: REAL-TIME MONITORING (SIMULATED)")
    test_realtime_monitoring("SUZLON", duration_minutes=5)

    print("\n\n" + "="*80)
    print("TEST SUITE COMPLETED")
    print("="*80)


if __name__ == "__main__":
    # You can run individual tests or the full suite

    # Option 1: Run full test suite
    run_all_tests()

    # Option 2: Run individual tests (uncomment to use)
    # test_single_stock("SUZLON", period="3mo")
    # test_multiple_stocks(["SUZLON", "YESBANK", "RELIANCE"], period="3mo")
    # test_historical_pump_case()
    # test_realtime_monitoring("SUZLON", duration_minutes=5)
