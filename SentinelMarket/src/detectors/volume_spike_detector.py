"""
Volume Spike Detector
Detects abnormal trading volume that may indicate pump-and-dump schemes
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional


class VolumeSpikeDetector:
    """
    Detects unusual volume spikes in stock trading data

    A volume spike occurs when current trading volume significantly exceeds
    the historical average, often indicating manipulation or unusual activity.
    """

    def __init__(self, window_days: int = 30, spike_threshold: float = 2.0):
        """
        Initialize the Volume Spike Detector

        Args:
            window_days: Number of days to use for average calculation (default: 30)
            spike_threshold: Multiplier for defining a spike (default: 2.0 = 2x average)
        """
        self.window_days = window_days
        self.spike_threshold = spike_threshold

    def detect(self, stock_data: pd.DataFrame) -> Dict:
        """
        Detect volume spikes in stock data

        Args:
            stock_data: DataFrame with columns ['Date', 'Volume', 'Close', 'Open', 'High', 'Low']

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

        # Calculate average volume
        avg_volume = stock_data['Volume'].rolling(window=self.window_days).mean()
        current_volume = stock_data['Volume'].iloc[-1]
        avg_volume_value = avg_volume.iloc[-1]

        # Handle edge cases
        if pd.isna(avg_volume_value) or avg_volume_value == 0:
            return {
                'is_suspicious': False,
                'risk_score': 0,
                'message': 'Invalid volume data',
                'details': {}
            }

        # Calculate volume ratio
        volume_ratio = current_volume / avg_volume_value

        # Calculate risk score (0-100)
        risk_score = self._calculate_risk_score(volume_ratio)

        # Determine if suspicious
        is_suspicious = volume_ratio >= self.spike_threshold

        # Get additional context
        price_change = self._calculate_price_change(stock_data)

        return {
            'is_suspicious': is_suspicious,
            'risk_score': risk_score,
            'message': self._generate_message(volume_ratio, risk_score),
            'details': {
                'current_volume': int(current_volume),
                'average_volume': int(avg_volume_value),
                'volume_ratio': round(volume_ratio, 2),
                'price_change_percent': round(price_change, 2),
                'threshold_used': self.spike_threshold,
                'detection_timestamp': datetime.now().isoformat()
            }
        }

    def detect_realtime(self, stock_data: pd.DataFrame, previous_data: Optional[pd.DataFrame] = None) -> Dict:
        """
        Real-time volume spike detection (compares current minute/hour to recent average)

        Args:
            stock_data: Current stock data
            previous_data: Historical data for comparison

        Returns:
            Detection results with real-time metrics
        """
        result = self.detect(stock_data)

        # Add real-time specific metrics
        if previous_data is not None and len(previous_data) > 0:
            recent_volume_change = self._calculate_recent_change(stock_data, previous_data)
            result['details']['recent_volume_change_percent'] = round(recent_volume_change, 2)

            # Increase risk score if rapid change
            if recent_volume_change > 100:  # 100% increase in short time
                result['risk_score'] = min(result['risk_score'] + 20, 100)
                result['is_suspicious'] = True

        return result

    def _calculate_risk_score(self, volume_ratio: float) -> int:
        """
        Calculate risk score based on volume ratio

        Risk Score Scale:
        - 0-30: Low risk (normal trading)
        - 31-60: Medium risk (monitor)
        - 61-80: High risk (suspicious)
        - 81-100: Extreme risk (likely manipulation)
        """
        if volume_ratio >= 10:
            return 100  # Extreme spike (10x+ volume)
        elif volume_ratio >= 5:
            return 90  # Very high spike (5-10x)
        elif volume_ratio >= 4:
            return 80  # High spike (4-5x)
        elif volume_ratio >= 3:
            return 70  # Significant spike (3-4x)
        elif volume_ratio >= 2.5:
            return 60  # Moderate spike (2.5-3x)
        elif volume_ratio >= 2:
            return 50  # Low spike (2-2.5x)
        elif volume_ratio >= 1.5:
            return 30  # Slight increase
        else:
            return 0  # Normal volume

    def _calculate_price_change(self, stock_data: pd.DataFrame) -> float:
        """Calculate percentage price change for the latest period"""
        if len(stock_data) < 2:
            return 0.0

        current_price = stock_data['Close'].iloc[-1]
        previous_price = stock_data['Close'].iloc[-2]

        if previous_price == 0:
            return 0.0

        return ((current_price - previous_price) / previous_price) * 100

    def _calculate_recent_change(self, current_data: pd.DataFrame, previous_data: pd.DataFrame) -> float:
        """Calculate volume change between current and previous reading"""
        current_volume = current_data['Volume'].iloc[-1]
        previous_volume = previous_data['Volume'].iloc[-1]

        if previous_volume == 0:
            return 0.0

        return ((current_volume - previous_volume) / previous_volume) * 100

    def _generate_message(self, volume_ratio: float, risk_score: int) -> str:
        """Generate human-readable message about the detection"""
        if risk_score >= 80:
            return f"EXTREME VOLUME SPIKE: {volume_ratio:.1f}x normal volume detected. High manipulation risk!"
        elif risk_score >= 60:
            return f"HIGH VOLUME SPIKE: {volume_ratio:.1f}x normal volume detected. Suspicious activity."
        elif risk_score >= 40:
            return f"MODERATE VOLUME SPIKE: {volume_ratio:.1f}x normal volume detected. Monitor closely."
        elif risk_score >= 20:
            return f"SLIGHT VOLUME INCREASE: {volume_ratio:.1f}x normal volume. May be normal market activity."
        else:
            return f"NORMAL VOLUME: {volume_ratio:.1f}x average. No anomaly detected."

    def batch_detect(self, stock_data_dict: Dict[str, pd.DataFrame]) -> Dict[str, Dict]:
        """
        Detect volume spikes across multiple stocks

        Args:
            stock_data_dict: Dictionary with ticker as key and DataFrame as value

        Returns:
            Dictionary with detection results for each stock
        """
        results = {}

        for ticker, data in stock_data_dict.items():
            try:
                results[ticker] = self.detect(data)
            except Exception as e:
                results[ticker] = {
                    'is_suspicious': False,
                    'risk_score': 0,
                    'message': f'Error processing {ticker}: {str(e)}',
                    'details': {}
                }

        return results

    def get_top_suspicious_stocks(self, results: Dict[str, Dict], top_n: int = 10) -> list:
        """
        Get top N most suspicious stocks from batch detection results

        Args:
            results: Results from batch_detect()
            top_n: Number of top suspicious stocks to return

        Returns:
            List of tuples (ticker, risk_score) sorted by risk score
        """
        suspicious_stocks = [
            (ticker, result['risk_score'])
            for ticker, result in results.items()
            if result['is_suspicious']
        ]

        # Sort by risk score (descending)
        suspicious_stocks.sort(key=lambda x: x[1], reverse=True)

        return suspicious_stocks[:top_n]


if __name__ == "__main__":
    # Example usage
    print("Volume Spike Detector - Example Usage\n")

    # Create sample data
    dates = pd.date_range(start='2024-01-01', end='2024-02-15', freq='D')
    sample_data = pd.DataFrame({
        'Date': dates,
        'Volume': np.random.randint(1000000, 5000000, size=len(dates)),
        'Close': np.random.uniform(100, 150, size=len(dates)),
        'Open': np.random.uniform(100, 150, size=len(dates)),
        'High': np.random.uniform(100, 150, size=len(dates)),
        'Low': np.random.uniform(100, 150, size=len(dates))
    })

    # Simulate a volume spike on the last day
    sample_data.loc[sample_data.index[-1], 'Volume'] = 15000000  # 3-5x spike

    # Initialize detector
    detector = VolumeSpikeDetector(window_days=30, spike_threshold=2.0)

    # Detect
    result = detector.detect(sample_data)

    # Print results
    print(f"Is Suspicious: {result['is_suspicious']}")
    print(f"Risk Score: {result['risk_score']}/100")
    print(f"Message: {result['message']}")
    print(f"\nDetails:")
    for key, value in result['details'].items():
        print(f"  {key}: {value}")
