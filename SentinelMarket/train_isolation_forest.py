"""
Script to train Isolation Forest model

Usage:
    python train_isolation_forest.py
    
This will:
1. Load training data (from training_data.csv)
2. Train Isolation Forest model
3. Save trained model
4. Show training statistics
"""

import sys
import os
import pandas as pd

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.isolation_forest import IsolationForestDetector


def main():
    """Main function to train Isolation Forest model"""
    
    print("="*60)
    print("🤖 TRAIN ISOLATION FOREST MODEL")
    print("="*60)
    print()
    
    # Check if training data exists
    training_file = "training_data.csv"
    if not os.path.exists(training_file):
        print(f"❌ Training data file not found: {training_file}")
        print()
        print("Please run data collection first:")
        print("  python collect_training_data.py")
        return
    
    # Load training data
    print(f"Loading training data from {training_file}...")
    try:
        training_data = pd.read_csv(training_file)
        
        # Convert date column to datetime if it exists
        if 'date' in training_data.columns:
            training_data['date'] = pd.to_datetime(training_data['date'], errors='coerce')
        elif 'Date' in training_data.columns:
            training_data['Date'] = pd.to_datetime(training_data['Date'], errors='coerce')
        
        # Remove any rows with invalid dates
        if 'date' in training_data.columns:
            training_data = training_data.dropna(subset=['date'])
        elif 'Date' in training_data.columns:
            training_data = training_data.dropna(subset=['Date'])
        
        print(f"✅ Loaded {len(training_data)} rows")
        print(f"   Stocks: {training_data['ticker'].nunique()}")
        
        if 'date' in training_data.columns:
            print(f"   Date range: {training_data['date'].min()} to {training_data['date'].max()}")
        print()
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Configuration (use defaults for automated training)
    print("Model Configuration (using defaults):")
    contamination = 0.1  # 10% expected anomalies
    n_estimators = 100   # 100 trees
    
    print(f"  - Contamination: {contamination} ({contamination*100}%)")
    print(f"  - Trees: {n_estimators}")
    print()
    
    # Initialize detector
    detector = IsolationForestDetector(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=42
    )
    
    # Train model
    try:
        training_info = detector.train(training_data)
    except Exception as e:
        print(f"❌ Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Save model
    model_file = "models/isolation_forest.pkl"
    print()
    print(f"Saving model to {model_file}...")
    try:
        detector.save_model(model_file)
        print(f"✅ Model saved successfully")
    except Exception as e:
        print(f"❌ Error saving model: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Show feature importance
    print()
    print("Calculating feature importance...")
    try:
        importance = detector.get_feature_importance(top_n=10)
        print()
        print("Top 10 Most Important Features:")
        print("-"*60)
        for idx, row in importance.iterrows():
            print(f"{row['feature']:40s} {row['importance']:.4f}")
    except Exception as e:
        print(f"⚠️ Could not calculate feature importance: {str(e)}")
    
    print()
    print("="*60)
    print("✅ TRAINING COMPLETE")
    print("="*60)
    print()
    print("Next steps:")
    print("1. Test the model on new data")
    print("2. Integrate with risk scorer")
    print("3. Evaluate model performance")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

