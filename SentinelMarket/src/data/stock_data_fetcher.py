"""
Stock Data Fetcher
Fetches real-time and historical stock data using yfinance
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import time


class StockDataFetcher:
    """
    Fetches stock data from Yahoo Finance for Indian NSE stocks
    """

    def __init__(self, market_suffix: str = ".NS"):

        """ init we used when we create an object and we want some configuration to be included.  """
        """
        Initialize Stock Data Fetcher

        Args:
            market_suffix: Market suffix for stock tickers (default: ".NS" for NSE India)
        """
        self.market_suffix = market_suffix

    def fetch_historical_data(
        self,
        ticker: str,
        period: str = "3mo",
        interval: str = "1d"
    ) -> Optional[pd.DataFrame]:
        """
        Fetch historical stock data

        Args:
            ticker: Stock ticker symbol (e.g., "SUZLON", "YESBANK")
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

        Returns:
            DataFrame with columns [Date, Open, High, Low, Close, Volume]
        """
        try:
            # Add market suffix if not present
            ticker_formatted = self._format_ticker(ticker)

            # Fetch data
            stock = yf.Ticker(ticker_formatted)
            data = stock.history(period=period, interval=interval)

            if data.empty:
                print(f"Warning: No data found for {ticker_formatted}")
                return None

            # Reset index to make Date a column
            data.reset_index(inplace=True)

            # Ensure required columns exist
            required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
            if not all(col in data.columns for col in required_cols):
                print(f"Warning: Missing required columns for {ticker_formatted}")
                return None

            # Clean data
            data = self._clean_data(data)

            return data[required_cols]

        except Exception as e:
            print(f"Error fetching data for {ticker}: {str(e)}")
            return None

    def fetch_realtime_data(self, ticker: str) -> Optional[Dict]:
        """
        Fetch real-time stock data (latest available)

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with current stock information
        """
        try:
            ticker_formatted = self._format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)

            # Get current info
            info = stock.info

            # Get latest price data
            hist = stock.history(period="1d", interval="1m")

            if hist.empty:
                return None

            latest = hist.iloc[-1]

            return {
                'ticker': ticker,
                'timestamp': datetime.now(),
                'current_price': latest['Close'],
                'open': latest['Open'],
                'high': latest['High'],
                'low': latest['Low'],
                'volume': latest['Volume'],
                'previous_close': info.get('previousClose', None),
                'market_cap': info.get('marketCap', None),
                'day_change_percent': self._calculate_change_percent(
                    latest['Close'],
                    info.get('previousClose', latest['Open'])
                )
            }

        except Exception as e:
            print(f"Error fetching real-time data for {ticker}: {str(e)}")
            return None

    def fetch_multiple_stocks(
        self,
        tickers: List[str],
        period: str = "3mo",
        interval: str = "1d"
    ) -> Dict[str, pd.DataFrame]:
        """
        Fetch historical data for multiple stocks

        Args:
            tickers: List of stock ticker symbols
            period: Data period
            interval: Data interval

        Returns:
            Dictionary with ticker as key and DataFrame as value
        """
        results = {}

        for ticker in tickers:
            print(f"Fetching data for {ticker}...")
            data = self.fetch_historical_data(ticker, period, interval)

            if data is not None:
                results[ticker] = data

            # Rate limiting (avoid overwhelming API)
            time.sleep(0.5)

        return results

    def fetch_intraday_data(
        self,
        ticker: str,
        interval: str = "1m"
    ) -> Optional[pd.DataFrame]:
        """
        Fetch intraday data (today's trading data)

        Args:
            ticker: Stock ticker symbol
            interval: Interval (1m, 2m, 5m, 15m, 30m, 60m)

        Returns:
            DataFrame with intraday data
        """
        try:
            ticker_formatted = self._format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)

            # Fetch today's data
            data = stock.history(period="1d", interval=interval)

            if data.empty:
                return None

            data.reset_index(inplace=True)
            data = self._clean_data(data)

            return data

        except Exception as e:
            print(f"Error fetching intraday data for {ticker}: {str(e)}")
            return None

    def get_stock_info(self, ticker: str) -> Optional[Dict]:
        """
        Get detailed stock information

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary with stock information
        """
        try:
            ticker_formatted = self._format_ticker(ticker)
            stock = yf.Ticker(ticker_formatted)
            info = stock.info

            return {
                'ticker': ticker,
                'company_name': info.get('longName', 'N/A'),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'market_cap': info.get('marketCap', None),
                'previous_close': info.get('previousClose', None),
                'average_volume': info.get('averageVolume', None),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh', None),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow', None)
            }

        except Exception as e:
            print(f"Error fetching stock info for {ticker}: {str(e)}")
            return None

    def _format_ticker(self, ticker: str) -> str:
        """Add market suffix to ticker if not present"""
        if not ticker.endswith(self.market_suffix):
            return f"{ticker}{self.market_suffix}"
        return ticker

    def _clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Clean stock data (remove NaN, handle errors)

        Args:
            data: Raw stock data

        Returns:
            Cleaned DataFrame
        """
        # Remove rows with NaN values
        data = data.dropna()

        # Remove rows with zero volume (market closed)
        if 'Volume' in data.columns:
            data = data[data['Volume'] > 0]

        # Ensure numeric types
        numeric_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
        for col in numeric_cols:
            if col in data.columns:
                data[col] = pd.to_numeric(data[col], errors='coerce')

        # Remove any remaining NaN after conversion
        data = data.dropna()

        return data

    def _calculate_change_percent(self, current: float, previous: float) -> float:
        """Calculate percentage change"""
        if previous == 0 or pd.isna(previous) or pd.isna(current):
            return 0.0
        return ((current - previous) / previous) * 100


# NSE Stock Watchlist (Common pump-and-dump targets)
NSE_WATCHLIST = [
    'SUZLON',       # Suzlon Energy (frequent pump target)
    'YESBANK',      # Yes Bank (volatile)
    'TATASTEEL',    # Tata Steel
    'RELIANCE',     # Reliance Industries
    'INFY',         # Infosys
    'TCS',          # Tata Consultancy Services
    'HDFCBANK',     # HDFC Bank
    'ICICIBANK',    # ICICI Bank
    'SBIN',         # State Bank of India
    'BHARTIARTL',   # Bharti Airtel
    'ITC',          # ITC Limited
    'KOTAKBANK',    # Kotak Mahindra Bank
    'HINDUNILVR',   # Hindustan Unilever
    'AXISBANK',     # Axis Bank
    'LT',           # Larsen & Toubro
    'ASIANPAINT',   # Asian Paints
    'WIPRO',        # Wipro
    'MARUTI',       # Maruti Suzuki
    'ULTRACEMCO',   # UltraTech Cement
    'BAJFINANCE'    # Bajaj Finance
]

# Small-cap stocks (higher manipulation risk)
HIGH_RISK_STOCKS = [
    'SUZLON',
    'YESBANK',
    'RPOWER',       # Reliance Power
    'IDEA',         # Vodafone Idea
    'SAIL',         # Steel Authority of India
    'JINDALSTEL',   # Jindal Steel
    'NMDC',         # NMDC Limited
    'COALINDIA',    # Coal India
    'GAIL',         # GAIL India
    'ONGC'          # Oil and Natural Gas Corporation
]


if __name__ == "__main__":
    # Example usage
    print("Stock Data Fetcher - Example Usage\n")

    fetcher = StockDataFetcher()

    # Test 1: Fetch historical data
    print("=== Fetching Historical Data for SUZLON ===")
    data = fetcher.fetch_historical_data("SUZLON", period="1mo", interval="1d")
    if data is not None:
        print(f"Fetched {len(data)} days of data")
        print(data.tail())
    else:
        print("Failed to fetch data")

    print("\n" + "="*50 + "\n")

    # Test 2: Fetch real-time data
    print("=== Fetching Real-time Data for RELIANCE ===")
    realtime = fetcher.fetch_realtime_data("RELIANCE")
    if realtime:
        print(f"Current Price: ₹{realtime['current_price']:.2f}")
        print(f"Day Change: {realtime['day_change_percent']:.2f}%")
        print(f"Volume: {realtime['volume']:,}")
    else:
        print("Failed to fetch real-time data")

    print("\n" + "="*50 + "\n")

    # Test 3: Fetch multiple stocks
    print("=== Fetching Multiple Stocks ===")
    test_tickers = ['SUZLON', 'YESBANK', 'RELIANCE']
    multi_data = fetcher.fetch_multiple_stocks(test_tickers, period="1mo")
    print(f"Successfully fetched data for {len(multi_data)} stocks")
    for ticker in multi_data:
        print(f"  - {ticker}: {len(multi_data[ticker])} data points")

