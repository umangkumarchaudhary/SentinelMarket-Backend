"""
Isolation Forest Model for Anomaly Detection

Uses Isolation Forest algorithm to detect pump-and-dump patterns
based on the 47 features extracted from stock data.
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional, List
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os


class IsolationForestDetector:
    """
    Isolation Forest model for detecting stock anomalies (pump-and-dump)
    
    The model learns what "normal" trading looks like and flags
    days that don't fit the pattern as anomalies.
    """
    
    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100,
        max_samples: Optional[int] = None,
        random_state: int = 42
    ):
        """
        Initialize Isolation Forest Detector
        
        Args:
            contamination: Expected proportion of anomalies (0.1 = 10%)
            n_estimators: Number of trees (more = more accurate but slower)
            max_samples: Samples per tree (None = auto)
            random_state: Random seed for reproducibility
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        
        # Initialize model
        # max_samples: 'auto' uses min(256, n_samples), or specify int/float
        if max_samples is None:
            max_samples = 'auto'
        
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1  # Use all CPU cores
        )
        
        # Scaler for feature normalization
        self.scaler = StandardScaler()
        
        # Feature columns (will be set during training)
        self.feature_columns = None
        
        # Model metadata
        self.is_trained = False
        self.training_info = {}
    
    def train(
        self,
        training_data: pd.DataFrame,
        feature_columns: Optional[List[str]] = None
    ) -> Dict:
        """
        Train Isolation Forest model on training data
        
        Args:
            training_data: DataFrame with ticker, date, and 47 features
            feature_columns: List of feature column names (auto-detect if None)
        
        Returns:
            Dictionary with training information
        """
        print("="*60)
        print("🤖 TRAINING ISOLATION FOREST MODEL")
        print("="*60)
        print()
        
        # Identify feature columns
        if feature_columns is None:
            # Auto-detect: exclude ticker and date
            exclude_cols = ['ticker', 'date', 'Date']
            feature_columns = [c for c in training_data.columns if c not in exclude_cols]
        
        self.feature_columns = feature_columns
        print(f"Features: {len(feature_columns)}")
        print(f"Training samples: {len(training_data)}")
        print()
        
        # Extract features
        X = training_data[feature_columns].copy()
        
        # Handle any remaining NaN values
        if X.isnull().sum().sum() > 0:
            print(f"⚠️ Found {X.isnull().sum().sum()} missing values, filling with 0")
            X = X.fillna(0)
        
        # Normalize features
        print("Normalizing features...")
        X_scaled = self.scaler.fit_transform(X)
        print("✅ Features normalized")
        print()
        
        # Train model
        print("Training Isolation Forest...")
        print(f"  - Contamination: {self.contamination} ({self.contamination*100}%)")
        print(f"  - Trees: {self.n_estimators}")
        print()
        
        self.model.fit(X_scaled)
        self.is_trained = True
        
        # Get training statistics
        predictions = self.model.predict(X_scaled)
        n_anomalies = (predictions == -1).sum()
        n_normal = (predictions == 1).sum()
        
        self.training_info = {
            'n_samples': len(training_data),
            'n_features': len(feature_columns),
            'n_anomalies_detected': n_anomalies,
            'n_normal_detected': n_normal,
            'anomaly_rate': n_anomalies / len(training_data),
            'contamination': self.contamination,
            'n_estimators': self.n_estimators
        }
        
        print("✅ Model trained successfully!")
        print()
        print("Training Statistics:")
        print(f"  - Total samples: {self.training_info['n_samples']}")
        print(f"  - Anomalies detected: {self.training_info['n_anomalies_detected']} ({self.training_info['anomaly_rate']*100:.1f}%)")
        print(f"  - Normal detected: {self.training_info['n_normal_detected']}")
        print()
        print("="*60)
        
        return self.training_info
    
    def predict(
        self,
        data: pd.DataFrame,
        return_scores: bool = True
    ) -> pd.DataFrame:
        """
        Predict anomalies for new data
        
        Args:
            data: DataFrame with features (must have same columns as training)
            return_scores: If True, return anomaly scores (-1 to 1)
        
        Returns:
            DataFrame with predictions and scores
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        if self.feature_columns is None:
            raise ValueError("Feature columns not set. Model may not be properly trained.")
        
        # Extract features
        X = data[self.feature_columns].copy()
        
        # Handle missing values
        if X.isnull().sum().sum() > 0:
            X = X.fillna(0)
        
        # Normalize
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)  # -1 = anomaly, +1 = normal
        
        # Get anomaly scores (lower = more anomalous)
        anomaly_scores = self.model.score_samples(X_scaled)
        
        # Create results DataFrame
        results = data[['ticker', 'date']].copy() if 'ticker' in data.columns and 'date' in data.columns else pd.DataFrame()
        results['prediction'] = predictions
        results['anomaly_score'] = anomaly_scores
        
        # Convert to risk score (0-100)
        # Lower anomaly_score = higher risk
        # Normalize: -1 (most anomalous) to 1 (most normal)
        min_score = anomaly_scores.min()
        max_score = anomaly_scores.max()
        
        if max_score != min_score:
            # Normalize to 0-100, invert so lower score = higher risk
            normalized = (anomaly_scores - min_score) / (max_score - min_score)
            results['risk_score'] = (1 - normalized) * 100  # Invert: lower score = higher risk
        else:
            results['risk_score'] = 50  # Default if all scores same
        
        # Ensure risk score is 0-100
        results['risk_score'] = results['risk_score'].clip(0, 100)
        
        # Add is_anomaly flag
        results['is_anomaly'] = (predictions == -1)
        
        return results
    
    def predict_single(
        self,
        features: Dict[str, float] or pd.Series
    ) -> Dict:
        """
        Predict for a single sample (one day of features)
        
        Args:
            features: Dictionary or Series with feature values
        
        Returns:
            Dictionary with prediction, anomaly_score, and risk_score
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Convert to DataFrame
        if isinstance(features, dict):
            feature_df = pd.DataFrame([features])
        elif isinstance(features, pd.Series):
            feature_df = pd.DataFrame([features])
        else:
            raise ValueError("Features must be dict or pd.Series")
        
        # Ensure all feature columns present
        for col in self.feature_columns:
            if col not in feature_df.columns:
                feature_df[col] = 0  # Fill missing with 0
        
        # Reorder columns
        feature_df = feature_df[self.feature_columns]
        
        # Normalize
        X_scaled = self.scaler.transform(feature_df)
        
        # Predict
        prediction = self.model.predict(X_scaled)[0]
        anomaly_score = self.model.score_samples(X_scaled)[0]
        
        # Convert to risk score
        # For single prediction, use a simple mapping
        # Lower anomaly_score = higher risk
        if anomaly_score < -0.5:
            risk_score = 80 + (abs(anomaly_score) - 0.5) * 40  # 80-100
        elif anomaly_score < 0:
            risk_score = 60 + abs(anomaly_score) * 40  # 60-80
        elif anomaly_score < 0.5:
            risk_score = 30 + (0.5 - anomaly_score) * 60  # 30-60
        else:
            risk_score = 0 + (1 - anomaly_score) * 60  # 0-30
        
        risk_score = max(0, min(100, risk_score))
        
        return {
            'prediction': int(prediction),
            'anomaly_score': float(anomaly_score),
            'risk_score': float(risk_score),
            'is_anomaly': bool(prediction == -1)
        }
    
    def save_model(self, filepath: str):
        """
        Save trained model to file
        
        Args:
            filepath: Path to save model (e.g., "models/isolation_forest.pkl")
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Nothing to save.")
        
        # Create directory if needed
        os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else '.', exist_ok=True)
        
        # Save model, scaler, and metadata
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators,
            'random_state': self.random_state,
            'training_info': self.training_info,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
        print(f"✅ Model saved to: {filepath}")
    
    def load_model(self, filepath: str):
        """
        Load trained model from file
        
        Args:
            filepath: Path to model file
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.feature_columns = model_data['feature_columns']
        self.contamination = model_data.get('contamination', 0.1)
        self.n_estimators = model_data.get('n_estimators', 100)
        self.random_state = model_data.get('random_state', 42)
        self.training_info = model_data.get('training_info', {})
        self.is_trained = model_data.get('is_trained', True)
        
        print(f"✅ Model loaded from: {filepath}")
        if self.training_info:
            print(f"   Trained on {self.training_info.get('n_samples', 'unknown')} samples")
    
    def get_feature_importance(self, top_n: int = 10) -> pd.DataFrame:
        """
        Get feature importance (based on how often features are used in splits)
        
        Note: Isolation Forest doesn't have direct feature importance,
        but we can estimate based on feature usage in trees.
        
        Args:
            top_n: Number of top features to return
        
        Returns:
            DataFrame with feature names and importance scores
        """
        if not self.is_trained:
            raise ValueError("Model not trained.")
        
        # Isolation Forest doesn't have feature_importances_ like Random Forest
        # But we can use a workaround: check how features affect predictions
        
        # Create baseline (all zeros)
        baseline = np.zeros((1, len(self.feature_columns)))
        baseline_score = self.model.score_samples(baseline)[0]
        
        # Test each feature
        importance_scores = []
        for i, feature in enumerate(self.feature_columns):
            # Set feature to 1 (one standard deviation)
            test_input = np.zeros((1, len(self.feature_columns)))
            test_input[0, i] = 1
            
            test_score = self.model.score_samples(test_input)[0]
            # Larger change = more important
            importance = abs(test_score - baseline_score)
            importance_scores.append(importance)
        
        # Create DataFrame
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': importance_scores
        }).sort_values('importance', ascending=False)
        
        return importance_df.head(top_n)


if __name__ == "__main__":
    # Test the Isolation Forest detector
    print("Isolation Forest Detector Test")
    print("="*60)
    
    # This would be used after data collection
    print("To use this module:")
    print("1. Collect training data (Step 1)")
    print("2. Load training data")
    print("3. Train model:")
    print("   detector = IsolationForestDetector()")
    print("   detector.train(training_data)")
    print("4. Save model:")
    print("   detector.save_model('models/isolation_forest.pkl')")
    print("5. Use for predictions:")
    print("   results = detector.predict(new_data)")

