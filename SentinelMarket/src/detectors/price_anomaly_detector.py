"""
Price Anomaly Detector
Detects unusual price movements using statistical analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Optional
from scipy import stats


class PriceAnomalyDetector:
    """
    Detects abnormal price movements that may indicate manipulation

    Uses statistical methods (Z-score, Bollinger Bands) to identify
    price changes that deviate significantly from historical patterns.
    """

    def __init__(self, window_days: int = 30, z_score_threshold: float = 2.0):
        """
        Initialize the Price Anomaly Detector

        Args:
            window_days: Number of days for calculating statistics (default: 30)
            z_score_threshold: Number of standard deviations for anomaly (default: 2.0)
        """
        self.window_days = window_days
        self.z_score_threshold = z_score_threshold

    def detect(self, stock_data: pd.DataFrame) -> Dict:
        """
        Detect price anomalies in stock data

        Args:
            stock_data: DataFrame with columns ['Date', 'Close', 'Open', 'High', 'Low', 'Volume']

        Returns:
            Dictionary containing detection results and risk score
        """
        if stock_data is None or len(stock_data) < self.window_days:
            return {
                'is_suspicious': False,
                'risk_score': 0,
                'message': f'Insufficient data (need at least {self.window_days} days)',
                'details': {}
            }

        # Calculate daily returns
        returns = stock_data['Close'].pct_change() * 100  # Percentage returns

        # Calculate rolling statistics
        mean_return = returns.rolling(window=self.window_days).mean()
        std_return = returns.rolling(window=self.window_days).std()

        # Current return
        current_return = returns.iloc[-1]
        current_mean = mean_return.iloc[-1]
        current_std = std_return.iloc[-1]

        # Handle edge cases
        if pd.isna(current_return) or pd.isna(current_std) or current_std == 0:
            return {
                'is_suspicious': False,
                'risk_score': 0,
                'message': 'Invalid price data',
                'details': {}
            }

        # Calculate Z-score
        z_score = (current_return - current_mean) / current_std

        # Calculate risk score
        risk_score = self._calculate_risk_score(z_score, current_return)

        # Determine if suspicious
        is_suspicious = abs(z_score) >= self.z_score_threshold

        # Additional metrics
        price_change = ((stock_data['Close'].iloc[-1] - stock_data['Close'].iloc[-2]) /
                       stock_data['Close'].iloc[-2] * 100)

        # Intraday volatility
        intraday_volatility = ((stock_data['High'].iloc[-1] - stock_data['Low'].iloc[-1]) /
                               stock_data['Close'].iloc[-1] * 100)

        return {
            'is_suspicious': is_suspicious,
            'risk_score': risk_score,
            'message': self._generate_message(z_score, current_return, risk_score),
            'details': {
                'z_score': round(z_score, 2),
                'current_return_percent': round(current_return, 2),
                'mean_return_percent': round(current_mean, 2),
                'std_deviation': round(current_std, 2),
                'price_change_percent': round(price_change, 2),
                'intraday_volatility_percent': round(intraday_volatility, 2),
                'current_price': round(stock_data['Close'].iloc[-1], 2),
                'threshold_used': self.z_score_threshold,
                'detection_timestamp': datetime.now().isoformat()
            }
        }

    def detect_multiple_indicators(self, stock_data: pd.DataFrame) -> Dict:
        """
        Advanced detection using multiple technical indicators

        Includes:
        - Z-score analysis
        - Bollinger Bands
        - RSI (Relative Strength Index)
        - Price momentum
        """
        base_result = self.detect(stock_data)

        # Ensure 'details' key exists
        if 'details' not in base_result:
            base_result['details'] = {}

        # Calculate additional indicators
        bollinger_result = self._check_bollinger_bands(stock_data)
        rsi_result = self._check_rsi(stock_data)
        momentum_result = self._check_momentum(stock_data)

        # Combine signals
        combined_risk = self._combine_risk_scores([
            base_result.get('risk_score', 0),
            bollinger_result.get('risk_score', 0),
            rsi_result.get('risk_score', 0),
            momentum_result.get('risk_score', 0)
        ])

        base_result['risk_score'] = combined_risk
        base_result['is_suspicious'] = combined_risk >= 60

        # Add indicator details (safely)
        if 'details' in bollinger_result:
            base_result['details']['bollinger_bands'] = bollinger_result['details']
        if 'details' in rsi_result:
            base_result['details']['rsi'] = rsi_result['details']
        if 'details' in momentum_result:
            base_result['details']['momentum'] = momentum_result['details']

        return base_result

    def _calculate_risk_score(self, z_score: float, current_return: float) -> int:
        """
        Calculate risk score based on Z-score and return magnitude

        Higher absolute Z-scores and returns = higher risk
        """
        abs_z = abs(z_score)
        abs_return = abs(current_return)

        # Base score from Z-score
        if abs_z >= 4:
            base_score = 100
        elif abs_z >= 3:
            base_score = 85
        elif abs_z >= 2.5:
            base_score = 70
        elif abs_z >= 2:
            base_score = 55
        elif abs_z >= 1.5:
            base_score = 35
        else:
            base_score = 0

        # Boost score for extreme returns
        if abs_return >= 20:
            base_score = min(base_score + 20, 100)
        elif abs_return >= 15:
            base_score = min(base_score + 15, 100)
        elif abs_return >= 10:
            base_score = min(base_score + 10, 100)

        return int(base_score)

    def _check_bollinger_bands(self, stock_data: pd.DataFrame, window: int = 20) -> Dict:
        """
        Check if price is outside Bollinger Bands (indicates extreme movement)

        Bollinger Bands: Moving average ± 2 standard deviations
        """
        if len(stock_data) < window:
            return {'risk_score': 0, 'details': {'status': 'insufficient_data'}}

        # Calculate Bollinger Bands
        rolling_mean = stock_data['Close'].rolling(window=window).mean()
        rolling_std = stock_data['Close'].rolling(window=window).std()

        upper_band = rolling_mean + (2 * rolling_std)
        lower_band = rolling_mean - (2 * rolling_std)

        current_price = stock_data['Close'].iloc[-1]
        current_upper = upper_band.iloc[-1]
        current_lower = lower_band.iloc[-1]
        current_mean = rolling_mean.iloc[-1]

        # Check position relative to bands
        if pd.isna(current_upper) or pd.isna(current_lower):
            return {'risk_score': 0, 'details': {'status': 'invalid_data'}}

        risk_score = 0
        status = 'normal'

        if current_price > current_upper:
            # Price above upper band = overbought
            deviation_percent = ((current_price - current_upper) / current_upper) * 100
            risk_score = min(70 + int(deviation_percent * 5), 100)
            status = 'overbought'
        elif current_price < current_lower:
            # Price below lower band = oversold
            deviation_percent = ((current_lower - current_price) / current_lower) * 100
            risk_score = min(70 + int(deviation_percent * 5), 100)
            status = 'oversold'

        return {
            'risk_score': risk_score,
            'details': {
                'status': status,
                'current_price': round(current_price, 2),
                'upper_band': round(current_upper, 2),
                'lower_band': round(current_lower, 2),
                'middle_band': round(current_mean, 2)
            }
        }

    def _check_rsi(self, stock_data: pd.DataFrame, window: int = 14) -> Dict:
        """
        Calculate RSI (Relative Strength Index)

        RSI > 70 = Overbought (potential manipulation/pump)
        RSI < 30 = Oversold (potential dump)
        """
        if len(stock_data) < window + 1:
            return {'risk_score': 0, 'details': {'rsi': None, 'status': 'insufficient_data'}}

        # Calculate price changes
        delta = stock_data['Close'].diff()

        # Separate gains and losses
        gains = delta.where(delta > 0, 0)
        losses = -delta.where(delta < 0, 0)

        # Calculate average gains and losses
        avg_gains = gains.rolling(window=window).mean()
        avg_losses = losses.rolling(window=window).mean()

        # Calculate RS and RSI
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))

        current_rsi = rsi.iloc[-1]

        if pd.isna(current_rsi):
            return {'risk_score': 0, 'details': {'rsi': None, 'status': 'invalid_data'}}

        # Calculate risk score
        risk_score = 0
        status = 'neutral'

        if current_rsi >= 80:
            risk_score = 90
            status = 'extremely_overbought'
        elif current_rsi >= 70:
            risk_score = 70
            status = 'overbought'
        elif current_rsi <= 20:
            risk_score = 90
            status = 'extremely_oversold'
        elif current_rsi <= 30:
            risk_score = 70
            status = 'oversold'

        return {
            'risk_score': risk_score,
            'details': {
                'rsi': round(current_rsi, 2),
                'status': status
            }
        }

    def _check_momentum(self, stock_data: pd.DataFrame, window: int = 10) -> Dict:
        """
        Check price momentum (rate of price change)

        High momentum = rapid price changes = potential manipulation
        """
        if len(stock_data) < window:
            return {'risk_score': 0, 'details': {'momentum': None, 'status': 'insufficient_data'}}

        # Calculate momentum
        momentum = stock_data['Close'].iloc[-1] - stock_data['Close'].iloc[-window]
        momentum_percent = (momentum / stock_data['Close'].iloc[-window]) * 100

        # Calculate risk score
        abs_momentum = abs(momentum_percent)

        if abs_momentum >= 30:
            risk_score = 100
            status = 'extreme_momentum'
        elif abs_momentum >= 20:
            risk_score = 85
            status = 'very_high_momentum'
        elif abs_momentum >= 15:
            risk_score = 70
            status = 'high_momentum'
        elif abs_momentum >= 10:
            risk_score = 50
            status = 'moderate_momentum'
        else:
            risk_score = 0
            status = 'normal_momentum'

        return {
            'risk_score': risk_score,
            'details': {
                'momentum_percent': round(momentum_percent, 2),
                'status': status,
                'period_days': window
            }
        }

    def _combine_risk_scores(self, scores: list) -> int:
        """
        Combine multiple risk scores using weighted average

        Weights: Z-score (40%), Bollinger (25%), RSI (20%), Momentum (15%)
        """
        weights = [0.40, 0.25, 0.20, 0.15]
        combined = sum(score * weight for score, weight in zip(scores, weights))
        return int(combined)

    def _generate_message(self, z_score: float, current_return: float, risk_score: int) -> str:
        """Generate human-readable message"""
        direction = "increased" if current_return > 0 else "decreased"
        abs_return = abs(current_return)

        if risk_score >= 80:
            return f"EXTREME PRICE ANOMALY: Price {direction} {abs_return:.1f}% (Z-score: {z_score:.1f}). High manipulation risk!"
        elif risk_score >= 60:
            return f"HIGH PRICE ANOMALY: Price {direction} {abs_return:.1f}% (Z-score: {z_score:.1f}). Suspicious movement."
        elif risk_score >= 40:
            return f"MODERATE PRICE ANOMALY: Price {direction} {abs_return:.1f}% (Z-score: {z_score:.1f}). Monitor closely."
        else:
            return f"NORMAL PRICE MOVEMENT: Price {direction} {abs_return:.1f}% (Z-score: {z_score:.1f})."


if __name__ == "__main__":
    # Example usage
    print("Price Anomaly Detector - Example Usage\n")

    # Create sample data with anomaly
    dates = pd.date_range(start='2024-01-01', end='2024-02-15', freq='D')
    prices = np.random.uniform(100, 110, size=len(dates))

    # Add a spike on the last day (pump signal)
    prices[-1] = 130  # 20%+ increase

    sample_data = pd.DataFrame({
        'Date': dates,
        'Close': prices,
        'Open': prices * 0.99,
        'High': prices * 1.02,
        'Low': prices * 0.98,
        'Volume': np.random.randint(1000000, 5000000, size=len(dates))
    })

    # Initialize detector
    detector = PriceAnomalyDetector(window_days=30, z_score_threshold=2.0)

    # Basic detection
    print("=== Basic Detection ===")
    result = detector.detect(sample_data)
    print(f"Is Suspicious: {result['is_suspicious']}")
    print(f"Risk Score: {result['risk_score']}/100")
    print(f"Message: {result['message']}")

    # Advanced detection with multiple indicators
    print("\n=== Advanced Detection (Multiple Indicators) ===")
    advanced_result = detector.detect_multiple_indicators(sample_data)
    print(f"Combined Risk Score: {advanced_result['risk_score']}/100")
    print(f"RSI: {advanced_result['details']['rsi']['details']['rsi']}")
    print(f"Bollinger Status: {advanced_result['details']['bollinger_bands']['details']['status']}")
