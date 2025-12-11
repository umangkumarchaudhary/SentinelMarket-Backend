"""
Risk Scorer
Combines multiple detection methods into a unified risk score
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
import os
import sys

# Import detectors (handle both relative and absolute imports)
try:
    from .volume_spike_detector import VolumeSpikeDetector
    from .price_anomaly_detector import PriceAnomalyDetector
except ImportError:
    # Fallback for direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from volume_spike_detector import VolumeSpikeDetector
    from price_anomaly_detector import PriceAnomalyDetector

# Add parent directory to path for ML imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ml.isolation_forest import IsolationForestDetector
    from ml.feature_engineer import FeatureEngineer
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    IsolationForestDetector = None
    FeatureEngineer = None


class RiskScorer:
    """
    Combines multiple anomaly detection methods into a single risk score

    Risk Score Scale:
    - 0-30: LOW RISK (Normal trading)
    - 31-60: MEDIUM RISK (Monitor closely)
    - 61-80: HIGH RISK (Suspicious activity)
    - 81-100: EXTREME RISK (Likely manipulation)
    """

    def __init__(self, ml_model_path: Optional[str] = None, use_ml: bool = True):
        """
        Initialize all detectors
        
        Args:
            ml_model_path: Path to trained Isolation Forest model (default: "models/isolation_forest.pkl")
            use_ml: Whether to use ML model (default: True, falls back to False if model not available)
        """
        self.volume_detector = VolumeSpikeDetector(window_days=30, spike_threshold=2.0)
        self.price_detector = PriceAnomalyDetector(window_days=30, z_score_threshold=2.0)
        
        # ML model initialization
        self.ml_detector = None
        self.feature_engineer = None
        self.ml_enabled = False
        self.ml_error = None
        
        if use_ml and ML_AVAILABLE:
            self._initialize_ml_model(ml_model_path)
        elif use_ml and not ML_AVAILABLE:
            self.ml_error = "ML modules not available (isolation_forest, feature_engineer)"
        
        # Weights for combining scores
        # Updated to give ML more weight when available
        if self.ml_enabled:
            self.weights = {
                'volume': 0.30,      # 30% weight
                'price': 0.35,       # 35% weight (strongest indicator)
                'social': 0.10,      # 10% weight (future: social media)
                'ml': 0.25           # 25% weight (ML model - significant contribution)
            }
        else:
            # Fallback to Phase 1 weights if ML not available
            self.weights = {
                'volume': 0.35,      # 35% weight (strong indicator)
                'price': 0.40,       # 40% weight (strongest indicator)
                'social': 0.15,      # 15% weight (future: social media)
                'ml': 0.10           # 10% weight (not used if ML disabled)
            }
    
    def _initialize_ml_model(self, model_path: Optional[str] = None):
        """
        Initialize ML model with error handling
        
        Args:
            model_path: Path to model file
        """
        if not ML_AVAILABLE:
            self.ml_error = "ML modules not available"
            return
        
        # Default model path
        if model_path is None:
            # Try to find model in common locations
            possible_paths = [
                "models/isolation_forest.pkl",
                "src/ml/models/isolation_forest.pkl",
                os.path.join(os.path.dirname(__file__), "..", "models", "isolation_forest.pkl")
            ]
            
            for path in possible_paths:
                abs_path = os.path.abspath(path)
                if os.path.exists(abs_path):
                    model_path = abs_path
                    break
            
            if model_path is None:
                self.ml_error = f"Model file not found. Tried: {', '.join(possible_paths)}"
                return
        
        try:
            # Initialize feature engineer
            self.feature_engineer = FeatureEngineer(window_days=30)
            
            # Initialize and load model
            self.ml_detector = IsolationForestDetector()
            self.ml_detector.load_model(model_path)
            
            self.ml_enabled = True
            self.ml_error = None
            
        except FileNotFoundError:
            self.ml_error = f"Model file not found: {model_path}"
        except Exception as e:
            self.ml_error = f"Error loading ML model: {str(e)}"
    
    def _get_ml_score(self, stock_data: pd.DataFrame, ticker: str) -> Dict:
        """
        Get ML model risk score with comprehensive error handling
        
        Args:
            stock_data: DataFrame with stock data
            ticker: Stock ticker symbol
        
        Returns:
            Dictionary with ml_score and error info
        """
        if not self.ml_enabled:
            return {
                'ml_score': 0,
                'ml_available': False,
                'ml_error': self.ml_error or "ML model not enabled"
            }
        
        try:
            # Extract features
            features_df = self.feature_engineer.extract_features(stock_data)
            
            if features_df.empty:
                return {
                    'ml_score': 0,
                    'ml_available': False,
                    'ml_error': 'Feature extraction returned empty DataFrame'
                }
            
            # Ensure we have enough data
            if len(features_df) < 1:
                return {
                    'ml_score': 0,
                    'ml_available': False,
                    'ml_error': 'Insufficient data for feature extraction'
                }
            
            # Get latest day's features (most recent)
            latest_features = features_df.iloc[-1:].copy()
            latest_features['ticker'] = ticker
            
            # Add date if not present
            if 'date' not in latest_features.columns:
                if 'Date' in stock_data.columns:
                    latest_features['date'] = stock_data['Date'].iloc[-1]
                else:
                    latest_features['date'] = datetime.now()
            
            # Predict using single prediction method
            ml_result = self.ml_detector.predict_single(latest_features.iloc[0])
            
            return {
                'ml_score': ml_result['risk_score'],
                'ml_available': True,
                'ml_error': None,
                'ml_details': {
                    'anomaly_score': ml_result['anomaly_score'],
                    'is_anomaly': ml_result['is_anomaly'],
                    'prediction': ml_result['prediction']
                }
            }
            
        except Exception as e:
            # Comprehensive error handling
            error_msg = f"ML prediction error: {str(e)}"
            return {
                'ml_score': 0,
                'ml_available': False,
                'ml_error': error_msg
            }

    def calculate_risk_score(self, stock_data: pd.DataFrame, ticker: str = "UNKNOWN") -> Dict:
        """
        Calculate comprehensive risk score for a stock

        Args:
            stock_data: DataFrame with stock price/volume data
            ticker: Stock ticker symbol

        Returns:
            Dictionary with risk assessment results
        """
        # Run all detectors
        volume_result = self.volume_detector.detect(stock_data)
        price_result = self.price_detector.detect_multiple_indicators(stock_data)

        # Get ML score (with error handling)
        ml_result = self._get_ml_score(stock_data, ticker)
        ml_score = ml_result['ml_score']
        ml_available = ml_result['ml_available']
        ml_error = ml_result.get('ml_error')

        # Placeholder for future detectors
        social_score = 0  # Phase 3: Social media monitoring

        # Calculate weighted risk score (safely get risk scores)
        volume_risk = volume_result.get('risk_score', 0)
        price_risk = price_result.get('risk_score', 0)
        
        # Adjust weights if ML is not available
        if not ml_available:
            # Redistribute ML weight to volume and price
            effective_weights = {
                'volume': self.weights['volume'] + (self.weights['ml'] * 0.4),
                'price': self.weights['price'] + (self.weights['ml'] * 0.6),
                'social': self.weights['social'],
                'ml': 0
            }
        else:
            effective_weights = self.weights
        
        final_risk_score = (
            volume_risk * effective_weights['volume'] +
            price_risk * effective_weights['price'] +
            social_score * effective_weights['social'] +
            ml_score * effective_weights['ml']
        )

        final_risk_score = int(final_risk_score)

        # Determine risk level
        risk_level = self._get_risk_level(final_risk_score)

        # Generate comprehensive explanation (include ML info)
        explanation = self._generate_explanation(
            volume_result,
            price_result,
            final_risk_score,
            ml_result
        )

        # Collect all red flags (include ML flags)
        red_flags = self._identify_red_flags(volume_result, price_result, ml_result)

        # Build details dictionary
        details = {
            'volume': volume_result.get('details', {}),
            'price': price_result.get('details', {}),
            'timestamp': datetime.now().isoformat()
        }
        
        # Add ML details if available
        if ml_available and 'ml_details' in ml_result:
            details['ml'] = ml_result['ml_details']
        elif ml_error:
            details['ml'] = {'error': ml_error, 'available': False}

        return {
            'ticker': ticker,
            'risk_score': final_risk_score,
            'risk_level': risk_level,
            'is_suspicious': final_risk_score >= 60,
            'explanation': explanation,
            'red_flags': red_flags,
            'individual_scores': {
                'volume_spike': volume_result.get('risk_score', 0),
                'price_anomaly': price_result.get('risk_score', 0),
                'social_sentiment': social_score,
                'ml_anomaly': ml_score
            },
            'ml_status': {
                'enabled': ml_available,
                'error': ml_error,
                'score': ml_score
            },
            'details': details,
            'recommendation': self._get_recommendation(final_risk_score, risk_level)
        }

    def batch_calculate_risk(self, stock_data_dict: Dict[str, pd.DataFrame]) -> Dict[str, Dict]:
        """
        Calculate risk scores for multiple stocks

        Args:
            stock_data_dict: Dictionary with ticker as key and DataFrame as value

        Returns:
            Dictionary with risk assessments for each stock
        """
        results = {}

        for ticker, data in stock_data_dict.items():
            try:
                results[ticker] = self.calculate_risk_score(data, ticker)
            except Exception as e:
                results[ticker] = {
                    'ticker': ticker,
                    'risk_score': 0,
                    'risk_level': 'ERROR',
                    'is_suspicious': False,
                    'explanation': f'Error calculating risk: {str(e)}',
                    'red_flags': [],
                    'individual_scores': {},
                    'details': {},
                    'recommendation': 'Unable to analyze - data error'
                }

        return results

    def get_high_risk_stocks(self, results: Dict[str, Dict], threshold: int = 60) -> List[Dict]:
        """
        Filter and return high-risk stocks from batch results

        Args:
            results: Results from batch_calculate_risk()
            threshold: Minimum risk score to include

        Returns:
            List of high-risk stocks sorted by risk score (descending)
        """
        high_risk = [
            {
                'ticker': ticker,
                'risk_score': result['risk_score'],
                'risk_level': result['risk_level'],
                'red_flags': result['red_flags']
            }
            for ticker, result in results.items()
            if result['risk_score'] >= threshold
        ]

        # Sort by risk score (highest first)
        high_risk.sort(key=lambda x: x['risk_score'], reverse=True)

        return high_risk

    def _get_risk_level(self, score: int) -> str:
        """Convert numeric risk score to risk level"""
        if score >= 80:
            return "EXTREME RISK"
        elif score >= 60:
            return "HIGH RISK"
        elif score >= 40:
            return "MEDIUM RISK"
        elif score >= 20:
            return "LOW RISK"
        else:
            return "MINIMAL RISK"

    def _generate_explanation(
        self, 
        volume_result: Dict, 
        price_result: Dict, 
        final_score: int,
        ml_result: Optional[Dict] = None
    ) -> str:
        """Generate human-readable explanation of risk assessment"""
        explanations = []

        # Volume analysis
        volume_details = volume_result.get('details', {})
        if volume_result.get('is_suspicious', False):
            vol_ratio = volume_details.get('volume_ratio', 0)
            if vol_ratio > 0:
                explanations.append(f"Trading volume is {vol_ratio}x above normal")

        # Price analysis
        price_details = price_result.get('details', {})
        if price_result.get('is_suspicious', False):
            price_change = price_details.get('price_change_percent', 0)
            z_score = price_details.get('z_score', 0)
            if price_change != 0:
                direction = "increased" if price_change > 0 else "decreased"
                explanations.append(
                    f"Price {direction} abnormally ({abs(price_change):.1f}%, Z-score: {z_score:.1f})"
                )

        # RSI check
        if 'rsi' in price_details and isinstance(price_details['rsi'], dict):
            rsi_data = price_details['rsi'].get('details', {})
            if isinstance(rsi_data, dict) and 'status' in rsi_data:
                status = rsi_data['status']
                if status in ['overbought', 'extremely_overbought']:
                    rsi_val = rsi_data.get('rsi', 'N/A')
                    explanations.append(f"RSI indicates overbought condition ({rsi_val})")
                elif status in ['oversold', 'extremely_oversold']:
                    rsi_val = rsi_data.get('rsi', 'N/A')
                    explanations.append(f"RSI indicates oversold condition ({rsi_val})")

        # Bollinger Bands check
        if 'bollinger_bands' in price_details and isinstance(price_details['bollinger_bands'], dict):
            bb_data = price_details['bollinger_bands'].get('details', {})
            if isinstance(bb_data, dict) and 'status' in bb_data:
                status = bb_data['status']
                if status == 'overbought':
                    explanations.append("Price above Bollinger Band upper limit")
                elif status == 'oversold':
                    explanations.append("Price below Bollinger Band lower limit")

        # ML analysis
        if ml_result and ml_result.get('ml_available', False):
            ml_score = ml_result.get('ml_score', 0)
            ml_details = ml_result.get('ml_details', {})
            
            if ml_score >= 70:
                explanations.append(f"ML model detected high-risk pattern (score: {ml_score:.0f})")
            elif ml_score >= 50:
                explanations.append(f"ML model detected moderate risk (score: {ml_score:.0f})")
            
            if ml_details.get('is_anomaly', False):
                explanations.append("ML model flagged as anomaly pattern")

        if not explanations:
            if final_score >= 40:
                return "Multiple weak signals detected - monitor for further activity"
            else:
                return "No significant anomalies detected - normal trading activity"

        return " | ".join(explanations)

    def _identify_red_flags(
        self, 
        volume_result: Dict, 
        price_result: Dict,
        ml_result: Optional[Dict] = None
    ) -> List[str]:
        """Identify specific red flags (warning signs)"""
        red_flags = []

        volume_details = volume_result.get('details', {})
        price_details = price_result.get('details', {})
        volume_risk = volume_result.get('risk_score', 0)
        price_risk = price_result.get('risk_score', 0)

        # Critical volume spike
        if volume_risk >= 80:
            vol_ratio = volume_details.get('volume_ratio', 0)
            red_flags.append(f"🚨 EXTREME volume spike ({vol_ratio}x normal)")
        elif volume_risk >= 60:
            vol_ratio = volume_details.get('volume_ratio', 0)
            red_flags.append(f"⚠️ HIGH volume spike ({vol_ratio}x normal)")

        # Critical price movement
        if price_risk >= 80:
            price_change = price_details.get('price_change_percent', 0)
            red_flags.append(f"🚨 EXTREME price movement ({abs(price_change):.1f}%)")
        elif price_risk >= 60:
            price_change = price_details.get('price_change_percent', 0)
            red_flags.append(f"⚠️ UNUSUAL price movement ({abs(price_change):.1f}%)")

        # RSI warnings
        if 'rsi' in price_details and isinstance(price_details['rsi'], dict):
            rsi_data = price_details['rsi'].get('details', {})
            if isinstance(rsi_data, dict) and 'status' in rsi_data:
                status = rsi_data['status']
                if status == 'extremely_overbought':
                    rsi_val = rsi_data.get('rsi', 'N/A')
                    red_flags.append(f"🚨 RSI extremely overbought ({rsi_val})")
                elif status == 'extremely_oversold':
                    rsi_val = rsi_data.get('rsi', 'N/A')
                    red_flags.append(f"🚨 RSI extremely oversold ({rsi_val})")

        # High momentum
        if 'momentum' in price_details and isinstance(price_details['momentum'], dict):
            momentum_data = price_details['momentum'].get('details', {})
            if isinstance(momentum_data, dict) and 'status' in momentum_data:
                status = momentum_data['status']
                if status in ['extreme_momentum', 'very_high_momentum']:
                    momentum_pct = momentum_data.get('momentum_percent', 0)
                    red_flags.append(f"⚠️ High price momentum ({momentum_pct:.1f}%)")

        # ML red flags
        if ml_result and ml_result.get('ml_available', False):
            ml_score = ml_result.get('ml_score', 0)
            ml_details = ml_result.get('ml_details', {})
            
            if ml_score >= 80:
                red_flags.append(f"🚨 ML MODEL: EXTREME risk detected (score: {ml_score:.0f})")
            elif ml_score >= 60:
                red_flags.append(f"⚠️ ML MODEL: High risk detected (score: {ml_score:.0f})")
            
            if ml_details.get('is_anomaly', False):
                red_flags.append("🤖 ML MODEL: Anomaly pattern detected")
        
        # Combined suspicious activity
        if volume_result.get('is_suspicious', False) and price_result.get('is_suspicious', False):
            red_flags.append("🚨 CRITICAL: Both volume AND price showing anomalies (classic pump-and-dump pattern)")
        
        # ML + Statistical combination
        if ml_result and ml_result.get('ml_available', False):
            ml_score = ml_result.get('ml_score', 0)
            volume_risk = volume_result.get('risk_score', 0)
            price_risk = price_result.get('risk_score', 0)
            
            if ml_score >= 60 and (volume_risk >= 60 or price_risk >= 60):
                red_flags.append("🚨 CRITICAL: ML model AND statistical methods both flagging high risk")

        return red_flags

    def _get_recommendation(self, risk_score: int, risk_level: str) -> str:
        """Generate actionable recommendation based on risk assessment"""
        if risk_score >= 80:
            return "⛔ DO NOT BUY - Extremely high manipulation risk. Likely pump-and-dump in progress."
        elif risk_score >= 60:
            return "⚠️ AVOID - High risk detected. Wait for more information before investing."
        elif risk_score >= 40:
            return "⚡ CAUTION - Moderate risk. Research thoroughly and verify news before investing."
        elif risk_score >= 20:
            return "ℹ️ MONITOR - Low risk but worth watching. Proceed with normal due diligence."
        else:
            return "✅ NORMAL - No significant manipulation signals detected."

    def generate_alert_summary(self, risk_result: Dict) -> str:
        """
        Generate formatted alert summary for notifications

        Args:
            risk_result: Result from calculate_risk_score()

        Returns:
            Formatted alert text
        """
        ticker = risk_result['ticker']
        score = risk_result['risk_score']
        level = risk_result['risk_level']
        explanation = risk_result['explanation']

        alert = f"""
