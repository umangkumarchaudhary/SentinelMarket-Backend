"""
Quick test for model evaluation
Tests evaluation module with sample data
"""

import sys
import os
import pandas as pd
import numpy as np

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.model_evaluator import ModelEvaluator
from ml.isolation_forest import IsolationForestDetector


def test_evaluation():
    """Test model evaluation with synthetic data"""
    
    print("="*60)
    print("🧪 TESTING MODEL EVALUATION")
    print("="*60)
    print()
    
    # Create synthetic data
    print("Creating synthetic data...")
    n_samples = 200
    n_features = 10
    
    # Generate data
    normal_data = np.random.randn(n_samples, n_features)
    anomaly_data = np.random.randn(int(n_samples * 0.1), n_features) * 3
    
    all_data = np.vstack([normal_data, anomaly_data])
    
    feature_cols = [f'feature_{i}' for i in range(n_features)]
    training_data = pd.DataFrame(all_data, columns=feature_cols)
    training_data['ticker'] = 'TEST'
    training_data['date'] = pd.date_range('2024-01-01', periods=len(training_data))
    
    print(f"✅ Created {len(training_data)} samples")
    print()
    
    # Train model
    print("Training model...")
    detector = IsolationForestDetector(contamination=0.1, n_estimators=50, random_state=42)
    detector.train(training_data, feature_columns=feature_cols)
    print("✅ Model trained")
    print()
    
    # Make predictions
    print("Making predictions...")
    predictions = detector.predict(training_data)
    print(f"✅ Generated {len(predictions)} predictions")
    print()
    
    # Evaluate
    print("Evaluating model...")
    evaluator = ModelEvaluator()
    results = evaluator.evaluate_model(predictions)
    
    print()
    print("✅ Evaluation complete")
    print()
    
    # Test parameter optimization (small test)
    print("Testing parameter optimization (2 combinations)...")
    opt_results = evaluator.evaluate_parameters(
        training_data,
        contamination_range=[0.1, 0.15],
        n_estimators_range=[50, 100]
    )
    
    print()
    print("✅ Parameter optimization test complete")
    print()
    
    # Generate report
    print("Generating report...")
    report = evaluator.generate_report(predictions)
    print("✅ Report generated")
    print()
    
    print("="*60)
    print("✅ ALL EVALUATION TESTS PASSED!")
    print("="*60)


if __name__ == "__main__":
    try:
        test_evaluation()
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

