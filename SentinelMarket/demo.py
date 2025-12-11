"""
StockGuard - Quick Demo
Demonstrates pump-and-dump detection capabilities
"""

import sys
sys.path.append('src/data')
sys.path.append('src/detectors')

from stock_data_fetcher import StockDataFetcher
from risk_scorer import RiskScorer


def print_header():
    """Print demo header"""
    print("="*80)
    print("🛡️  STOCKGUARD - AI-POWERED PUMP-AND-DUMP DETECTOR")
    print("="*80)
    print("\nProtecting retail investors from market manipulation\n")


def print_separator():
    """Print separator"""
    print("\n" + "-"*80 + "\n")


def analyze_stock(ticker, period="3mo"):
    """
    Analyze a single stock and display results

    Args:
        ticker: Stock symbol (e.g., "SUZLON")
        period: Historical period to analyze
    """
    print(f"📊 Analyzing {ticker}...")
    print(f"Fetching {period} of historical data...\n")

    # Initialize
    fetcher = StockDataFetcher()
    scorer = RiskScorer()

    # Fetch data
    try:
        data = fetcher.fetch_historical_data(ticker, period=period)

        if data is None or len(data) == 0:
            print(f"❌ Could not fetch data for {ticker}")
            print(f"   • Stock may not exist or ticker is incorrect")
            print(f"   • Try: SUZLON, YESBANK, RELIANCE, TATASTEEL")
            return None

        print(f"✅ Fetched {len(data)} days of data")

        # Calculate risk
        result = scorer.calculate_risk_score(data, ticker)

        # Display results
        print_separator()
        print(f"🎯 RISK ASSESSMENT RESULTS")
        print_separator()

        # Risk Score with visual indicator
        risk_score = result['risk_score']
        risk_level = result['risk_level']

        # Visual risk meter
        filled = int(risk_score / 10)
        empty = 10 - filled
        risk_meter = "█" * filled + "░" * empty

        print(f"Risk Score: {risk_score}/100")
        print(f"[{risk_meter}]")
        print(f"\nRisk Level: {risk_level}")

        # Indicator emoji
        if risk_score >= 80:
            indicator = "🔴 EXTREME DANGER"
        elif risk_score >= 60:
            indicator = "🟠 HIGH RISK"
        elif risk_score >= 40:
            indicator = "🟡 MODERATE RISK"
        elif risk_score >= 20:
            indicator = "🟢 LOW RISK"
        else:
            indicator = "✅ SAFE"

        print(f"Status: {indicator}")

        # Detailed breakdown
        print_separator()
        print("📈 DETECTION BREAKDOWN")
        print_separator()

        individual = result['individual_scores']
        print(f"Volume Spike Score:    {individual['volume_spike']}/100")
        print(f"Price Anomaly Score:   {individual['price_anomaly']}/100")
        print(f"Social Sentiment:      {individual['social_sentiment']}/100 (Coming in Phase 3)")
        print(f"ML Anomaly Score:      {individual['ml_anomaly']}/100 (Coming in Phase 2)")

        # Explanation
        print_separator()
        print("💡 WHAT WE FOUND")
        print_separator()
        print(result['explanation'])

        # Red flags
        if result['red_flags']:
            print_separator()
            print("🚩 RED FLAGS DETECTED")
            print_separator()
            for flag in result['red_flags']:
                print(f"  {flag}")

        # Recommendation
        print_separator()
        print("🎯 RECOMMENDATION")
        print_separator()
        print(result['recommendation'])

        # Key metrics
        print_separator()
        print("📊 KEY METRICS")
        print_separator()

        # Safely access details
        details = result.get('details', {})
        vol_details = details.get('volume', {})
        price_details = details.get('price', {})

        if vol_details:
            print(f"Current Volume:     {vol_details.get('current_volume', 'N/A'):,}" if isinstance(vol_details.get('current_volume'), (int, float)) else f"Current Volume:     {vol_details.get('current_volume', 'N/A')}")
            print(f"Average Volume:     {vol_details.get('average_volume', 'N/A'):,}" if isinstance(vol_details.get('average_volume'), (int, float)) else f"Average Volume:     {vol_details.get('average_volume', 'N/A')}")
            print(f"Volume Ratio:       {vol_details.get('volume_ratio', 'N/A')}x")
        
        if price_details:
            print(f"\nCurrent Price:      ₹{price_details.get('current_price', 'N/A'):.2f}" if isinstance(price_details.get('current_price'), (int, float)) else f"\nCurrent Price:      {price_details.get('current_price', 'N/A')}")
            print(f"Price Change:       {price_details.get('price_change_percent', 'N/A'):+.2f}%" if isinstance(price_details.get('price_change_percent'), (int, float)) else f"Price Change:       {price_details.get('price_change_percent', 'N/A')}%")
            print(f"Z-Score:            {price_details.get('z_score', 'N/A'):.2f}" if isinstance(price_details.get('z_score'), (int, float)) else f"Z-Score:            {price_details.get('z_score', 'N/A')}")

            if 'rsi' in price_details and isinstance(price_details['rsi'], dict):
                rsi_val = price_details['rsi'].get('details', {}).get('rsi', 'N/A')
                print(f"RSI:                {rsi_val}")

        print_separator()

        return result

    except Exception as e:
        print(f"❌ Error analyzing {ticker}: {str(e)}")
        return None


