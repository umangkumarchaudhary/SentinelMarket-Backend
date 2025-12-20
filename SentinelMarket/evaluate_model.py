"""
Script to evaluate Isolation Forest model

Usage:
    python evaluate_model.py
    
This will:
1. Load trained model
2. Load test data (or use training data)
3. Evaluate model performance
4. Compare with Phase 1 methods (if available)
5. Generate evaluation report
"""

import sys
import os
import pandas as pd

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.isolation_forest import IsolationForestDetector
from ml.model_evaluator import ModelEvaluator


def main():
    """Main function to evaluate model"""
    
    print("="*60)
    print("📊 MODEL EVALUATION")
    print("="*60)
    print()
    
    # Check if model exists
    model_file = "models/isolation_forest.pkl"
    if not os.path.exists(model_file):
        print(f"❌ Model file not found: {model_file}")
        print()
        print("Please train the model first:")
        print("  python train_isolation_forest.py")
        return
    
    # Load model
    print(f"Loading model from {model_file}...")
    try:
        detector = IsolationForestDetector()
        detector.load_model(model_file)
        print("✅ Model loaded")
        print()
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return
    
    # Load data for evaluation
    data_file = input("Data file for evaluation (default: training_data.csv): ").strip()
    if not data_file:
        data_file = "training_data.csv"
    
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        return
    
    print(f"Loading data from {data_file}...")
    try:
        eval_data = pd.read_csv(data_file)
        print(f"✅ Loaded {len(eval_data)} rows")
        print()
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        return
    
    # Make predictions
    print("Making predictions...")
    try:
        predictions = detector.predict(eval_data)
        print(f"✅ Generated predictions for {len(predictions)} samples")
        print()
    except Exception as e:
        print(f"❌ Prediction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # Evaluate
    print("Evaluating model...")
    evaluator = ModelEvaluator()
    
    # Try to load Phase 1 scores for comparison
    phase1_file = input("Phase 1 scores file (optional, press Enter to skip): ").strip()
    phase1_scores = None
    
    if phase1_file and os.path.exists(phase1_file):
        try:
            phase1_scores = pd.read_csv(phase1_file)
            print(f"✅ Loaded Phase 1 scores for comparison")
        except:
            print("⚠️ Could not load Phase 1 scores, continuing without comparison")
    
    # Run evaluation
    results = evaluator.evaluate_model(predictions, phase1_scores)
    
    # Generate report
    print()
    report_file = input("Save evaluation report? (filename or press Enter to skip): ").strip()
    if report_file:
        evaluator.generate_report(predictions, report_file)
    
    # Save predictions
    print()
    save_pred = input("Save predictions to CSV? (filename or press Enter to skip): ").strip()
    if save_pred:
        predictions.to_csv(save_pred, index=False)
        print(f"✅ Predictions saved to {save_pred}")
    
    print()
    print("="*60)
    print("✅ EVALUATION COMPLETE")
    print("="*60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

