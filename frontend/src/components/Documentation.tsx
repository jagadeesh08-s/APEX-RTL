import { BookOpen, HardDrive, Cpu, Terminal } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <BookOpen className="w-5 h-5" />
          <h3 className="text-base font-bold text-text">APEX-RTL Reference & Documentation</h3>
        </div>
        <p className="text-xs text-muted">Learn how the parsing engine operates, model coefficients are estimated, and guidelines for optimal RTL code designs.</p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Hardware Guidelines */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text flex items-center gap-2 border-b border-white/5 pb-2 text-accent">
            <Cpu className="w-4 h-4" />
            Optimal RTL Coding Templates
          </h4>
          <ul className="space-y-3 text-muted leading-relaxed">
            <li>
              <strong className="text-text">Avoid Priority Encoders:</strong> Nested <code>if-else</code> structures evaluate sequentially in hardware. For mutual exclusion, prefer <code>case</code> statements which synthesize as parallel multiplexers, reducing critical path delay.
            </li>
            <li>
              <strong className="text-text">Pipelined Arithmetic:</strong> Hardware operations like multiplication (<code>*</code>) and division (<code>/</code>) carry long logic gate sequences. Register their inputs or outputs to separate delay into discrete clock cycles.
            </li>
            <li>
              <strong className="text-text">Minimize Register Widths:</strong> Declaring register variables with wider bit-widths than necessary increases gate footprint and static power leakage.
            </li>
          </ul>
        </div>

        {/* Feature Extraction Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-text flex items-center gap-2 border-b border-white/5 pb-2 text-success">
            <HardDrive className="w-4 h-4" />
            Extracted RTL Features
          </h4>
          <ul className="space-y-3 text-muted leading-relaxed">
            <li>
              <strong className="text-text">Max Bit-width:</strong> Scans declarations for <code>[X:Y]</code> ranges and checks for widest pathways driving large hardware paths.
            </li>
            <li>
              <strong className="text-text">Sequential Ratio:</strong> Ratio of clock-driven sequential blocks (<code>always @(posedge clk)</code>) to total procedural blocks, measuring the design's pipelining level.
            </li>
            <li>
              <strong className="text-text">Arithmetic vs. Logical Ops:</strong> Measures density of silicon footprint drivers (additions, logic blocks) and computes logic density.
            </li>
          </ul>
        </div>

      </div>

      {/* Terminal guidelines */}
      <div className="bg-background/40 border border-white/5 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-text flex items-center gap-2 text-primary">
          <Terminal className="w-4 h-4" />
          Running Backend Pipeline from CLI
        </h4>
        <p className="text-xs text-muted leading-relaxed">
          The core APEX-RTL analyzer can be executed directly from terminal commands on your system. Run these from the workspace directory:
        </p>
        <pre className="bg-background text-text text-[11px] p-3.5 rounded-lg border border-white/10 overflow-x-auto font-mono">
          {`# 1. Force retrain the machine learning regressor models
python main.py --train

# 2. Run PPA predictions and code optimization recommendations on unoptimized design
python main.py --analyze sample_designs/unoptimized_alu.v`}
        </pre>
      </div>

    </div>
  );
};
