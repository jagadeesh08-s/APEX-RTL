import pickle
import pandas as pd
import numpy as np
import re

class RTLRecommendationEngine:
    def __init__(self, node="45nm"):
        self.node = node
        self.dataset_path = f"rtl_dataset_{node}.csv"
        self.importances_path = f"feature_importances_{node}.pkl"
        self.feature_importances = {}
        self.dataset_stats = {}
        self.load_reference_data()

    def load_reference_data(self):
        # Load dataset stats for comparison
        try:
            df = pd.read_csv(self.dataset_path)
            self.dataset_stats = df.mean().to_dict()
        except Exception:
            # Fallback average stats if dataset is not generated/loaded yet
            self.dataset_stats = {
                'num_inputs': 8.0, 'num_outputs': 6.0, 'num_registers': 30.0,
                'num_wires': 20.0, 'num_always_sequential': 3.0, 'num_always_combinational': 2.0,
                'num_assigns': 5.0, 'num_case_statements': 1.0, 'num_arithmetic_ops': 8.0,
                'num_multipliers': 1.0, 'num_logical_ops': 12.0, 'bitwidth_max': 16.0,
                'max_if_depth': 3.0, 'sequential_ratio': 0.6,
                'cyclomatic_complexity': 6.0, 'fanout_estimate': 2.5, 'ast_depth': 4.0,
                'num_parameters': 2.0, 'num_generate_blocks': 0.5, 'num_memory_blocks': 0.2,
                'num_signed_ops': 0.5, 'fsm_state_count': 2.0, 'combinational_path_len': 5.0,
                'pipeline_depth': 2.0, 'routing_congestion_factor': 1.5
            }

        # Load feature importances
        try:
            with open(self.importances_path, 'rb') as f:
                self.feature_importances = pickle.load(f)
        except Exception:
            # Placeholder feature importances if models aren't trained yet
            self.feature_importances = {
                'area': {'bitwidth_max': 0.40, 'num_registers': 0.25, 'num_multipliers': 0.15, 'num_memory_blocks': 0.10},
                'power': {'num_registers': 0.45, 'bitwidth_max': 0.25, 'num_memory_blocks': 0.15, 'area': 0.10},
                'delay': {'bitwidth_max': 0.30, 'max_if_depth': 0.25, 'combinational_path_len': 0.20, 'num_multipliers': 0.15}
            }

    def analyze_design(self, features, predictions):
        recommendations = []
        deductions = []
        dqs = 100.0  # Design Quality Score starts at 100

        # Heuristic 1: Deeply nested if-else statements (Priority Encoders)
        if features['max_if_depth'] > 4:
            penalty = 15
            dqs -= penalty
            deductions.append(("Nested if-else chain depth", penalty))
            recommendations.append({
                "severity": "WARNING",
                "category": "TIMING & FREQUENCY",
                "message": f"Deeply nested if-else structure detected (depth = {features['max_if_depth']}).",
                "explanation": "Verilog if-else structures synthesize to sequential priority encoders. This adds logic gates in series, increasing critical path delay and limiting maximum clock frequency.",
                "remedy": "Refactor nested if-else structures into 'case' statements where selection signals are mutually exclusive, allowing synthesis tools to build parallel multiplexers."
            })
        elif features.get('cyclomatic_complexity', 0) > 12:
            penalty = 8
            dqs -= penalty
            deductions.append(("High Cyclomatic Complexity", penalty))
            recommendations.append({
                "severity": "INFO",
                "category": "DESIGN COMPLEXITY",
                "message": f"High Cyclomatic Complexity ({features['cyclomatic_complexity']}) detected in procedural blocks.",
                "explanation": "High cyclomatic complexity indicates branching density which translates to complex multiplexer logic and routing congestion.",
                "remedy": "Decompose large conditionals into smaller sub-modules or compute control signals in parallel."
            })

        # Heuristic 2: Unpipelined Multipliers (Long combinational paths)
        if features['num_multipliers'] > 0 and features.get('pipeline_depth', 2) <= 1:
            penalty = 20
            dqs -= penalty
            deductions.append(("Unpipelined multiplier structure", penalty))
            recommendations.append({
                "severity": "CRITICAL",
                "category": "TIMING & CRITICAL PATH",
                "message": f"Design contains {features['num_multipliers']} multiplier(s) inside low-pipelined paths.",
                "explanation": "Multiplication is a hardware-heavy operation. Carrying out multiplication in purely combinational paths increases the gate delay exponentially, creating massive critical paths.",
                "remedy": "Introduce a pipeline stage by latching the multiplier inputs or storing the product in a register clocked by 'posedge clk'."
            })

        # Heuristic 3: Excessive Fanout
        if features.get('fanout_estimate', 0) > 4.5:
            penalty = 10
            dqs -= penalty
            deductions.append(("High Fan-out Estimate", penalty))
            recommendations.append({
                "severity": "WARNING",
                "category": "ROUTING & AREA",
                "message": f"High estimated fan-out load ({features['fanout_estimate']}) detected.",
                "explanation": "Large fan-out loads slow down signal transitions due to high capacitive loading, leading to high routing delays and buffer insertion overhead.",
                "remedy": "Duplicate driving registers or insert buffer trees to distribute fan-out loads across parallel drivers."
            })

        # Heuristic 4: Huge bitwidths for combinational paths
        if features['bitwidth_max'] >= 32 and features['num_always_sequential'] == 0:
            penalty = 15
            dqs -= penalty
            deductions.append(("Large combinational width", penalty))
            recommendations.append({
                "severity": "WARNING",
                "category": "TIMING & DELAY",
                "message": f"A large bit-width ({features['bitwidth_max']}-bit) combinational path is used.",
                "explanation": "32-bit operations (like additions or comparison) have long carry chains. Without registers to segment these carry chains, delay increases linearly or logarithmically, slowing the entire chip.",
                "remedy": "Pipeline the wide arithmetic operations, or verify if the bit-width can be reduced to the minimum necessary size."
            })

        # Heuristic 5: Long combinational path length
        if features.get('combinational_path_len', 0) > 10:
            penalty = 10
            dqs -= penalty
            deductions.append(("Long Combinational Path", penalty))
            recommendations.append({
                "severity": "WARNING",
                "category": "TIMING & FREQUENCY",
                "message": f"Long estimated combinational path length ({features['combinational_path_len']} operators).",
                "explanation": "Multiple logic and arithmetic operations in series without intermediate register boundaries create long propagation delay pathways.",
                "remedy": "Introduce pipeline registers along the datapath to break down logic depth and optimize operating frequency."
            })

        # Heuristic 6: High routing congestion
        if features.get('routing_congestion_factor', 0) > 3.5:
            penalty = 10
            dqs -= penalty
            deductions.append(("High Routing Congestion", penalty))
            recommendations.append({
                "severity": "WARNING",
                "category": "PLACE & ROUTE",
                "message": f"High estimated routing congestion factor ({features['routing_congestion_factor']}) detected.",
                "explanation": "High wiring density relative to bus widths leads to routing overflows and layout congestion, increasing timing detours and post-synthesis gate footprints.",
                "remedy": "Verify register allocations or reduce internal module wiring by decomposing global signals."
            })

        dqs = max(10.0, dqs)

        # Generate Explainable PPA Drivers (SHAP-like attribution)
        attributions = self.generate_attributions(features, predictions)

        return {
            'design_quality_score': dqs,
            'deductions': deductions,
            'recommendations': recommendations,
            'attributions': attributions
        }

    def generate_attributions(self, features, predictions):
        attributions = {}
        for target in ['area', 'power', 'delay']:
            target_imps = self.feature_importances.get(target, {})
            sorted_feats = sorted(target_imps.items(), key=lambda x: x[1], reverse=True)
            
            contributions = []
            for feat, imp in sorted_feats[:4]:
                avg_val = self.dataset_stats.get(feat, 1.0)
                curr_val = features.get(feat, 0.0)
                
                ratio = curr_val / avg_val if avg_val > 0 else 1.0
                impact = "neutral"
                if ratio > 1.25 and imp > 0.04:
                    impact = "high_driver"
                elif ratio < 0.75 and imp > 0.04:
                    impact = "lowering_factor"
                
                contributions.append({
                    'feature': feat,
                    'importance': float(imp),
                    'current_value': curr_val,
                    'average_value': float(avg_val),
                    'impact_direction': impact
                })
            attributions[target] = contributions
        return attributions

    def generate_optimized_rtl(self, code_content: str, recommendations) -> str:
        optimized = code_content
        
        has_deep_if = any(rec['message'].startswith('Deeply nested if-else') for rec in recommendations)
        has_unpipelined_mult = any('multiplier' in rec['message'].lower() for rec in recommendations)

        # 1. Refactor nested if-else chain to case statement
        if has_deep_if:
            selector_match = re.search(r'if\s*\(\s*(\w+)\s*==', optimized)
            if selector_match:
                selector = selector_match.group(1)
                branches = re.findall(r'(?:if|else\s+if)\s*\(\s*' + selector + r'\s*==\s*([^)]+)\s*\)\s*(?:begin)?\s*([\s\S]*?)(?=\s*(?:else|end\s*always|end\b))', optimized)
                
                default_match = re.search(r'else\s+(?:begin\s+)?(?:out\s*<=\s*([^;]+);|([^{}]+))', optimized)
                default_content = ""
                if default_match:
                    default_content = default_match.group(2) or default_match.group(1)
                
                if len(branches) > 2:
                    case_str = f"case ({selector})\n"
                    for val, body in branches:
                        body_clean = body.replace('begin', '').replace('end', '').strip()
                        body_indented = "\n".join("            " + line.strip() for line in body_clean.split('\n') if line.strip())
                        case_str += f"            {val.strip()}: begin\n{body_indented}\n            end\n"
                    
                    if default_content:
                        default_clean = default_content.replace('begin', '').replace('end', '').strip()
                        default_indented = "\n".join("            " + line.strip() for line in default_clean.split('\n') if line.strip())
                        case_str += f"            default: begin\n{default_indented}\n            end\n"
                    
                    case_str += "        endcase"
                    
                    outer_if_pattern = r'if\s*\(\s*' + selector + r'\s*==[\s\S]+?end\s*else\s+begin[\s\S]+?end\s*end'
                    if re.search(outer_if_pattern, optimized):
                        optimized = re.sub(outer_if_pattern, case_str + "\n    ", optimized)
                    else:
                        always_block_match = re.search(r'always\s*@\s*\([\s\S]+?begin([\s\S]+?)end\s*endmodule', optimized)
                        if always_block_match:
                            procedural_content = always_block_match.group(1)
                            optimized = optimized.replace(procedural_content, "\n        " + case_str + "\n    ")

        # 2. Add pipeline register stage for multiplication
        if has_unpipelined_mult and "always @(posedge clk)" in optimized:
            mult_match = re.search(r'(\w+)\s*<=\s*(\w+)\s*\*\s*(\w+);', optimized)
            if mult_match:
                dest, src1, src2 = mult_match.group(1), mult_match.group(2), mult_match.group(3)
                width_match = re.search(r'reg\s+\[\s*(\d+)\s*:\s*0\s*\]\s+' + dest, optimized)
                width_str = f"[{width_match.group(1)}:0]" if width_match else ""
                
                pipeline_decl = f"    // Pipelined multiplier register stages\n    reg {width_str} mult_pipe_reg;\n    always @(posedge clk) begin\n        mult_pipe_reg <= {src1} * {src2};\n    end\n\n"
                
                always_pos = optimized.find("always @")
                if always_pos != -1:
                    optimized = optimized[:always_pos] + pipeline_decl + optimized[always_pos:]
                    
                optimized = optimized.replace(f"{dest} <= {src1} * {src2};", f"{dest} <= mult_pipe_reg;")

        return optimized

if __name__ == "__main__":
    engine = RTLRecommendationEngine()
    print("Test recommendation engine OK")
