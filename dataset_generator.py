import pandas as pd
import numpy as np
import random

def generate_rtl_dataset(num_samples=1000, filename="rtl_dataset.csv"):
    np.random.seed(42)
    random.seed(42)
    
    data = []
    
    for i in range(num_samples):
        # Choose a design type: 0 = Control (FSM/Decoder), 1 = Datapath (ALU/Filter), 2 = Hybrid
        design_type = random.choice([0, 1, 2])
        
        # Draw features based on design type to ensure realistic correlation
        if design_type == 0:  # Control-dominated
            bitwidth_max = random.choice([1, 2, 4, 8, 16])
            num_inputs = random.randint(2, 12)
            num_outputs = random.randint(2, 15)
            num_registers = random.randint(6, 32)
            num_wires = random.randint(5, 25)
            num_always_sequential = random.randint(1, 3)
            num_always_combinational = random.randint(1, 5)
            num_assigns = random.randint(0, 8)
            num_case_statements = random.randint(1, 5)
            num_arithmetic_ops = random.randint(0, 4)
            num_multipliers = 0
            num_logical_ops = random.randint(6, 30)
            max_if_depth = random.randint(2, 10)
            
            # New features correlation for Control
            cyclomatic_complexity = 1 + max_if_depth + (num_case_statements * 3) + random.randint(0, 2)
            fanout_estimate = float(round((num_assigns + num_registers + num_inputs) * 2.2 / max(1, num_wires + num_outputs), 2))
            ast_depth = max_if_depth + random.randint(1, 3)
            num_parameters = random.randint(1, 8)
            num_generate_blocks = random.randint(0, 1)
            num_memory_blocks = 0
            num_signed_ops = 0
            fsm_state_count = random.randint(3, 12)
            combinational_path_len = random.randint(2, 8)
            pipeline_depth = random.randint(1, 2)
            
        elif design_type == 1:  # Datapath-dominated
            bitwidth_max = random.choice([8, 16, 32, 64])
            num_inputs = random.randint(3, 10)
            num_outputs = random.randint(1, 5)
            num_registers = random.randint(16, 120)
            num_wires = random.randint(10, 60)
            num_always_sequential = random.randint(3, 12)
            num_always_combinational = random.randint(0, 3)
            num_assigns = random.randint(4, 25)
            num_case_statements = random.randint(0, 2)
            num_arithmetic_ops = random.randint(6, 35)
            num_multipliers = random.randint(0, 6)
            num_logical_ops = random.randint(3, 15)
            max_if_depth = random.randint(1, 4)
            
            # New features correlation for Datapath
            cyclomatic_complexity = 1 + max_if_depth + (num_case_statements * 2) + random.randint(0, 1)
            fanout_estimate = float(round((num_assigns + num_registers + num_inputs) * 2.8 / max(1, num_wires + num_outputs), 2))
            ast_depth = max_if_depth + random.randint(2, 4)
            num_parameters = random.randint(0, 4)
            num_generate_blocks = random.randint(0, 3)
            num_memory_blocks = random.randint(0, 2)
            num_signed_ops = random.randint(0, 6)
            fsm_state_count = 0
            combinational_path_len = random.randint(4, 18)
            pipeline_depth = random.randint(2, 8)
            
        else:  # Hybrid (CPU, DSP, etc.)
            bitwidth_max = random.choice([8, 16, 32, 64])
            num_inputs = random.randint(4, 20)
            num_outputs = random.randint(2, 16)
            num_registers = random.randint(20, 180)
            num_wires = random.randint(15, 90)
            num_always_sequential = random.randint(4, 15)
            num_always_combinational = random.randint(1, 8)
            num_assigns = random.randint(5, 35)
            num_case_statements = random.randint(1, 4)
            num_arithmetic_ops = random.randint(5, 25)
            num_multipliers = random.randint(0, 4)
            num_logical_ops = random.randint(8, 40)
            max_if_depth = random.randint(2, 8)
            
            # New features correlation for Hybrid
            cyclomatic_complexity = 1 + max_if_depth + (num_case_statements * 3) + random.randint(0, 3)
            fanout_estimate = float(round((num_assigns + num_registers + num_inputs) * 2.4 / max(1, num_wires + num_outputs), 2))
            ast_depth = max_if_depth + random.randint(2, 6)
            num_parameters = random.randint(1, 6)
            num_generate_blocks = random.randint(0, 4)
            num_memory_blocks = random.randint(0, 4)
            num_signed_ops = random.randint(0, 4)
            fsm_state_count = random.choice([0, 3, 5, 8])
            combinational_path_len = random.randint(3, 14)
            pipeline_depth = random.randint(2, 6)

        # Derived feature: sequential ratio
        total_always = num_always_sequential + num_always_combinational
        sequential_ratio = num_always_sequential / total_always if total_always > 0 else 0.0
        
        # --- PHYSICAL PPA MODEL CALCULATIONS ---
        
        # 1. Area calculation (square micrometers)
        area_base = 60.0
        area_io = 2.2 * (num_inputs + num_outputs) * bitwidth_max
        area_regs = 14.5 * num_registers * bitwidth_max
        area_mults = 60.0 * num_multipliers * (bitwidth_max ** 1.85)
        area_arith = 5.8 * num_arithmetic_ops * bitwidth_max
        area_logic = 1.7 * num_logical_ops * bitwidth_max
        area_muxes = 3.8 * num_case_statements * bitwidth_max
        
        # New features impact on Area:
        # Memory blocks add large SRAM area.
        # FSM state registers and generate blocks add layout.
        area_mem = 450.0 * num_memory_blocks * bitwidth_max
        area_fsm = 12.0 * fsm_state_count * bitwidth_max
        area_generate = 15.0 * num_generate_blocks * bitwidth_max
        
        area = area_base + area_io + area_regs + area_mults + area_arith + area_logic + area_muxes + area_mem + area_fsm + area_generate
        area = area * np.random.normal(1.0, 0.04) # noise
        
        # 2. Power calculation (milliwatts)
        # Static power leakage (area driven) + Dynamic power switching activity
        power_leakage = 0.00018 * area
        power_dyn_regs = 0.0075 * num_registers * bitwidth_max
        power_dyn_logic = 0.0009 * (num_arithmetic_ops + num_logical_ops + num_assigns) * bitwidth_max
        power_dyn_mult = 0.0115 * num_multipliers * (bitwidth_max ** 1.55)
        # Memory activity increases power significantly
        power_dyn_mem = 0.045 * num_memory_blocks * bitwidth_max
        
        power = power_leakage + power_dyn_regs + power_dyn_logic + power_dyn_mult + power_dyn_mem
        power = power * np.random.normal(1.0, 0.05) # noise
        
        # 3. Delay calculation (nanoseconds)
        # Logic gate delay (ripple chains, operator latencies)
        delay_base = 0.75
        delay_bitwidth = 0.038 * bitwidth_max
        
        # Combinational path length increases critical path delay directly.
        # Deep priority encoders (max_if_depth, cyclomatic complexity) add serialization delay.
        delay_logic = 0.28 * combinational_path_len + 0.18 * max_if_depth + 0.04 * cyclomatic_complexity
        
        # Pipelining effect: pipeline depth mitigates timing delays by segmenting paths.
        if pipeline_depth > 1:
            pipelining_mitigation = 1.0 / (pipeline_depth ** 0.5)
        else:
            pipelining_mitigation = 1.0
            
        # Multiplier penalty (long unpipelined DSP block delay)
        if num_multipliers > 0 and pipeline_depth <= 2:
            delay_mult = 2.2 * num_multipliers * (bitwidth_max ** 0.45)
        else:
            delay_mult = 0.15 * num_multipliers
            
        delay = (delay_base + delay_bitwidth + delay_logic + delay_mult) * pipelining_mitigation
        delay = delay * np.random.normal(1.0, 0.03) # noise
        
        # Clamp values to positive boundaries
        area = max(8.0, float(area))
        power = max(0.008, float(power))
        delay = max(0.08, float(delay))
        
        data.append({
            'num_inputs': num_inputs,
            'num_outputs': num_outputs,
            'num_registers': num_registers,
            'num_wires': num_wires,
            'num_always_sequential': num_always_sequential,
            'num_always_combinational': num_always_combinational,
            'num_assigns': num_assigns,
            'num_case_statements': num_case_statements,
            'num_arithmetic_ops': num_arithmetic_ops,
            'num_multipliers': num_multipliers,
            'num_logical_ops': num_logical_ops,
            'bitwidth_max': bitwidth_max,
            'max_if_depth': max_if_depth,
            'sequential_ratio': float(sequential_ratio),
            # New features
            'cyclomatic_complexity': cyclomatic_complexity,
            'fanout_estimate': fanout_estimate,
            'ast_depth': ast_depth,
            'num_parameters': num_parameters,
            'num_generate_blocks': num_generate_blocks,
            'num_memory_blocks': num_memory_blocks,
            'num_signed_ops': num_signed_ops,
            'fsm_state_count': fsm_state_count,
            'combinational_path_len': combinational_path_len,
            'pipeline_depth': pipeline_depth,
            # Target labels
            'area': area,
            'power': power,
            'delay': delay
        })
        
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False)
    print(f"Generated benchmark dataset with {num_samples} samples containing 20 features.")

if __name__ == "__main__":
    generate_rtl_dataset()
