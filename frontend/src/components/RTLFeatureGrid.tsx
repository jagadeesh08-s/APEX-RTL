import type { RTLFeatures } from '../types';
import { Database, Binary, GitFork, Minimize2, Cpu, BarChart2 } from 'lucide-react';

interface RTLFeatureGridProps {
  features: RTLFeatures;
}

export const RTLFeatureGrid: React.FC<RTLFeatureGridProps> = ({ features }) => {
  const categories = [
    {
      title: 'Port & Interconnect',
      icon: Database,
      color: 'text-primary border-primary/20',
      items: [
        { label: 'Input Ports', val: features.num_inputs, desc: 'Module input signals' },
        { label: 'Output Ports', val: features.num_outputs, desc: 'Module output signals' },
        { label: 'Declared Wires', val: features.num_wires, desc: 'Internal nets' },
        { label: 'Parameters', val: features.num_parameters, desc: 'Generics/Constants' },
      ],
    },
    {
      title: 'State & Memory',
      icon: Binary,
      color: 'text-accent border-accent/20',
      items: [
        { label: 'Registers (FFs)', val: features.num_registers, desc: 'Sequential flip-flops' },
        { label: 'Memory Blocks', val: features.num_memory_blocks, desc: '2D arrays / RAM blocks' },
        { label: 'FSM States', val: features.fsm_state_count, desc: 'Estimated state count' },
        { label: 'Pipeline Stages', val: features.pipeline_depth, desc: 'Sequential register levels' },
      ],
    },
    {
      title: 'Control Flow & Logic',
      icon: GitFork,
      color: 'text-secondary border-secondary/20',
      items: [
        { label: 'Sequential Blocks', val: features.num_always_sequential, desc: 'always @(posedge clk)' },
        { label: 'Combinational Blocks', val: features.num_always_combinational, desc: 'always @(*)' },
        { label: 'Case Statements', val: features.num_case_statements, desc: 'case selector blocks' },
        { label: 'Generate Blocks', val: features.num_generate_blocks, desc: 'Structural generates' },
      ],
    },
    {
      title: 'Operators & Complexity',
      icon: Cpu,
      color: 'text-success border-success/20',
      items: [
        { label: 'Arithmetic Ops', val: features.num_arithmetic_ops, desc: '+, -, *, /' },
        { label: 'Multipliers', val: features.num_multipliers, desc: 'Silicon-heavy multipliers' },
        { label: 'Logical Ops', val: features.num_logical_ops, desc: '&, |, ^, ~' },
        { label: 'Signed Operations', val: features.num_signed_ops, desc: 'signed operations' },
      ],
    },
    {
      title: 'Timing & Complexity Metrics',
      icon: Minimize2,
      color: 'text-warning border-warning/20',
      items: [
        { label: 'Max Bit-width', val: `${features.bitwidth_max}-bit`, desc: 'Widest bus width' },
        { label: 'Max If Depth', val: features.max_if_depth, desc: 'Nested conditionals limit' },
        { label: 'Cyclomatic Complexity', val: features.cyclomatic_complexity, desc: 'Logic branching count' },
        { label: 'Sequential Ratio', val: features.sequential_ratio.toFixed(2), desc: 'Pipelining indicator' },
        { label: 'Fan-out Estimate', val: features.fanout_estimate.toFixed(2), desc: 'Logic driving load factor' },
        { label: 'Combinational Path', val: `${features.combinational_path_len} ops`, desc: 'Max combinational length' },
      ],
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 w-full">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <BarChart2 className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-base font-bold text-text">Multidimensional RTL Feature Vectors</h3>
          <p className="text-xs text-muted">Structural synthesis characteristics extracted via compile-free regex tokenization.</p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <Icon className={`w-4 h-4 ${cat.color.split(' ')[0]}`} />
                <span>{cat.title}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-background/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-white/10 transition-colors">
                    <div>
                      <span className="block text-[9px] text-muted font-semibold uppercase truncate">{item.label}</span>
                      <span className="block text-[8px] text-muted/60 mt-0.5 leading-snug">{item.desc}</span>
                    </div>
                    <span className="block text-sm font-extrabold text-text mt-2 font-mono">
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
