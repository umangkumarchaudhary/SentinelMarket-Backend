"""
Script to collect training data for ML models

Usage:
    python collect_training_data.py
    
This will:
1. Collect historical data for 50-100 stocks
2. Extract 47 features for each day
3. Handle missing values
4. Save to training_data.csv
"""

import sys
import os

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.data_collector import DataCollector, get_nse_stock_list


def main():
    """Main function to collect training data"""
    
    print("="*60)
    print("📊 TRAINING DATA COLLECTION")
    print("="*60)
    print()
    
    # Configuration
    print("Configuration:")
    print("  - Period: 6 months")
    print("  - Window: 30 days")
    print("  - Missing values: Forward fill")
    print()
    
    # Get stock list
    print("Selecting stocks...")
    size = input("How many stocks? (small=50, medium=100, large=200) [default: small]: ").strip().lower()
    if not size:
        size = "small"
    
    stocks = get_nse_stock_list(size=size)
    print(f"✅ Selected {len(stocks)} stocks")
    print(f"   Sample: {', '.join(stocks[:10])}")
    print()
    
    # Confirm
    confirm = input("Proceed with data collection? (y/n) [default: y]: ").strip().lower()
    if confirm and confirm != 'y':
        print("Cancelled.")
        return
    
    print()
    print("="*60)
    print("Starting data collection...")
    print("="*60)
    print()
    
    # Initialize collector
    collector = DataCollector(
        window_days=30,
        period="6mo"  # 6 months of historical data
    )
    
    # Collect and prepare data
    training_data = collector.prepare_training_data(
        tickers=stocks,
        output_file="training_data.csv",
        delay=0.5,  # 0.5 second delay between API calls (avoid rate limiting)
        handle_missing="forward_fill"
    )
    
    if not training_data.empty:
        print()
        print("="*60)
        print("✅ SUCCESS!")
        print("="*60)
        print(f"Training data saved to: training_data.csv")
        print(f"  - Stocks: {training_data['ticker'].nunique()}")
        print(f"  - Total rows: {len(training_data)}")
        print(f"  - Features: {len(training_data.columns) - 2}")
        print(f"  - Date range: {training_data['date'].min().date()} to {training_data['date'].max().date()}")
        print()
        print("Next step: Train Isolation Forest model")
        print("="*60)
    else:
        print()
        print("❌ Data collection failed. Please check errors above.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