🚨 STOCK ALERT: {ticker}

Risk Score: {score}/100 ({level})

{explanation}

Red Flags:
{chr(10).join(['  • ' + flag for flag in risk_result['red_flags']]) if risk_result['red_flags'] else '  None'}

Recommendation: {risk_result['recommendation']}

Detected at: {risk_result['details']['timestamp']}
        """

        return alert.strip()


if __name__ == "__main__":
    # Example usage
    print("Risk Scorer - Example Usage\n")

    # Import data fetcher
    import sys
    sys.path.append('../data')
    from stock_data_fetcher import StockDataFetcher

    # Initialize
    fetcher = StockDataFetcher()
    scorer = RiskScorer()

    # Test with real stock data
    print("=== Analyzing SUZLON ===")
    data = fetcher.fetch_historical_data("SUZLON", period="3mo")

    if data is not None:
        result = scorer.calculate_risk_score(data, "SUZLON")

        print(f"\nTicker: {result['ticker']}")
        print(f"Risk Score: {result['risk_score']}/100")
        print(f"Risk Level: {result['risk_level']}")
        print(f"Is Suspicious: {result['is_suspicious']}")
        print(f"\nExplanation: {result['explanation']}")
        print(f"\nRecommendation: {result['recommendation']}")

        if result['red_flags']:
            print("\nRed Flags:")
            for flag in result['red_flags']:
                print(f"  {flag}")

        print("\n" + "="*60)
        print("\nALERT FORMAT:")
        print(scorer.generate_alert_summary(result))
