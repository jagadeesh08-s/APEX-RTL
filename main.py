import argparse
import sys
import os
import json
from parser import RTLFeatureExtractor
from predictor import RTLPredictor
from recommendation_engine import RTLRecommendationEngine

def print_header(title):
    print("=" * 60)
    print(f" {title:^58}")
    print("=" * 60)

def print_section(title):
    print(f"\n--- {title} " + "-" * (55 - len(title)))

def run_analysis(filepath):
    if not os.path.exists(filepath):
        print(f"Error: File '{filepath}' not found.")
        sys.exit(1)

    print_header(f"APEX-RTL: Analyzing {os.path.basename(filepath)}")
    
    # 1. Feature Extraction
    print("Step 1: Parsing Verilog & Extracting Features...")
    extractor = RTLFeatureExtractor(filepath)
    try:
        features = extractor.extract_features()
    except Exception as e:
        print(f"Failed to parse Verilog file: {e}")
        sys.exit(1)
        
    print(f"Successfully extracted {len(features)} structural RTL features.")

    # 2. PPA Prediction
    print("Step 2: Performing Machine Learning PPA Inference...")
    predictor = RTLPredictor()
    
    # Check if models exist
    missing_models = []
    for target in ['area', 'power', 'delay']:
        if not os.path.exists(f"model_{target}_45nm.pkl"):
            missing_models.append(target)
            
    if missing_models:
        print(f"Warning: Missing trained models for: {missing_models}")
        print("Training models first using dataset...")
        try:
            predictor.train_and_evaluate()
        except Exception as e:
            print(f"Failed to train models: {e}")
            sys.exit(1)

    predictions = predictor.predict(features)

    # 3. Design Quality Assessment & Recommendations
    print("Step 3: Evaluating Design Quality Score & Heuristics...")
    engine = RTLRecommendationEngine()
    analysis = engine.analyze_design(features, predictions)

    # 4. Print Report
    print_section("RTL STRUCTURE FEATURES")
    print(f"  Max Bit-width       : {features['bitwidth_max']}-bit")
    print(f"  Inputs / Outputs    : {features['num_inputs']} / {features['num_outputs']}")
    print(f"  Registers (FFs)     : {features['num_registers']}")
    print(f"  Wires Declared      : {features['num_wires']}")
    print(f"  Sequential Blocks   : {features['num_always_sequential']}")
    print(f"  Combinational Blocks: {features['num_always_combinational']}")
    print(f"  Arithmetic Ops      : {features['num_arithmetic_ops']} (including {features['num_multipliers']} multiplier(s))")
    print(f"  Logical Ops         : {features['num_logical_ops']}")
    print(f"  Max If Nesting Depth: {features['max_if_depth']}")
    print(f"  Sequential Ratio    : {features['sequential_ratio']:.2f}")

    print_section("PREDICTED PPA METRICS (PRE-SYNTHESIS)")
    print(f"  Estimated Area      : {predictions['area']:10.2f} um^2")
    print(f"  Estimated Power     : {predictions['power']:10.3f} mW")
    print(f"  Estimated Delay     : {predictions['delay']:10.2f} ns (Max Clock Freq: {1000.0 / predictions['delay']:.1f} MHz)")

    # Render a simple gauge-like bar for DQS
    dqs = analysis['design_quality_score']
    bar_length = 20
    filled = int((dqs / 100.0) * bar_length)
    bar = "#" * filled + "-" * (bar_length - filled)
    
    print_section("DESIGN QUALITY SCORE")
    print(f"  Score: {dqs:.1f}/100.0  |{bar}|")
    if dqs >= 90:
        print("  Status: EXCELLENT (Design follows optimal RTL templates)")
    elif dqs >= 75:
        print("  Status: GOOD (Some room for PPA optimizations)")
    elif dqs >= 50:
        print("  Status: WARNING (Sub-optimal structures may cause timing/area bottlenecks)")
    else:
        print("  Status: CRITICAL (Severe design flaws found; synthesis failure or high timing slack likely)")

    if analysis['deductions']:
        print("\n  Deductions breakdown:")
        for name, points in analysis['deductions']:
            print(f"    - {name}: -{points} pts")

    print_section("EXPLAINABLE PPA KEY DRIVERS")
    print("  These RTL features have the highest statistical impact on predictions:")
    for target in ['area', 'delay']:
        print(f"\n  For {target.upper()}:")
        for contrib in analysis['attributions'][target]:
            impact_str = ""
            if contrib['impact_direction'] == 'high_driver':
                impact_str = "(High Driver - Redesign opportunity)"
            elif contrib['impact_direction'] == 'lowering_factor':
                impact_str = "(Lowering Factor)"
            print(f"    - {contrib['feature']:24}: {contrib['current_value']:4} (vs Avg {contrib['average_value']:4.1f}) {impact_str}")

    print_section("ACTIONABLE REFINEMENT RECOMMENDATIONS")
    recs = analysis['recommendations']
    if not recs:
        print("  No issues found. Your RTL aligns with standard high-performance VLSI design guidelines.")
    else:
        for idx, rec in enumerate(recs, 1):
            print(f"  [{idx}] [{rec['severity']}] {rec['message']}")
            print(f"      Category   : {rec['category']}")
            print(f"      Explanation: {rec['explanation']}")
            print(f"      Remedy     : {rec['remedy']}\n")

    print("=" * 60)

def main():
    parser = argparse.ArgumentParser(description="APEX-RTL: AI-Assisted RTL Code Quality Analyzer")
    parser.add_argument("--analyze", type=str, help="Path to the Verilog file to analyze")
    parser.add_argument("--train", action="store_true", help="Force train the predictive ML models")
    
    args = parser.parse_args()
    
    # If no args are passed, show help
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)
        
    # Check directory
    os.makedirs("sample_designs", exist_ok=True)
    
    if args.train:
        print("Regenerating dataset and retraining models...")
        from dataset_generator import generate_rtl_dataset
        generate_rtl_dataset()
        predictor = RTLPredictor()
        predictor.train_and_evaluate()
        print("Training complete.")
        
    if args.analyze:
        run_analysis(args.analyze)

if __name__ == "__main__":
    main()
