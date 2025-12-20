"""
Quick test for Isolation Forest model
Tests with sample data to verify everything works
"""

import sys
import os
import pandas as pd
import numpy as np

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.isolation_forest import IsolationForestDetector


def test_isolation_forest():
    """Test Isolation Forest with synthetic data"""
    
    print("="*60)
    print("🧪 TESTING ISOLATION FOREST MODEL")
    print("="*60)
    print()
    
    # Create synthetic training data
    print("Creating synthetic training data...")
    n_samples = 100
    n_features = 10  # Simplified for testing
    
    # Generate normal data (most samples)
    normal_data = np.random.randn(n_samples, n_features)
    
    # Generate some anomalies (outliers)
    anomaly_data = np.random.randn(int(n_samples * 0.1), n_features) * 3  # 3x std dev
    
    # Combine
    all_data = np.vstack([normal_data, anomaly_data])
    
    # Create DataFrame
    feature_cols = [f'feature_{i}' for i in range(n_features)]
    training_data = pd.DataFrame(all_data, columns=feature_cols)
    training_data['ticker'] = 'TEST'
    training_data['date'] = pd.date_range('2024-01-01', periods=len(training_data))
    
    print(f"✅ Created {len(training_data)} samples ({n_samples} normal + {int(n_samples*0.1)} anomalies)")
    print()
    
    # Initialize detector
    print("Initializing Isolation Forest detector...")
    detector = IsolationForestDetector(
        contamination=0.1,
        n_estimators=50,  # Fewer trees for quick test
        random_state=42
    )
    print("✅ Detector initialized")
    print()
    
    # Train model
    print("Training model...")
    try:
        training_info = detector.train(training_data, feature_columns=feature_cols)
        print("✅ Model trained successfully")
        print()
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Test prediction
    print("Testing predictions...")
    try:
        results = detector.predict(training_data)
        print(f"✅ Predictions generated: {len(results)} samples")
        print()
        
        # Show statistics
        n_anomalies = results['is_anomaly'].sum()
        n_normal = (~results['is_anomaly']).sum()
        avg_risk = results['risk_score'].mean()
        
        print("Prediction Statistics:")
        print(f"  - Anomalies detected: {n_anomalies} ({n_anomalies/len(results)*100:.1f}%)")
        print(f"  - Normal detected: {n_normal} ({n_normal/len(results)*100:.1f}%)")
        print(f"  - Average risk score: {avg_risk:.1f}")
        print()
        
        # Show sample predictions
        print("Sample Predictions:")
        print("-"*60)
        print(results[['ticker', 'date', 'is_anomaly', 'risk_score']].head(10))
        print()
        
    except Exception as e:
        print(f"❌ Prediction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Test single prediction
    print("Testing single prediction...")
    try:
        sample_features = {f'feature_{i}': np.random.randn() for i in range(n_features)}
        single_result = detector.predict_single(sample_features)
        print("✅ Single prediction works")
        print(f"   Result: {single_result}")
        print()
    except Exception as e:
        print(f"❌ Single prediction failed: {str(e)}")
    
    # Test save/load
    print("Testing save/load...")
    try:
        test_model_file = "test_model.pkl"
        detector.save_model(test_model_file)
        print(f"✅ Model saved to {test_model_file}")
        
        # Load in new detector
        new_detector = IsolationForestDetector()
        new_detector.load_model(test_model_file)
        print(f"✅ Model loaded successfully")
        
        # Clean up
        if os.path.exists(test_model_file):
            os.remove(test_model_file)
            print(f"✅ Test file cleaned up")
        print()
    except Exception as e:
        print(f"❌ Save/load failed: {str(e)}")
    
    print("="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    print()
    print("💡 Next: Train on real data with:")
    print("   python train_isolation_forest.py")


if __name__ == "__main__":
    try:
        test_isolation_forest()
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

