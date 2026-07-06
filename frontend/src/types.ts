export interface RTLFeatures {
  num_inputs: number;
  num_outputs: number;
  num_registers: number;
  num_wires: number;
  num_always_sequential: number;
  num_always_combinational: number;
  num_assigns: number;
  num_case_statements: number;
  num_arithmetic_ops: number;
  num_multipliers: number;
  num_logical_ops: number;
  bitwidth_max: number;
  max_if_depth: number;
  sequential_ratio: number;
  // New features
  cyclomatic_complexity: number;
  fanout_estimate: number;
  ast_depth: number;
  num_parameters: number;
  num_generate_blocks: number;
  num_memory_blocks: number;
  num_signed_ops: number;
  fsm_state_count: number;
  combinational_path_len: number;
  pipeline_depth: number;
  routing_congestion_factor: number;
}

export interface PPAPredictions {
  area: number;
  power: number;
  delay: number;
  max_frequency?: number;
  inference_time_ms?: number;
  extraction_time_ms?: number;
}

export interface AttributionItem {
  feature: string;
  importance: number;
  current_value: number;
  average_value: number;
  impact_direction: 'high_driver' | 'lowering_factor' | 'neutral';
}

export interface Recommendation {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  message: string;
  explanation: string;
  remedy: string;
}

export interface AnalysisReport {
  id: string;
  filename: string;
  timestamp: string;
  code: string;
  optimized_code?: string;
  node?: string;
  features: RTLFeatures;
  predictions: PPAPredictions;
  analysis: {
    design_quality_score: number;
    deductions: [string, number][];
    recommendations: Recommendation[];
    attributions: {
      area: AttributionItem[];
      power: AttributionItem[];
      delay: AttributionItem[];
    };
  };
}

export interface ModelStats {
  feature_importances: {
    area: Record<string, number>;
    power: Record<string, number>;
    delay: Record<string, number>;
  };
  dataset_stats: Record<string, number>;
  metrics: Record<string, { algorithm: string; r2_score: number; training_time_s: number }>;
}
