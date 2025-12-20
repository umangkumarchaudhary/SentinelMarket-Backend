"""
Feature Engineering for Pump-and-Dump Detection

This module creates features that distinguish pump-and-dump days from normal trading days.

Key Insight: Pump-and-dump schemes have distinct patterns:
1. Volume-Price Divergence (volume spikes but price doesn't sustain)
2. Rapid price acceleration followed by reversal
3. Unusual intraday patterns (concentrated trading)
4. Multi-day momentum patterns
5. Liquidity anomalies
6. Price stability issues during manipulation
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional
from datetime import datetime


class FeatureEngineer:
    """
    Extracts features from stock data that help detect pump-and-dump patterns
    
    Focus: What makes pump-and-dump days DIFFERENT from normal days?
    """
    
    def __init__(self, window_days: int = 30):
        """
        Initialize Feature Engineer
        
        Args:
            window_days: Rolling window for historical comparisons
        """
        self.window_days = window_days
    
    def extract_features(self, stock_data: pd.DataFrame) -> pd.DataFrame:
        """
        Extract all features from stock data
        
        Args:
            stock_data: DataFrame with columns ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        
        Returns:
            DataFrame with extracted features (one row per day)
        """
        if stock_data is None or len(stock_data) < self.window_days:
            return pd.DataFrame()
        
        # Make a copy to avoid modifying original
        data = stock_data.copy()
        
        # Ensure Date is a column (not index)
        if 'Date' not in data.columns and data.index.name == 'Date':
            data.reset_index(inplace=True)
        
        # Sort by date
        if 'Date' in data.columns:
            data = data.sort_values('Date').reset_index(drop=True)
        
        # Initialize features dictionary
        features = {}
        
        # 1. VOLUME-PRICE DIVERGENCE FEATURES
        # Pump-and-dump: Volume spikes but price doesn't sustain the move
        features.update(self._volume_price_divergence(data))
        
        # 2. PRICE ACCELERATION FEATURES
        # Pump-and-dump: Rapid price increase followed by reversal
        features.update(self._price_acceleration(data))
        
        # 3. INTRADAY PATTERN FEATURES
        # Pump-and-dump: Unusual intraday patterns (concentrated trading)
        features.update(self._intraday_patterns(data))
        
        # 4. MULTI-DAY MOMENTUM FEATURES
        # Pump-and-dump: Multi-day momentum patterns
        features.update(self._multi_day_momentum(data))
        
        # 5. LIQUIDITY FEATURES
        # Pump-and-dump: Liquidity anomalies (volume/price ratio, etc.)
        features.update(self._liquidity_features(data))
        
        # 6. PRICE STABILITY FEATURES
        # Pump-and-dump: Price oscillates more during manipulation
        features.update(self._price_stability(data))
        
        # 7. VOLUME DISTRIBUTION FEATURES
        # Pump-and-dump: Volume patterns differ from normal
        features.update(self._volume_distribution(data))
        
        # 8. RELATIVE PERFORMANCE FEATURES
        # Pump-and-dump: Outperforms market abnormally (if market data available)
        # Note: This would need market index data - placeholder for now
        
        # 9. TIME-BASED FEATURES
        # Pump-and-dump: May occur at specific times
        features.update(self._time_based_features(data))
        
        # 10. REVERSAL PATTERN FEATURES
        # Pump-and-dump: Price spikes then drops (classic pattern)
        features.update(self._reversal_patterns(data))
        
        # Convert to DataFrame
        feature_df = pd.DataFrame(features)
        
        # Align with original data (same number of rows)
        if len(feature_df) != len(data):
            # If features are calculated per row, ensure alignment
            feature_df = feature_df.iloc[:len(data)].copy()
        
        return feature_df
    
    def _volume_price_divergence(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Volume-Price Divergence Features
        
        Pump-and-dump characteristic:
        - Volume spikes dramatically
        - But price doesn't sustain the move (divergence)
        - Or price spikes without proportional volume increase
        """
        features = {}
        
        # Calculate returns
        price_returns = data['Close'].pct_change()
        volume_returns = data['Volume'].pct_change()
        
        # Feature 1: Volume-Price Correlation (rolling)
        # Low correlation = divergence (suspicious)
        rolling_corr = data['Volume'].rolling(window=self.window_days).corr(
            data['Close'].pct_change()
        )
        features['volume_price_correlation'] = rolling_corr
        
        # Feature 2: Volume Spike vs Price Change Ratio
        # High volume but low price change = suspicious
        volume_ratio = data['Volume'] / data['Volume'].rolling(window=self.window_days).mean()
        price_change_pct = abs(price_returns * 100)
        
        # Avoid division by zero
        price_change_pct = price_change_pct.replace(0, np.nan)
        volume_price_ratio = volume_ratio / (price_change_pct + 1)  # +1 to avoid zero
        features['volume_price_ratio'] = volume_price_ratio
        
        # Feature 3: Volume Acceleration vs Price Acceleration
        # Volume accelerates faster than price = suspicious
        volume_accel = volume_returns.diff()  # Second derivative
        price_accel = price_returns.diff()
        
        features['volume_acceleration'] = volume_accel
        features['price_acceleration'] = price_accel
        features['volume_price_accel_diff'] = volume_accel - price_accel
        
        # Feature 4: Volume-Price Divergence Score
        # Combined metric: high volume, low price sustainability
        volume_spike = (data['Volume'] > data['Volume'].rolling(window=self.window_days).mean() * 2)
        price_sustained = (data['Close'] > data['Close'].shift(1))
        
        # Divergence: volume spike but price doesn't sustain
        divergence_score = volume_spike.astype(int) - price_sustained.astype(int)
        features['volume_price_divergence'] = divergence_score
        
        return features
    
    def _price_acceleration(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Price Acceleration Features
        
        Pump-and-dump characteristic:
        - Price accelerates rapidly (pump phase)
        - Then decelerates or reverses (dump phase)
        """
        features = {}
        
        # Calculate returns
        returns = data['Close'].pct_change()
        
        # Feature 1: Price Acceleration (second derivative)
        # Rate of change of returns
        price_acceleration = returns.diff()
        features['price_acceleration'] = price_acceleration
        
        # Feature 2: Price Acceleration Rate
        # How fast acceleration is changing
        price_accel_rate = price_acceleration.diff()
        features['price_acceleration_rate'] = price_accel_rate
        
        # Feature 3: Acceleration Magnitude
        # Absolute value of acceleration
        features['price_accel_magnitude'] = abs(price_acceleration)
        
        # Feature 4: Sudden Acceleration Detection
        # Acceleration > 2 standard deviations = sudden spike
        rolling_mean = price_acceleration.rolling(window=self.window_days).mean()
        rolling_std = price_acceleration.rolling(window=self.window_days).std()
        sudden_accel = (price_acceleration - rolling_mean) / (rolling_std + 1e-8)
        features['sudden_acceleration_zscore'] = sudden_accel
        
        # Feature 5: Acceleration Reversal Pattern
        # Positive acceleration followed by negative = pump then dump
        accel_reversal = (price_acceleration > 0) & (price_acceleration.shift(-1) < 0)
        features['acceleration_reversal'] = accel_reversal.astype(int)
        
        return features
    
    def _intraday_patterns(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Intraday Pattern Features
        
        Pump-and-dump characteristic:
        - Unusual intraday ranges (high-low spread)
        - Price closes near high (pump) or low (dump)
        - Intraday volatility spikes
        """
        features = {}
        
        # Feature 1: Intraday Range (High-Low) as % of Close
        intraday_range = ((data['High'] - data['Low']) / data['Close']) * 100
        features['intraday_range_pct'] = intraday_range
        
        # Feature 2: Intraday Range vs Average
        avg_intraday_range = intraday_range.rolling(window=self.window_days).mean()
        features['intraday_range_ratio'] = intraday_range / (avg_intraday_range + 1e-8)
        
        # Feature 3: Close Position in Day Range
        # Where does close fall in the day's range? (0 = low, 1 = high)
        # Pump: close near high (0.8-1.0)
        # Dump: close near low (0.0-0.2)
        close_position = (data['Close'] - data['Low']) / (data['High'] - data['Low'] + 1e-8)
        features['close_position_in_range'] = close_position
        
        # Feature 4: Gap Analysis
        # Gap between previous close and current open
        gap = (data['Open'] - data['Close'].shift(1)) / data['Close'].shift(1) * 100
        features['gap_pct'] = gap
        
        # Feature 5: Gap Fill Pattern
        # Does price fill the gap? (pump-and-dump often doesn't)
        gap_filled = ((gap > 0) & (data['Low'] <= data['Close'].shift(1))) | \
                     ((gap < 0) & (data['High'] >= data['Close'].shift(1)))
        features['gap_filled'] = gap_filled.astype(int)
        
        # Feature 6: Intraday Volatility vs Historical
        intraday_vol = intraday_range
        avg_intraday_vol = intraday_vol.rolling(window=self.window_days).mean()
        features['intraday_volatility_ratio'] = intraday_vol / (avg_intraday_vol + 1e-8)
        
        return features
    
    def _multi_day_momentum(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Multi-Day Momentum Features
        
        Pump-and-dump characteristic:
        - Momentum builds over 2-3 days (pump)
        - Then reverses (dump)
        - Different from normal trends
        """
        features = {}
        
        returns = data['Close'].pct_change()
        
        # Feature 1: 3-Day Momentum
        momentum_3d = returns.rolling(window=3).sum()
        features['momentum_3d'] = momentum_3d
        
        # Feature 2: 5-Day Momentum
        momentum_5d = returns.rolling(window=5).sum()
        features['momentum_5d'] = momentum_5d
        
        # Feature 3: Momentum Change (acceleration)
        momentum_change = momentum_3d.diff()
        features['momentum_change'] = momentum_change
        
        # Feature 4: Momentum Reversal
        # Positive momentum followed by negative = pump then dump
        momentum_reversal = (momentum_3d > 0) & (momentum_3d.shift(-1) < 0)
        features['momentum_reversal'] = momentum_reversal.astype(int)
        
        # Feature 5: Momentum Consistency
        # How consistent is momentum? (pump-and-dump: inconsistent)
        momentum_std = returns.rolling(window=5).std()
        features['momentum_consistency'] = 1 / (momentum_std + 1e-8)  # Inverse: lower std = more consistent
        
        # Feature 6: Momentum vs Volume
        # High momentum with low volume = suspicious (manipulation)
        volume_avg = data['Volume'].rolling(window=5).mean()
        volume_ratio = data['Volume'] / (volume_avg + 1e-8)
        momentum_volume_ratio = abs(momentum_3d) / (volume_ratio + 1e-8)
        features['momentum_volume_ratio'] = momentum_volume_ratio
        
        return features
    
    def _liquidity_features(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Liquidity Features
        
        Pump-and-dump characteristic:
        - Low liquidity stocks are easier to manipulate
        - Volume/price ratio anomalies
        - Turnover rate changes
        """
        features = {}
        
        # Feature 1: Volume-to-Price Ratio
        # Higher ratio = more trading relative to price (can indicate manipulation)
        volume_price_ratio = data['Volume'] / (data['Close'] + 1e-8)
        features['volume_to_price_ratio'] = volume_price_ratio
        
        # Feature 2: Volume-to-Price Ratio vs Average
        avg_vp_ratio = volume_price_ratio.rolling(window=self.window_days).mean()
        features['volume_price_ratio_vs_avg'] = volume_price_ratio / (avg_vp_ratio + 1e-8)
        
        # Feature 3: Dollar Volume (Volume * Price)
        dollar_volume = data['Volume'] * data['Close']
        features['dollar_volume'] = dollar_volume
        
        # Feature 4: Dollar Volume vs Average
        avg_dollar_volume = dollar_volume.rolling(window=self.window_days).mean()
        features['dollar_volume_ratio'] = dollar_volume / (avg_dollar_volume + 1e-8)
        
        # Feature 5: Price Impact (how much price moves per unit volume)
        # Low price impact = high liquidity, high = low liquidity (easier to manipulate)
        price_change = abs(data['Close'].pct_change())
        price_impact = price_change / (data['Volume'] + 1e-8)  # Price change per unit volume
        features['price_impact'] = price_impact
        
        # Feature 6: Liquidity Score (inverse of price impact)
        # Lower liquidity = easier to manipulate
        features['liquidity_score'] = 1 / (price_impact + 1e-8)
        
        return features
    
    def _price_stability(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Price Stability Features
        
        Pump-and-dump characteristic:
        - Price oscillates more during manipulation
        - Less stable than normal trading
        """
        features = {}
        
        returns = data['Close'].pct_change()
        
        # Feature 1: Price Volatility (rolling standard deviation)
        price_volatility = returns.rolling(window=self.window_days).std()
        features['price_volatility'] = price_volatility
        
        # Feature 2: Volatility vs Historical Average
        avg_volatility = price_volatility.rolling(window=self.window_days * 2).mean()
        features['volatility_ratio'] = price_volatility / (avg_volatility + 1e-8)
        
        # Feature 3: Price Oscillation (how much price moves up and down)
        # Calculate number of direction changes
        direction_changes = (returns > 0).astype(int).diff().abs()
        features['price_oscillation'] = direction_changes.rolling(window=5).sum()
        
        # Feature 4: Price Stability Score
        # Lower volatility = more stable
        features['price_stability_score'] = 1 / (price_volatility + 1e-8)
        
        # Feature 5: High-Low Spread (intraday volatility)
        hl_spread = (data['High'] - data['Low']) / data['Close']
        features['hl_spread'] = hl_spread
        
        # Feature 6: HL Spread vs Average
        avg_hl_spread = hl_spread.rolling(window=self.window_days).mean()
        features['hl_spread_ratio'] = hl_spread / (avg_hl_spread + 1e-8)
        
        return features
    
    def _volume_distribution(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Volume Distribution Features
        
        Pump-and-dump characteristic:
        - Volume patterns differ from normal
        - May be concentrated in specific periods
        """
        features = {}
        
        # Feature 1: Volume Trend (increasing/decreasing)
        volume_trend = data['Volume'].rolling(window=5).mean().diff()
        features['volume_trend'] = volume_trend
        
        # Feature 2: Volume Consistency
        # How consistent is volume? (pump-and-dump: inconsistent)
        volume_std = data['Volume'].rolling(window=self.window_days).std()
        volume_mean = data['Volume'].rolling(window=self.window_days).mean()
        volume_cv = volume_std / (volume_mean + 1e-8)  # Coefficient of variation
        features['volume_consistency'] = 1 / (volume_cv + 1e-8)
        
        # Feature 3: Volume Spike Duration
        # How many consecutive days of high volume?
        volume_ratio = data['Volume'] / data['Volume'].rolling(window=self.window_days).mean()
        high_volume = (volume_ratio > 2.0).astype(int)
        
        # Count consecutive high volume days
        volume_spike_duration = high_volume.groupby((high_volume != high_volume.shift()).cumsum()).cumsum()
        features['volume_spike_duration'] = volume_spike_duration
        
        # Feature 4: Volume Mean Reversion
        # Does volume revert to mean after spike? (pump-and-dump: may not)
        volume_reversion = abs(volume_ratio - 1.0)  # Distance from mean
        features['volume_mean_reversion'] = volume_reversion
        
        return features
    
    def _time_based_features(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Time-Based Features
        
        Pump-and-dump characteristic:
        - May occur on specific days of week
        - May occur at month-end/beginning
        """
        features = {}
        
        if 'Date' in data.columns:
            dates = pd.to_datetime(data['Date'])
        else:
            dates = pd.to_datetime(data.index)
        
        # Ensure dates is a Series with datetime accessor
        if isinstance(dates, pd.Series):
            dates_dt = dates.dt
        else:
            dates_dt = dates
        
        # Feature 1: Day of Week (0=Monday, 6=Sunday)
        features['day_of_week'] = dates_dt.dayofweek if hasattr(dates_dt, 'dayofweek') else pd.Series([0] * len(data))
        
        # Feature 2: Is Weekend? (if data includes weekends)
        day_of_week = dates_dt.dayofweek if hasattr(dates_dt, 'dayofweek') else pd.Series([0] * len(data))
        features['is_weekend'] = (day_of_week >= 5).astype(int)
        
        # Feature 3: Day of Month
        features['day_of_month'] = dates_dt.day if hasattr(dates_dt, 'day') else pd.Series([1] * len(data))
        
        # Feature 4: Is Month End? (last 3 days of month)
        day_of_month = dates_dt.day if hasattr(dates_dt, 'day') else pd.Series([1] * len(data))
        features['is_month_end'] = (day_of_month >= 28).astype(int)
        
        # Feature 5: Is Month Beginning? (first 3 days)
        features['is_month_beginning'] = (day_of_month <= 3).astype(int)
        
        return features
    
    def _reversal_patterns(self, data: pd.DataFrame) -> Dict[str, pd.Series]:
        """
        Reversal Pattern Features
        
        Pump-and-dump characteristic:
        - Classic pattern: price spikes then drops
        - Reversal after pump phase
        """
        features = {}
        
        returns = data['Close'].pct_change()
        
        # Feature 1: Reversal Pattern (spike then drop)
        # Positive return followed by negative return
        reversal = (returns > 0.05) & (returns.shift(-1) < -0.05)  # 5% up then 5% down
        features['reversal_pattern'] = reversal.astype(int)
        
        # Feature 2: Reversal Magnitude
        # How big is the reversal?
        reversal_magnitude = abs(returns) + abs(returns.shift(-1))
        features['reversal_magnitude'] = reversal_magnitude
        
        # Feature 3: Pump-Dump Pattern
        # High positive return followed by high negative return
        pump_dump = (returns > 0.10) & (returns.shift(-1) < -0.10)  # 10% up then 10% down
        features['pump_dump_pattern'] = pump_dump.astype(int)
        
        # Feature 4: Price Reversal Score
        # Combined metric for reversal likelihood
        price_above_avg = data['Close'] > data['Close'].rolling(window=self.window_days).mean()
        price_below_next = data['Close'] < data['Close'].shift(-1)
        reversal_score = (price_above_avg & price_below_next).astype(int)
        features['price_reversal_score'] = reversal_score
        
        return features
    
    def get_feature_names(self) -> list:
        """
        Get list of all feature names
        
        Returns:
            List of feature names
        """
        # Create dummy data to extract feature names
        dummy_data = pd.DataFrame({
            'Date': pd.date_range('2024-01-01', periods=50),
            'Open': np.random.rand(50) * 100,
            'High': np.random.rand(50) * 100 + 5,
            'Low': np.random.rand(50) * 100 - 5,
            'Close': np.random.rand(50) * 100,
            'Volume': np.random.randint(1000000, 10000000, 50)
        })
        
        features = self.extract_features(dummy_data)
        return list(features.columns)
    
    def get_feature_count(self) -> int:
        """
        Get total number of features
        
        Returns:
            Number of features
        """
        return len(self.get_feature_names())


# Convenience function
def extract_features(stock_data: pd.DataFrame, window_days: int = 30) -> pd.DataFrame:
    """
    Convenience function to extract features
    
    Args:
        stock_data: DataFrame with stock data
        window_days: Rolling window size
    
    Returns:
        DataFrame with extracted features
    """
    engineer = FeatureEngineer(window_days=window_days)
    return engineer.extract_features(stock_data)


if __name__ == "__main__":
    # Test the feature engineering
    print("Feature Engineering Module Test")
    print("=" * 50)
    
    engineer = FeatureEngineer()
    feature_names = engineer.get_feature_names()
    
    print(f"\nTotal Features: {len(feature_names)}")
    print("\nFeature Categories:")
    print("-" * 50)
    
    categories = {
        'Volume-Price Divergence': [f for f in feature_names if 'volume_price' in f or 'divergence' in f],
        'Price Acceleration': [f for f in feature_names if 'acceleration' in f or 'accel' in f],
        'Intraday Patterns': [f for f in feature_names if 'intraday' in f or 'range' in f or 'gap' in f],
        'Multi-Day Momentum': [f for f in feature_names if 'momentum' in f],
        'Liquidity': [f for f in feature_names if 'liquidity' in f or 'dollar_volume' in f],
        'Price Stability': [f for f in feature_names if 'volatility' in f or 'stability' in f or 'oscillation' in f],
        'Volume Distribution': [f for f in feature_names if 'volume' in f and 'ratio' not in f and 'price' not in f],
        'Time-Based': [f for f in feature_names if 'day' in f or 'week' in f or 'month' in f],
        'Reversal Patterns': [f for f in feature_names if 'reversal' in f or 'pump_dump' in f]
    }
    
    for category, features in categories.items():
        if features:
            print(f"\n{category}: {len(features)} features")
            for feat in features[:5]:  # Show first 5
                print(f"  - {feat}")
            if len(features) > 5:
                print(f"  ... and {len(features) - 5} more")