def demo_batch_analysis():
    """Demonstrate batch analysis of multiple stocks"""
    print("\n\n")
    print("="*80)
    print("📊 BATCH ANALYSIS DEMO")
    print("="*80)
    print("\nAnalyzing multiple stocks for suspicious activity...\n")

    # Popular stocks (mix of stable and volatile)
    test_stocks = ["SUZLON", "YESBANK", "RELIANCE", "TATASTEEL"]

    fetcher = StockDataFetcher()
    scorer = RiskScorer()

    # Fetch data
    print("Fetching data for all stocks...")
    stock_data = fetcher.fetch_multiple_stocks(test_stocks, period="3mo")

    if not stock_data:
        print("❌ Failed to fetch stock data")
        return

    print(f"✅ Successfully fetched data for {len(stock_data)} stocks\n")

    # Calculate risks
    results = scorer.batch_calculate_risk(stock_data)

    # Display summary table
    print_separator()
    print("📋 RISK SUMMARY TABLE")
    print_separator()

    print(f"{'TICKER':<12} {'RISK SCORE':<12} {'RISK LEVEL':<18} {'STATUS':<12}")
    print("-" * 80)

    for ticker, result in results.items():
        score = result['risk_score']
        level = result['risk_level']

        # Status indicator
        if score >= 60:
            status = "⚠️ ALERT"
        elif score >= 40:
            status = "⚡ WATCH"
        else:
            status = "✅ OK"

        print(f"{ticker:<12} {score:<12} {level:<18} {status:<12}")

    # Get high-risk stocks
    high_risk = scorer.get_high_risk_stocks(results, threshold=60)

    if high_risk:
        print_separator()
        print("🚨 HIGH RISK STOCKS DETECTED")
        print_separator()

        for stock in high_risk:
            print(f"\n{stock['ticker']} - Risk Score: {stock['risk_score']}/100")
            print(f"Risk Level: {stock['risk_level']}")
            if stock['red_flags']:
                print("Red Flags:")
                for flag in stock['red_flags']:
                    print(f"  {flag}")
    else:
        print_separator()
        print("✅ No high-risk stocks detected in this batch")

    print_separator()


def main():
    """Main demo function"""
    print_header()

    print("This demo will:")
    print("  1. Analyze individual stocks for pump-and-dump patterns")
    print("  2. Show batch analysis of multiple stocks")
    print("  3. Display risk scores and recommendations")
    print_separator()

    # Demo 1: Single stock analysis
    print("\n🔍 DEMO 1: SINGLE STOCK ANALYSIS")
    print_separator()

    print("Analyzing SUZLON (known for volatility)...\n")
    analyze_stock("SUZLON", period="3mo")

    # Ask user if they want to analyze another stock
    print("\n\nWould you like to analyze another stock? (Enter ticker or press Enter to continue)")
    user_input = input("Ticker (e.g., YESBANK, RELIANCE): ").strip().upper()

    if user_input:
        analyze_stock(user_input, period="3mo")

    # Demo 2: Batch analysis
    demo_batch_analysis()

    # Conclusion
    print("\n\n")
    print("="*80)
    print("✅ DEMO COMPLETED")
    print("="*80)
    print("\nWhat you just saw:")
    print("  ✅ Real-time data fetching from NSE")
    print("  ✅ Volume spike detection")
    print("  ✅ Price anomaly detection (Z-score, RSI, Bollinger Bands)")
    print("  ✅ Combined risk scoring (0-100)")
    print("  ✅ Actionable recommendations")
    print("\nNext phases will add:")
    print("  🔜 Machine Learning models (Isolation Forest, LSTM)")
    print("  🔜 Telegram channel monitoring")
    print("  🔜 Social media sentiment analysis")
    print("  🔜 Web dashboard with real-time alerts")
    print("\nTo run tests: python test_detection_system.py")
    print("To learn more: Read SETUP_GUIDE.md")
    print("\n🛡️  StockGuard - Protecting retail investors from market manipulation")
    print("="*80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Demo interrupted by user")
        print("="*80)
    except Exception as e:
        print(f"\n\n❌ Error running demo: {str(e)}")
        print("="*80)
