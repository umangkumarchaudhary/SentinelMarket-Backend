"""
Model Evaluator for Isolation Forest

Evaluates model performance, compares with Phase 1 methods,
and provides optimization recommendations.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns


class ModelEvaluator:
    """
    Evaluates Isolation Forest model performance
    
    Since we don't have labeled pump-and-dump cases, evaluation focuses on:
    1. Model statistics (anomaly detection rate)
    2. Comparison with Phase 1 methods
    3. Feature importance analysis
    4. Parameter sensitivity analysis
    """
    
    def __init__(self):
        """Initialize Model Evaluator"""
        self.evaluation_results = {}
    
    def evaluate_model(
        self,
        predictions: pd.DataFrame,
        phase1_scores: Optional[pd.DataFrame] = None
    ) -> Dict:
        """
        Evaluate model predictions
        
        Args:
            predictions: DataFrame with columns: ticker, date, prediction, risk_score, is_anomaly
            phase1_scores: Optional DataFrame with Phase 1 risk scores for comparison
        
        Returns:
            Dictionary with evaluation metrics
        """
        print("="*60)
        print("📊 MODEL EVALUATION")
        print("="*60)
        print()
        
        # Basic statistics
        n_total = len(predictions)
        n_anomalies = predictions['is_anomaly'].sum()
        n_normal = (~predictions['is_anomaly']).sum()
        anomaly_rate = n_anomalies / n_total
        
        print("Detection Statistics:")
        print(f"  - Total samples: {n_total}")
        print(f"  - Anomalies detected: {n_anomalies} ({anomaly_rate*100:.1f}%)")
        print(f"  - Normal detected: {n_normal} ({n_normal*100:.1f}%)")
        print()
        
        # Risk score statistics
        risk_stats = predictions['risk_score'].describe()
        print("Risk Score Statistics:")
        print(f"  - Mean: {risk_stats['mean']:.1f}")
        print(f"  - Median: {risk_stats['50%']:.1f}")
        print(f"  - Min: {risk_stats['min']:.1f}")
        print(f"  - Max: {risk_stats['max']:.1f}")
        print(f"  - Std Dev: {risk_stats['std']:.1f}")
        print()
        
        # High-risk detection
        high_risk = (predictions['risk_score'] >= 60).sum()
        medium_risk = ((predictions['risk_score'] >= 30) & (predictions['risk_score'] < 60)).sum()
        low_risk = (predictions['risk_score'] < 30).sum()
        
        print("Risk Distribution:")
        print(f"  - High Risk (≥60): {high_risk} ({high_risk/n_total*100:.1f}%)")
        print(f"  - Medium Risk (30-59): {medium_risk} ({medium_risk/n_total*100:.1f}%)")
        print(f"  - Low Risk (<30): {low_risk} ({low_risk/n_total*100:.1f}%)")
        print()
        
        # Per-stock analysis
        if 'ticker' in predictions.columns:
            stock_analysis = self._analyze_by_stock(predictions)
            print("Top 10 Stocks by Average Risk Score:")
            print("-"*60)
            top_risky = stock_analysis.head(10)
            for idx, row in top_risky.iterrows():
                print(f"{row['ticker']:15s} Avg Risk: {row['avg_risk']:5.1f}  Anomalies: {row['n_anomalies']:3d}")
            print()
        
        # Compare with Phase 1 if available
        if phase1_scores is not None:
            comparison = self._compare_with_phase1(predictions, phase1_scores)
            print("Comparison with Phase 1 (Statistical Methods):")
            print("-"*60)
            print(f"  - Correlation: {comparison['correlation']:.3f}")
            print(f"  - Mean difference: {comparison['mean_diff']:.2f}")
            print(f"  - Both flag high risk: {comparison['both_high_risk']} cases")
            print(f"  - ML only: {comparison['ml_only']} cases")
            print(f"  - Phase 1 only: {comparison['phase1_only']} cases")
            print()
        
        # Store results
        self.evaluation_results = {
            'n_total': n_total,
            'n_anomalies': n_anomalies,
            'n_normal': n_normal,
            'anomaly_rate': anomaly_rate,
            'risk_stats': risk_stats.to_dict(),
            'risk_distribution': {
                'high': high_risk,
                'medium': medium_risk,
                'low': low_risk
            }
        }
        
        if phase1_scores is not None:
            self.evaluation_results['phase1_comparison'] = comparison
        
        print("="*60)
        print("✅ EVALUATION COMPLETE")
        print("="*60)
        
        return self.evaluation_results
    
    def _analyze_by_stock(self, predictions: pd.DataFrame) -> pd.DataFrame:
        """Analyze predictions by stock"""
        if 'ticker' not in predictions.columns:
            return pd.DataFrame()
        
        stock_stats = predictions.groupby('ticker').agg({
            'risk_score': ['mean', 'max', 'min', 'std'],
            'is_anomaly': 'sum'
        }).reset_index()
        
        stock_stats.columns = ['ticker', 'avg_risk', 'max_risk', 'min_risk', 'std_risk', 'n_anomalies']
        stock_stats = stock_stats.sort_values('avg_risk', ascending=False)
        
        return stock_stats
    
    def _compare_with_phase1(
        self,
        ml_predictions: pd.DataFrame,
        phase1_scores: pd.DataFrame
    ) -> Dict:
        """Compare ML predictions with Phase 1 statistical methods"""
        
        # Merge on ticker and date
        if 'date' in ml_predictions.columns and 'date' in phase1_scores.columns:
            merged = pd.merge(
                ml_predictions[['ticker', 'date', 'risk_score']],
                phase1_scores[['ticker', 'date', 'risk_score']],
                on=['ticker', 'date'],
                suffixes=('_ml', '_phase1'),
                how='inner'
            )
        else:
            # If no date, merge on ticker only
            merged = pd.merge(
                ml_predictions[['ticker', 'risk_score']],
                phase1_scores[['ticker', 'risk_score']],
                on='ticker',
                suffixes=('_ml', '_phase1'),
                how='inner'
            )
        
        if merged.empty:
            return {
                'correlation': 0.0,
                'mean_diff': 0.0,
                'both_high_risk': 0,
                'ml_only': 0,
                'phase1_only': 0
            }
        
        # Calculate correlation
        correlation = merged['risk_score_ml'].corr(merged['risk_score_phase1'])
        
        # Mean difference
        mean_diff = (merged['risk_score_ml'] - merged['risk_score_phase1']).mean()
        
        # High risk comparison (≥60)
        ml_high = merged['risk_score_ml'] >= 60
        phase1_high = merged['risk_score_phase1'] >= 60
        
        both_high = (ml_high & phase1_high).sum()
        ml_only = (ml_high & ~phase1_high).sum()
        phase1_only = (~ml_high & phase1_high).sum()
        
        return {
            'correlation': correlation,
            'mean_diff': mean_diff,
            'both_high_risk': int(both_high),
            'ml_only': int(ml_only),
            'phase1_only': int(phase1_only),
            'n_comparisons': len(merged)
        }
    
    def evaluate_parameters(
        self,
        training_data: pd.DataFrame,
        contamination_range: List[float] = [0.05, 0.1, 0.15],
        n_estimators_range: List[int] = [50, 100, 200]
    ) -> pd.DataFrame:
        """
        Test different parameter combinations to find optimal settings
        
        Args:
            training_data: Training data DataFrame
            contamination_range: List of contamination values to test
            n_estimators_range: List of n_estimators values to test
        
        Returns:
            DataFrame with results for each parameter combination
        """
        print("="*60)
        print("🔧 PARAMETER OPTIMIZATION")
        print("="*60)
        print()
        print(f"Testing {len(contamination_range)} contamination values × {len(n_estimators_range)} tree counts")
        print(f"Total combinations: {len(contamination_range) * len(n_estimators_range)}")
        print()
        
        results = []
        
        from ml.isolation_forest import IsolationForestDetector
        
        total_combinations = len(contamination_range) * len(n_estimators_range)
        current = 0
        
        for contamination in contamination_range:
            for n_estimators in n_estimators_range:
                current += 1
                print(f"[{current}/{total_combinations}] Testing: contamination={contamination}, trees={n_estimators}...", end=" ")
                
                try:
                    # Train model
                    detector = IsolationForestDetector(
                        contamination=contamination,
                        n_estimators=n_estimators,
                        random_state=42
                    )
                    
                    detector.train(training_data)
                    
                    # Predict on training data
                    predictions = detector.predict(training_data)
                    
                    # Calculate metrics
                    anomaly_rate = predictions['is_anomaly'].mean()
                    avg_risk = predictions['risk_score'].mean()
                    std_risk = predictions['risk_score'].std()
                    
                    results.append({
                        'contamination': contamination,
                        'n_estimators': n_estimators,
                        'anomaly_rate': anomaly_rate,
                        'avg_risk_score': avg_risk,
                        'std_risk_score': std_risk,
                        'n_anomalies': predictions['is_anomaly'].sum()
                    })
                    
                    print(f"✅ Anomaly rate: {anomaly_rate*100:.1f}%")
                    
                except Exception as e:
                    print(f"❌ Error: {str(e)}")
                    continue
        
        results_df = pd.DataFrame(results)
        
        print()
        print("="*60)
        print("📊 OPTIMIZATION RESULTS")
        print("="*60)
        print()
        print(results_df.to_string(index=False))
        print()
        
        # Find best parameters
        if not results_df.empty:
            # Best: anomaly rate closest to contamination, with good spread
            results_df['contamination_diff'] = abs(results_df['anomaly_rate'] - results_df['contamination'])
            best = results_df.loc[results_df['contamination_diff'].idxmin()]
            
            print("Recommended Parameters:")
            print(f"  - Contamination: {best['contamination']}")
            print(f"  - Trees: {int(best['n_estimators'])}")
            print(f"  - Actual anomaly rate: {best['anomaly_rate']*100:.1f}%")
            print()
        
        return results_df
    
    def generate_report(
        self,
        predictions: pd.DataFrame,
        output_file: Optional[str] = None
    ) -> str:
        """
        Generate evaluation report
        
        Args:
            predictions: Model predictions DataFrame
            output_file: Optional file to save report
        
        Returns:
            Report as string
        """
        report_lines = []
        report_lines.append("="*60)
        report_lines.append("MODEL EVALUATION REPORT")
        report_lines.append("="*60)
        report_lines.append("")
        
        # Basic stats
        n_total = len(predictions)
        n_anomalies = predictions['is_anomaly'].sum()
        anomaly_rate = n_anomalies / n_total
        
        report_lines.append(f"Total Samples: {n_total}")
        report_lines.append(f"Anomalies Detected: {n_anomalies} ({anomaly_rate*100:.1f}%)")
        report_lines.append(f"Normal Detected: {n_total - n_anomalies} ({(1-anomaly_rate)*100:.1f}%)")
        report_lines.append("")
        
        # Risk score stats
        risk_stats = predictions['risk_score'].describe()
        report_lines.append("Risk Score Statistics:")
        report_lines.append(f"  Mean: {risk_stats['mean']:.2f}")
        report_lines.append(f"  Median: {risk_stats['50%']:.2f}")
        report_lines.append(f"  Std Dev: {risk_stats['std']:.2f}")
        report_lines.append(f"  Min: {risk_stats['min']:.2f}")
        report_lines.append(f"  Max: {risk_stats['max']:.2f}")
        report_lines.append("")
        
        # Risk distribution
        high_risk = (predictions['risk_score'] >= 60).sum()
        medium_risk = ((predictions['risk_score'] >= 30) & (predictions['risk_score'] < 60)).sum()
        low_risk = (predictions['risk_score'] < 30).sum()
        
        report_lines.append("Risk Distribution:")
        report_lines.append(f"  High Risk (≥60): {high_risk} ({high_risk/n_total*100:.1f}%)")
        report_lines.append(f"  Medium Risk (30-59): {medium_risk} ({medium_risk/n_total*100:.1f}%)")
        report_lines.append(f"  Low Risk (<30): {low_risk} ({low_risk/n_total*100:.1f}%)")
        report_lines.append("")
        
        # Per-stock if available
        if 'ticker' in predictions.columns:
            stock_analysis = self._analyze_by_stock(predictions)
            report_lines.append("Top 10 Riskiest Stocks:")
            report_lines.append("-"*60)
            for idx, row in stock_analysis.head(10).iterrows():
                report_lines.append(f"{row['ticker']:15s} Avg Risk: {row['avg_risk']:5.1f}  Anomalies: {row['n_anomalies']:3d}")
            report_lines.append("")
        
        report_lines.append("="*60)
        
        report = "\n".join(report_lines)
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"✅ Report saved to: {output_file}")
        
        return report


if __name__ == "__main__":
    print("Model Evaluator Module")
    print("="*60)
    print()
    print("This module provides:")
    print("1. Model performance evaluation")
    print("2. Comparison with Phase 1 methods")
    print("3. Parameter optimization")
    print("4. Evaluation reports")
    print()
    print("Usage:")
    print("  from src.ml.model_evaluator import ModelEvaluator")
    print("  evaluator = ModelEvaluator()")
    print("  results = evaluator.evaluate_model(predictions)")

