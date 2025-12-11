"""
Quick test script for data collection
Tests with 5 stocks to verify everything works
"""

import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.data_collector import DataCollector, get_nse_stock_list


def test_data_collection():
    """Test data collection with a small sample"""
    
    print("="*60)
    print("🧪 TESTING DATA COLLECTION")
    print("="*60)
    print()
    
    # Test with 5 stocks
    test_stocks = ["SUZLON", "YESBANK", "RELIANCE", "TCS", "INFY"]
    
    print(f"Testing with {len(test_stocks)} stocks:")
    for stock in test_stocks:
        print(f"  - {stock}")
    print()
    
    # Initialize collector
    print("Initializing collector...")
    collector = DataCollector(
        window_days=30,
        period="3mo"  # 3 months for quick test
    )
    print("✅ Collector initialized")
    print()
    
    # Test data collection
    print("Step 1: Collecting stock data...")
    stock_data = collector.collect_stock_data(
        tickers=test_stocks,
        delay=0.3,  # Faster for testing
        save_progress=False
    )
    
    if not stock_data:
        print("❌ No data collected. Test failed.")
        return
    
    print(f"✅ Collected data for {len(stock_data)} stocks")
    print()
    
    # Test feature extraction
    print("Step 2: Extracting features...")
    features_df = collector.extract_features_for_all_stocks(
        stock_data,
        handle_missing="forward_fill"
    )
    
    if features_df.empty:
        print("❌ No features extracted. Test failed.")
        return
    
    print(f"✅ Extracted features: {len(features_df)} rows")
    print(f"✅ Features per row: {len(features_df.columns) - 2}")
    print()
    
    # Show sample
    print("Step 3: Sample data:")
    print("-"*60)
    print(features_df.head())
    print()
    print(f"Data shape: {features_df.shape}")
    print(f"Stocks: {features_df['ticker'].unique()}")
    print(f"Date range: {features_df['date'].min()} to {features_df['date'].max()}")
    print()
    
    # Check for missing values
    print("Step 4: Checking data quality...")
    missing = features_df.isnull().sum().sum()
    print(f"Missing values: {missing}")
    
    if missing == 0:
        print("✅ No missing values!")
    else:
        print(f"⚠️ {missing} missing values found")
    
    print()
    print("="*60)
    print("✅ TEST COMPLETE - Everything works!")
    print("="*60)
    
    return features_df


if __name__ == "__main__":
    try:
        result = test_data_collection()
        if result is not None:
            print("\n💡 Next: Run full collection with:")
            print("   python collect_training_data.py")
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

