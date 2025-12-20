"""
Script to optimize Isolation Forest parameters

Tests different parameter combinations to find optimal settings.

Usage:
    python optimize_parameters.py
"""

import sys
import os
import pandas as pd

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from ml.model_evaluator import ModelEvaluator


def main():
    """Main function to optimize parameters"""
    
    print("="*60)
    print("🔧 PARAMETER OPTIMIZATION")
    print("="*60)
    print()
    
    # Load training data
    data_file = input("Training data file (default: training_data.csv): ").strip()
    if not data_file:
        data_file = "training_data.csv"
    
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        print()
        print("Please run data collection first:")
        print("  python collect_training_data.py")
        return
    
    print(f"Loading training data from {data_file}...")
    try:
        training_data = pd.read_csv(data_file)
        print(f"✅ Loaded {len(training_data)} rows")
        print()
    except Exception as e:
        print(f"❌ Error loading data: {str(e)}")
        return
    
    # Get parameter ranges
    print("Parameter Ranges:")
    print()
    
    contamination_input = input("Contamination values (comma-separated, default: 0.05,0.1,0.15): ").strip()
    if contamination_input:
        contamination_range = [float(x.strip()) for x in contamination_input.split(',')]
    else:
        contamination_range = [0.05, 0.1, 0.15]
    
    trees_input = input("Tree counts (comma-separated, default: 50,100,200): ").strip()
    if trees_input:
        n_estimators_range = [int(x.strip()) for x in trees_input.split(',')]
    else:
        n_estimators_range = [50, 100, 200]
    
    print()
    print(f"Testing {len(contamination_range)} contamination values × {len(n_estimators_range)} tree counts")
    print(f"Total combinations: {len(contamination_range) * len(n_estimators_range)}")
    print()
    
    confirm = input("Proceed with optimization? (y/n) [default: y]: ").strip().lower()
    if confirm and confirm != 'y':
        print("Cancelled.")
        return
    
    print()
    
    # Run optimization
    evaluator = ModelEvaluator()
    results = evaluator.evaluate_parameters(
        training_data,
        contamination_range=contamination_range,
        n_estimators_range=n_estimators_range
    )
    
    # Save results
    print()
    save_file = input("Save results to CSV? (filename or press Enter to skip): ").strip()
    if save_file:
        results.to_csv(save_file, index=False)
        print(f"✅ Results saved to {save_file}")
    
    print()
    print("="*60)
    print("✅ OPTIMIZATION COMPLETE")
    print("="*60)
    print()
    print("Next steps:")
    print("1. Review results to find best parameters")
    print("2. Retrain model with optimal parameters")
    print("3. Evaluate the optimized model")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

