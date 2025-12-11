"""
Data Collector for ML Training

Collects historical stock data and extracts features for ML model training.
Handles data preparation, cleaning, and feature extraction.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.stock_data_fetcher import StockDataFetcher
from ml.feature_engineer import FeatureEngineer


class DataCollector:
    """
    Collects and prepares training data for ML models
    
    Steps:
    1. Fetch historical data for multiple stocks
    2. Extract 47 features for each day
    3. Handle missing values
    4. Prepare data for ML training
    """
    
    def __init__(self, window_days: int = 30, period: str = "6mo"):
        """
        Initialize Data Collector
        
        Args:
            window_days: Rolling window for feature calculation
            period: Historical period to fetch (1mo, 3mo, 6mo, 1y, 2y, 5y)
        """
        self.window_days = window_days
        self.period = period
        self.fetcher = StockDataFetcher()
        self.feature_engineer = FeatureEngineer(window_days=window_days)
        
    def collect_stock_data(
        self, 
        tickers: List[str], 
        delay: float = 0.5,
        save_progress: bool = True,
        progress_file: str = "data_collection_progress.csv"
    ) -> Dict[str, pd.DataFrame]:
        """
        Collect historical data for multiple stocks
        
        Args:
            tickers: List of stock tickers (e.g., ["SUZLON", "YESBANK"])
            delay: Delay between API calls (seconds) to avoid rate limiting
            save_progress: Whether to save progress to file
            progress_file: File to save progress
        
        Returns:
            Dictionary with ticker as key and DataFrame as value
        """
        stock_data = {}
        failed_tickers = []
        
        print(f"📊 Collecting data for {len(tickers)} stocks...")
        print(f"Period: {self.period}, Window: {self.window_days} days\n")
        
        for i, ticker in enumerate(tickers, 1):
            try:
                print(f"[{i}/{len(tickers)}] Fetching {ticker}...", end=" ")
                
                # Fetch data
                data = self.fetcher.fetch_historical_data(ticker, period=self.period)
                
                if data is None or len(data) < self.window_days:
                    print(f"❌ Insufficient data ({len(data) if data is not None else 0} days)")
                    failed_tickers.append(ticker)
                    continue
                
                stock_data[ticker] = data
                print(f"✅ {len(data)} days")
                
                # Delay to avoid rate limiting
                if i < len(tickers):
                    time.sleep(delay)
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                failed_tickers.append(ticker)
                continue
        
        # Summary
        print(f"\n{'='*60}")
        print(f"✅ Successfully collected: {len(stock_data)} stocks")
        if failed_tickers:
            print(f"❌ Failed: {len(failed_tickers)} stocks")
            print(f"   Failed tickers: {', '.join(failed_tickers)}")
        print(f"{'='*60}\n")
        
        # Save progress if requested
        if save_progress and stock_data:
            self._save_progress(stock_data, progress_file)
        
        return stock_data
    
    def extract_features_for_all_stocks(
        self, 
        stock_data: Dict[str, pd.DataFrame],
        handle_missing: str = "forward_fill"
    ) -> pd.DataFrame:
        """
        Extract features for all stocks
        
        Args:
            stock_data: Dictionary with ticker as key and DataFrame as value
            handle_missing: How to handle missing values ("forward_fill", "median", "drop")
        
        Returns:
            DataFrame with columns: ticker, date, and 47 features
        """
        all_features = []
        
        print(f"🔧 Extracting features for {len(stock_data)} stocks...\n")
        
        for ticker, data in stock_data.items():
            try:
                print(f"Extracting features for {ticker}...", end=" ")
                
                # Extract features
                features = self.feature_engineer.extract_features(data)
                
                if features.empty:
                    print("❌ No features extracted")
                    continue
                
                # Add ticker and date columns
                if 'Date' in data.columns:
                    dates = data['Date']
                elif data.index.name == 'Date':
                    dates = data.index
                else:
                    dates = pd.date_range(start='2024-01-01', periods=len(data), freq='D')
                
                # Ensure same length
                min_len = min(len(features), len(data))
                features = features.iloc[:min_len].copy()
                dates = dates[:min_len]
                
                features['ticker'] = ticker
                features['date'] = pd.to_datetime(dates)
                
                # Reorder columns: ticker, date, then features
                cols = ['ticker', 'date'] + [c for c in features.columns if c not in ['ticker', 'date']]
                features = features[cols]
                
                all_features.append(features)
                print(f"✅ {len(features)} days")
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                continue
        
        if not all_features:
            print("\n❌ No features extracted for any stock!")
            return pd.DataFrame()
        
        # Combine all stocks
        combined_features = pd.concat(all_features, ignore_index=True)
        
        print(f"\n{'='*60}")
        print(f"✅ Total feature rows: {len(combined_features)}")
        print(f"✅ Features per row: {len(combined_features.columns) - 2}")  # Exclude ticker and date
        print(f"{'='*60}\n")
        
        # Handle missing values
        combined_features = self._handle_missing_values(combined_features, method=handle_missing)
        
        return combined_features
    
    def _handle_missing_values(
        self, 
        data: pd.DataFrame, 
        method: str = "forward_fill"
    ) -> pd.DataFrame:
        """
        Handle missing values in feature data
        
        Args:
            data: DataFrame with features
            method: "forward_fill", "median", "drop", or "zero"
        
        Returns:
            DataFrame with missing values handled
        """
        print(f"🧹 Handling missing values (method: {method})...")
        
        # Count missing values before
        missing_before = data.isnull().sum().sum()
        print(f"   Missing values before: {missing_before}")
        
        # Exclude ticker and date columns
        feature_cols = [c for c in data.columns if c not in ['ticker', 'date']]
        
        if method == "forward_fill":
            # Forward fill, then backward fill
            data[feature_cols] = data[feature_cols].ffill().bfill()
            
        elif method == "median":
            # Fill with median per stock
            for ticker in data['ticker'].unique():
                ticker_mask = data['ticker'] == ticker
                ticker_data = data.loc[ticker_mask, feature_cols]
                medians = ticker_data.median()
                data.loc[ticker_mask, feature_cols] = ticker_data.fillna(medians)
            
        elif method == "zero":
            # Fill with zero
            data[feature_cols] = data[feature_cols].fillna(0)
            
        elif method == "drop":
            # Drop rows with any missing values
            data = data.dropna(subset=feature_cols)
            
        else:
            print(f"⚠️ Unknown method '{method}', using forward_fill")
            data[feature_cols] = data[feature_cols].fillna(method='ffill').fillna(method='bfill')
        
        # Count missing values after
        missing_after = data.isnull().sum().sum()
        print(f"   Missing values after: {missing_after}")
        
        if missing_after > 0:
            print(f"⚠️ Warning: {missing_after} missing values remaining")
            # Final fallback: fill with zero
            data[feature_cols] = data[feature_cols].fillna(0)
            print(f"   Filled remaining with zero")
        
        print(f"✅ Missing values handled\n")
        
        return data
    
    def prepare_training_data(
        self,
        tickers: List[str],
        output_file: Optional[str] = None,
        delay: float = 0.5,
        handle_missing: str = "forward_fill"
    ) -> pd.DataFrame:
        """
        Complete pipeline: Collect data + Extract features + Prepare for training
        
        Args:
            tickers: List of stock tickers
            output_file: Optional file to save results (CSV)
            delay: Delay between API calls
            handle_missing: Method to handle missing values
        
        Returns:
            DataFrame ready for ML training (ticker, date, 47 features)
        """
        print("="*60)
        print("🚀 DATA COLLECTION & PREPARATION PIPELINE")
        print("="*60)
        print()
        
        # Step 1: Collect stock data
        stock_data = self.collect_stock_data(tickers, delay=delay)
        
        if not stock_data:
            print("❌ No data collected. Exiting.")
            return pd.DataFrame()
        
        # Step 2: Extract features
        features_df = self.extract_features_for_all_stocks(
            stock_data, 
            handle_missing=handle_missing
        )
        
        if features_df.empty:
            print("❌ No features extracted. Exiting.")
            return pd.DataFrame()
        
        # Step 3: Save if requested
        if output_file:
            features_df.to_csv(output_file, index=False)
            print(f"💾 Saved to: {output_file}")
            print(f"   Rows: {len(features_df)}")
            print(f"   Columns: {len(features_df.columns)}")
            print()
        
        # Final summary
        print("="*60)
        print("✅ DATA PREPARATION COMPLETE")
        print("="*60)
        print(f"Stocks processed: {features_df['ticker'].nunique()}")
        print(f"Total rows: {len(features_df)}")
        print(f"Features: {len(features_df.columns) - 2}")  # Exclude ticker and date
        print(f"Date range: {features_df['date'].min()} to {features_df['date'].max()}")
        print("="*60)
        
        return features_df
    
    def _save_progress(self, stock_data: Dict[str, pd.DataFrame], filename: str):
        """Save collection progress to file"""
        try:
            progress_data = []
            for ticker, data in stock_data.items():
                progress_data.append({
                    'ticker': ticker,
                    'rows': len(data),
                    'date_min': data['Date'].min() if 'Date' in data.columns else 'N/A',
                    'date_max': data['Date'].max() if 'Date' in data.columns else 'N/A',
                    'collected_at': datetime.now().isoformat()
                })
            
            progress_df = pd.DataFrame(progress_data)
            progress_df.to_csv(filename, index=False)
            print(f"💾 Progress saved to: {filename}")
        except Exception as e:
            print(f"⚠️ Could not save progress: {str(e)}")


def get_nse_stock_list(size: str = "medium") -> List[str]:
    """
    Get list of NSE stocks for training
    
    Args:
        size: "small" (50 stocks), "medium" (100 stocks), "large" (200 stocks)
    
    Returns:
        List of stock tickers
    """
    # Popular NSE stocks (mix of large-cap, mid-cap, small-cap)
    all_stocks = [
        # Large Cap
        "RELIANCE", "TCS", "HDFCBANK", "INFY", "HINDUNILVR", "ICICIBANK",
        "BHARTIARTL", "SBIN", "BAJFINANCE", "LICI", "ITC", "SUNPHARMA",
        "LT", "HCLTECH", "AXISBANK", "MARUTI", "TATAMOTORS", "ONGC",
        "NTPC", "TITAN", "ULTRACEMCO", "NESTLEIND", "WIPRO", "POWERGRID",
        
        # Mid Cap
        "TATASTEEL", "JSWSTEEL", "ADANIENT", "ADANIPORTS", "TECHM",
        "DRREDDY", "CIPLA", "DIVISLAB", "BAJAJFINSV", "INDUSINDBK",
        "COALINDIA", "GRASIM", "M&M", "HDFCLIFE", "BRITANNIA", "SBILIFE",
        "HINDALCO", "APOLLOHOSP", "DABUR", "HAVELLS", "MARICO", "GODREJCP",
        
        # Small Cap / Volatile (often manipulation targets)
        "SUZLON", "YESBANK", "RPOWER", "JINDALSAW", "JINDALSTEL",
        "RBLBANK", "IDFCFIRSTB", "BANKBARODA", "UNIONBANK", "CANBK",
        "PNB", "IOB", "UCOBANK", "CENTRALBK", "ORIENTBANK",
        
        # Energy
        "IOC", "BPCL", "HPCL", "GAIL", "PETRONET",
        
        # IT
        "MINDTREE", "LTI", "MPHASIS", "PERSISTENT", "ZENSAR",
        
        # Pharma
        "LUPIN", "TORNTPHARM", "ALKEM", "GLENMARK", "CADILAHC",
        
        # Auto
        "ASHOKLEY", "EICHERMOT", "MOTHERSON", "BOSCHLTD", "MRF",
        
        # FMCG
        "COLPAL", "EMAMILTD", "GODREJIND", "JUBLFOOD", "DABUR",
        
        # Banking
        "FEDERALBNK", "KOTAKBANK", "IDFCFIRSTB", "RBLBANK", "BANDHANBNK",
        
        # Infrastructure
        "ADANIGREEN", "ADANIPOWER", "ADANITRANS", "TATAPOWER", "NHPC",
        
        # Metals
        "VEDL", "NATIONALUM", "HINDZINC", "JINDALSAW", "RATNAMANI",
        
        # Telecom
        "IDEA", "RCOM", "TATACOMM", "BHARTIARTL",
        
        # Real Estate
        "DLF", "GODREJPROP", "PRESTIGE", "SOBHA", "BRIGADE",
        
        # More stocks to reach target
        "TATACONSUM", "BAJAJHLDNG", "DABUR", "MARICO", "GODREJCP",
        "PIDILITIND", "ASIANPAINT", "BERGEPAINT", "KANSAINER", "AKZOINDIA",
        "SHREECEM", "ACC", "AMBUJACEM", "RAMCOCEM", "ORIENTCEM",
        "JKCEMENT", "HEIDELBERG", "PRISM", "BIRLACORPN", "SHRIRAMFIN",
    ]
    
    if size == "small":
        return all_stocks[:50]
    elif size == "medium":
        return all_stocks[:100]
    elif size == "large":
        return all_stocks[:200]
    else:
        return all_stocks


if __name__ == "__main__":
    # Example usage
    print("Data Collector Test")
    print("="*60)
    
    # Get stock list
    stocks = get_nse_stock_list(size="small")  # Start with 50 stocks for testing
    print(f"Selected {len(stocks)} stocks for testing")
    print(f"Sample: {stocks[:5]}")
    print()
    
    # Initialize collector
    collector = DataCollector(window_days=30, period="6mo")
    
    # Collect and prepare data
    training_data = collector.prepare_training_data(
        tickers=stocks,
        output_file="training_data.csv",
        delay=0.5,  # 0.5 second delay between API calls
        handle_missing="forward_fill"
    )
    
    if not training_data.empty:
        print("\n✅ Data collection successful!")
        print(f"\nSample data:")
        print(training_data.head())
        print(f"\nData shape: {training_data.shape}")
        print(f"Features: {len(training_data.columns) - 2}")  # Exclude ticker and date

