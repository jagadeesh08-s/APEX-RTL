import re
import os

class RTLFeatureExtractor:
    def __init__(self, filepath):
        self.filepath = filepath
        self.raw_content = ""
        self.clean_content = ""
        self.features = {}
        self.load_file()

    def load_file(self):
        if os.path.exists(self.filepath):
            with open(self.filepath, 'r') as f:
                self.raw_content = f.read()
            self.clean_content = self.remove_comments(self.raw_content)
        else:
            raise FileNotFoundError(f"File not found: {self.filepath}")

    def remove_comments(self, text):
        # Remove single-line comments
        text = re.sub(r'//.*', '', text)
        # Remove multi-line comments
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
        return text

    def extract_features(self):
        # 1. Input/Output counts
        inputs = re.findall(r'\binput\b', self.clean_content)
        outputs = re.findall(r'\boutput\b', self.clean_content)
        self.features['num_inputs'] = len(inputs)
        self.features['num_outputs'] = len(outputs)

        # 2. Register and Wire declarations
        output_regs = len(re.findall(r'\boutput\s+reg\b', self.clean_content))
        regs = len(re.findall(r'\breg\b', self.clean_content))
        self.features['num_registers'] = max(0, regs - output_regs)
        
        wires = re.findall(r'\bwire\b', self.clean_content)
        self.features['num_wires'] = len(wires)

        # 3. Always blocks
        always_seq = re.findall(r'\balways\s*@\s*\(\s*(posedge|negedge)\b', self.clean_content)
        always_all = re.findall(r'\balways\s*@', self.clean_content)
        self.features['num_always_sequential'] = len(always_seq)
        self.features['num_always_combinational'] = max(0, len(always_all) - len(always_seq))

        # 4. Assign statements
        assigns = re.findall(r'\bassign\b', self.clean_content)
        self.features['num_assigns'] = len(assigns)

        # 5. Case statements
        cases = re.findall(r'\bcase\s*\(', self.clean_content)
        self.features['num_case_statements'] = len(cases)

        # 6. Arithmetic Operators
        add_ops = len(re.findall(r'\+', self.clean_content))
        sub_ops = len(re.findall(r'\-', self.clean_content))
        mul_ops = len(re.findall(r'\*', self.clean_content))
        div_ops = len(re.findall(r'\/', self.clean_content))
        self.features['num_arithmetic_ops'] = add_ops + sub_ops + mul_ops + div_ops
        self.features['num_multipliers'] = mul_ops

        # 7. Logical Operators
        and_ops = len(re.findall(r'\&', self.clean_content))
        or_ops = len(re.findall(r'\|', self.clean_content))
        xor_ops = len(re.findall(r'\^', self.clean_content))
        not_ops = len(re.findall(r'\~', self.clean_content))
        self.features['num_logical_ops'] = and_ops + or_ops + xor_ops + not_ops

        # 8. Maximum Bit-width
        bitwidths = re.findall(r'\[\s*(\d+)\s*:\s*(\d+)\s*\]', self.clean_content)
        max_width = 1
        for high, low in bitwidths:
            width = abs(int(high) - int(low)) + 1
            if width > max_width:
                max_width = width
        self.features['bitwidth_max'] = max_width

        # 9. Maximum If Nesting Depth
        self.features['max_if_depth'] = self.calculate_max_if_depth()

        # 10. Sequential Ratio
        total_blocks = self.features['num_always_sequential'] + self.features['num_always_combinational']
        self.features['sequential_ratio'] = self.features['num_always_sequential'] / total_blocks if total_blocks > 0 else 0.0

        # === NEW FEATURES ===

        # 11. Cyclomatic Complexity
        loops = len(re.findall(r'\bfor\b|\bwhile\b|\bforever\b', self.clean_content))
        self.features['cyclomatic_complexity'] = 1 + self.features['max_if_depth'] + (self.features['num_case_statements'] * 3) + loops

        # 12. Fan-out Estimate
        total_drives = self.features['num_assigns'] + self.features['num_registers'] + self.features['num_inputs']
        total_sinks = max(1, self.features['num_wires'] + self.features['num_outputs'])
        self.features['fanout_estimate'] = float(round((total_drives * 2.5) / total_sinks, 2))

        # 13. AST Depth Estimate
        self.features['ast_depth'] = self.calculate_ast_depth()

        # 14. Parameters Count
        params = re.findall(r'\bparameter\b', self.clean_content)
        self.features['num_parameters'] = len(params)

        # 15. Generate Blocks Count
        generates = re.findall(r'\bgenerate\b', self.clean_content)
        self.features['num_generate_blocks'] = len(generates)

        # 16. Memory Blocks Count
        memories = re.findall(r'\b(reg|wire|logic)\s+(?:\[\s*\d+\s*:\s*\d+\s*\]\s+)?\w+\s*\[\s*\d+\s*:\s*\d+\s*\]\s*\[', self.clean_content)
        if not memories:
            mem_arrays = re.findall(r'(?:reg|wire|logic)\s+(?:\[\s*\d+\s*:\s*\d+\s*\]\s+)?\w+\s*\[\s*\d+\s*:\s*\d+\s*\]\s*;', self.clean_content)
            mem_count = 0
            for array in mem_arrays:
                dims = re.findall(r'\[\s*(\d+)\s*:\s*(\d+)\s*\]', array)
                if len(dims) >= 1:
                    high, low = dims[-1]
                    size = abs(int(high) - int(low)) + 1
                    if size >= 16:
                        mem_count += 1
            self.features['num_memory_blocks'] = mem_count
        else:
            self.features['num_memory_blocks'] = len(memories)

        # 17. Signed Operations
        signed_keywords = re.findall(r'\bsigned\b', self.clean_content)
        self.features['num_signed_ops'] = len(signed_keywords)

        # 18. FSM State Count
        self.features['fsm_state_count'] = self.estimate_fsm_state_count()

        # 19. Combinational Path Length Estimate
        self.features['combinational_path_len'] = self.estimate_combinational_path_len()

        # 20. Pipeline Depth
        self.features['pipeline_depth'] = self.estimate_pipeline_depth()

        # 21. Place & Route (P&R) Routing Congestion Factor
        # Proxy: measures wiring density relative to maximum data bus widths
        self.features['routing_congestion_factor'] = float(round((self.features['num_wires'] * self.features['fanout_estimate']) / max(1, self.features['bitwidth_max']), 2))

        return self.features

    def calculate_max_if_depth(self):
        lines = self.clean_content.split('\n')
        stack = []
        current_if_depth = 0
        max_if_depth = 0
        
        for line in lines:
            line = line.strip()
            begins = len(re.findall(r'\bbegin\b', line))
            ends = len(re.findall(r'\bend\b', line))
            if_matches = len(re.findall(r'\bif\b', line))
            
            for _ in range(begins):
                stack.append(current_if_depth)
            
            if if_matches > 0:
                current_if_depth += if_matches
                if current_if_depth > max_if_depth:
                    max_if_depth = current_if_depth
                    
            for _ in range(ends):
                if stack:
                    current_if_depth = stack.pop()
                else:
                    current_if_depth = 0
                    
        return max_if_depth

    def calculate_ast_depth(self):
        lines = self.clean_content.split('\n')
        depth = 0
        max_depth = 0
        for line in lines:
            line = line.strip()
            if 'begin' in line or 'case' in line:
                depth += 1
                if depth > max_depth:
                    max_depth = depth
            if 'end' in line or 'endcase' in line:
                depth = max(0, depth - 1)
        return max_depth

    def estimate_fsm_state_count(self):
        states = re.findall(r'(?:parameter|localparam)\s+\w+_[A-Z0-9_]+\s*=\s*\d+\b', self.clean_content)
        if len(states) > 0:
            return len(states)
        
        state_vars = re.findall(r'\b(state|curr_state|next_state|r_state)\b', self.clean_content)
        if state_vars:
            case_options = re.findall(r'\b\d+\'[bdh][0-9a-fA-F]+\s*:', self.clean_content)
            if len(case_options) > 0:
                return len(case_options)
            
        return 0

    def estimate_combinational_path_len(self):
        comb_ops = self.features['num_arithmetic_ops'] + self.features['num_logical_ops']
        if self.features['num_always_sequential'] > 0:
            return max(1, int(comb_ops / max(1, self.features['num_always_sequential'])))
        return comb_ops

    def estimate_pipeline_depth(self):
        non_blocking_assigns = re.findall(r'\w+\s*<=\s*\w+', self.clean_content)
        if not non_blocking_assigns:
            return 0
        
        dests = set()
        srcs = set()
        for assign in non_blocking_assigns:
            parts = assign.split('<=')
            if len(parts) == 2:
                dests.add(parts[0].strip())
                srcs.add(parts[1].strip())
                
        pipelines = dests.intersection(srcs)
        return len(pipelines) + (1 if self.features['num_always_sequential'] > 0 else 0)

if __name__ == "__main__":
    import json
    extractor = RTLFeatureExtractor("sample_designs/unoptimized_alu.v")
    print(json.dumps(extractor.extract_features(), indent=2))
