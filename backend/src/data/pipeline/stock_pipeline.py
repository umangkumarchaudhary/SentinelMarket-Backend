"""
Stock Data ETL Pipeline
Extracts, transforms, and loads stock price data
"""

import sys
import os
from typing import Dict, List, Any
from datetime import datetime
from .base_pipeline import BasePipeline

# Add parent directories to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

# Import stock data fetcher - handle multiple possible locations
STOCK_FETCHER_AVAILABLE = False
StockDataFetcher = None

try:
    from src.data.stock_data_fetcher import StockDataFetcher
    STOCK_FETCHER_AVAILABLE = True
except ImportError:
    try:
        # Try alternative import path
        import sys
        import os
        parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        from src.data.stock_data_fetcher import StockDataFetcher
        STOCK_FETCHER_AVAILABLE = True
    except ImportError:
        # Fallback: create a simple fetcher
        class StockDataFetcher:
            def __init__(self, market_suffix=""):
                self.market_suffix = market_suffix
            
            def fetch_stock_data(self, ticker: str, exchange: str = "nse") -> Dict:
                # Mock data for testing
                return {
                    "ticker": ticker,
                    "price": 100.0,
                    "volume": 1000000,
                    "change_percent": 1.5,
                    "timestamp": datetime.now().isoformat(),
                    "exchange": exchange.upper()
                }

class StockDataPipeline(BasePipeline):
    """ETL pipeline for stock price data from NSE/BSE"""
    
    def __init__(self):
        super().__init__("stock_data")
        # Popular NSE stocks for data collection
        self.stocks = [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
            "HINDUNILVR", "BHARTIARTL", "ITC", "SBIN", "BAJFINANCE",
            "KOTAKBANK", "LT", "AXISBANK", "ASIANPAINT", "MARUTI",
            "TITAN", "ULTRACEMCO", "NESTLEIND", "WIPRO", "ONGC"
        ]
        # Initialize fetcher
        try:
            if STOCK_FETCHER_AVAILABLE and StockDataFetcher:
                self.fetcher = StockDataFetcher(market_suffix=".NS")  # NSE suffix
            else:
                self.fetcher = StockDataFetcher()  # Use fallback
        except Exception as e:
            self.logger.warning(f"Failed to initialize fetcher: {e}, using fallback")
            self.fetcher = StockDataFetcher()  # Use fallback
    
    def extract(self) -> List[Dict[str, Any]]:
        """
        Extract stock data from API sources
        
        Returns:
            List of raw stock data records
        """
        data = []
        
        for ticker in self.stocks:
            try:
                # Fetch from NSE using StockDataFetcher
                # The fetcher returns data in a specific format
                raw_data = self.fetcher.fetch_stock_data(ticker, "nse")
                # Transform to our format
                stock_data = {
                    "ticker": ticker,
                    "price": raw_data.get("current_price") or raw_data.get("price") or 0,
                    "volume": raw_data.get("volume") or 0,
                    "change_percent": raw_data.get("change_percent") or 0,
                    "timestamp": raw_data.get("timestamp") or datetime.now().isoformat(),
                    "exchange": "NSE"
                }
                if stock_data and stock_data.get("price"):
                    stock_data["source"] = "api"
                    stock_data["extracted_at"] = datetime.now().isoformat()
                    data.append(stock_data)
                    self.logger.debug(f"Extracted data for {ticker}")
                else:
                    self.logger.warning(f"No valid data for {ticker}")
            except Exception as e:
                self.logger.warning(f"Failed to extract {ticker}: {str(e)[:50]}")
                continue
        
        return data
    
    def transform(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform and validate stock data
        
        Args:
            data: Raw stock data from extract stage
            
        Returns:
            List of transformed, validated records
        """
        transformed = []
        
        for record in data:
            try:
                # Validate required fields
                if not record.get("ticker"):
                    self.logger.warning(f"Record missing ticker: {record}")
                    continue
                
                if not record.get("price") or float(record.get("price", 0)) <= 0:
                    self.logger.warning(f"Invalid price for {record.get('ticker')}")
                    continue
                
                # Transform to standardized format
                transformed_record = {
                    "ticker": str(record["ticker"]).upper(),
                    "price": float(record.get("price", 0)),
                    "volume": int(record.get("volume", 0)),
                    "change_percent": float(record.get("change_percent", 0)),
                    "timestamp": record.get("timestamp", datetime.now().isoformat()),
                    "exchange": record.get("exchange", "NSE"),
                    "source": record.get("source", "api"),
                    "processed_at": datetime.now().isoformat(),
                    # Store raw data for audit trail
                    "raw_data": record
                }
                
                # Additional validations
                if transformed_record["price"] > 0 and transformed_record["volume"] >= 0:
                    transformed.append(transformed_record)
                else:
                    self.logger.warning(f"Validation failed for {transformed_record['ticker']}")
                    
            except (ValueError, TypeError, KeyError) as e:
                self.logger.warning(f"Transform error for record: {str(e)[:50]}")
                continue
        
        return transformed
    
    def load(self, data: List[Dict[str, Any]]) -> bool:
        """
        Load transformed data to data warehouse
        
        Args:
            data: Transformed stock data
            
        Returns:
            True if load successful
        """
        try:
            from ..storage.warehouse import DataWarehouse
            
            warehouse = DataWarehouse()
            warehouse.insert_stock_data(data)
            self.logger.info(f"Successfully loaded {len(data)} stock records to warehouse")
            return True
        except Exception as e:
            self.logger.error(f"Load failed: {str(e)}")
            return False

