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
        Also stores raw data in data lake for audit trail
        
        Returns:
            List of raw stock data records
        """
        from ..storage.data_lake import DataLake
        
        data_lake = DataLake()
        data = []
        
        for ticker in self.stocks:
            try:
                # Fetch from NSE using StockDataFetcher
                # The fetcher returns data in a specific format
                raw_data = self.fetcher.fetch_stock_data(ticker, "nse")
                
                # Store raw data in data lake
                try:
                    data_lake.store_raw_data(
                        source="nse_api",
                        data={"ticker": ticker, "raw_response": raw_data},
                        timestamp=datetime.now()
                    )
                except Exception as e:
                    self.logger.warning(f"Failed to store in data lake: {e}")
                
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
        from src.data.validation import DataValidator

        validator = DataValidator()
        transformed: List[Dict[str, Any]] = []
        
        for record in data:
            try:
                # Use shared validator
                if not validator.validate_stock_record(record):
                    self.logger.warning(f"[validation] Invalid stock record: {record.get('ticker')}")
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
                    "raw_data": record,
                }
                
                transformed.append(transformed_record)
                    
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

