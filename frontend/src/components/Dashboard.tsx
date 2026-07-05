import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Upload, FileCode, Play, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface DashboardProps {
  onAnalysisSuccess: (data: any) => void;
  onAnalysisStart: () => void;
  isAnalyzing: boolean;
  onTimelineStepChange: (step: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onAnalysisSuccess,
  onAnalysisStart,
  isAnalyzing,
  onTimelineStepChange,
}) => {
  const [fileContent, setFileContent] = useState<string>(`// Write or upload your Verilog design here
module alu_16bit (
    input clk,
    input [3:0] op,
    input [15:0] a,
    input [15:0] b,
    output reg [15:0] out
);
    always @(posedge clk) begin
        if (op == 4'b0001) begin
            out <= a + b;
        end else if (op == 4'b0010) begin
            out <= a - b;
        end else if (op == 4'b0011) begin
            out <= a * b; // Combinational multiplier
        end else begin
            out <= 16'd0;
        end
    end
endmodule
`);
  const [filename, setFilename] = useState<string>('design.v');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'v' && fileExtension !== 'sv' && fileExtension !== 'vhd') {
      setError("Unsupported file format. Please upload Verilog (.v, .sv) or VHDL (.vhd) files.");
      return;
    }

    setError(null);
    setFilename(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileContent(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const runAnalysis = async () => {
    onAnalysisStart();
    setError(null);
    setProgress(10);
    onTimelineStepChange(1); // Upload step

    try {
      // Create progress ticks to make user experience feel extremely fluid
      const interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 90) {
            clearInterval(interval);
            return 90;
          }
          if (old === 20) onTimelineStepChange(2); // Feature Extraction
          if (old === 50) onTimelineStepChange(3); // AI Prediction
          if (old === 75) onTimelineStepChange(4); // Quality Evaluation
          return old + 10;
        });
      }, 350);

      // Perform POST request to FastAPI
      const formData = new FormData();
      const codeBlob = new Blob([fileContent], { type: 'text/plain' });
      formData.append('file', codeBlob, filename);
      
      const response = await axios.post('http://localhost:8000/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(interval);
      setProgress(100);
      onTimelineStepChange(5); // Recommendation / Optimization
      
      // Artificial short delay to show 100% completion glow
      setTimeout(() => {
        onAnalysisSuccess(response.data);
        onTimelineStepChange(6); // Final Report
      }, 500);

    } catch (err: any) {
      console.error(err);
      // Fallback to Mock Data if API Server is down
      setError("FastAPI server offline. Running analysis in standalone Mock mode.");
      simulateMockAnalysis();
    }
  };

  const simulateMockAnalysis = () => {
    let mockDQS = 85.0;
    let mockArea = 82828.19;
    let mockPower = 21.882;
    let mockDelay = 12.68;
    let mockRecommendations: any[] = [];
    let mockAttributions: any = { area: [], power: [], delay: [] };

    // Heuristics based on keyword checks in mock code
    const lowerCode = fileContent.toLowerCase();
    const hasMultiplier = lowerCode.includes('*');
    const matchesIf = (lowerCode.match(/\bif\b/g) || []).length;

    if (matchesIf > 6) {
      mockDQS -= 15;
      mockRecommendations.push({
        severity: "WARNING",
        category: "TIMING",
        message: `Deeply nested if-else structure detected (estimated depth = ${matchesIf}).`,
        explanation: "Verilog if-else structures synthesize to sequential priority encoders. This adds logic gates in series, increasing critical path delay and limiting maximum clock frequency.",
        remedy: "Refactor nested if-else structures into 'case' statements where selection signals are mutually exclusive, allowing synthesis tools to build parallel multiplexers."
      });
    }

    if (hasMultiplier && lowerCode.includes('always @') && !lowerCode.includes('posedge clk')) {
      mockDQS -= 20;
      mockRecommendations.push({
        severity: "CRITICAL",
        category: "TIMING & FREQUENCY",
        message: "Design contains arithmetic multipliers with low pipelining.",
        explanation: "Multiplication is a hardware-heavy operation. Carrying out multiplication in purely combinational paths increases the gate delay exponentially, creating massive critical paths.",
        remedy: "Introduce a pipeline stage by latching the multiplier inputs or storing the product in a register clocked by 'posedge clk'."
      });
    }

    if (mockRecommendations.length === 0) {
      mockDQS = 100.0;
      mockDelay = 11.68;
    }

    // Set attributions
    mockAttributions = {
      area: [
        { feature: 'bitwidth_max', importance: 0.78, current_value: 32, average_value: 17.8, impact_direction: 'high_driver' },
        { feature: 'num_multipliers', importance: 0.19, current_value: hasMultiplier ? 2 : 0, average_value: 1.0, impact_direction: hasMultiplier ? 'high_driver' : 'neutral' }
      ],
      power: [
        { feature: 'bitwidth_max', importance: 0.83, current_value: 32, average_value: 17.8, impact_direction: 'high_driver' },
        { feature: 'num_multipliers', importance: 0.10, current_value: hasMultiplier ? 2 : 0, average_value: 1.0, impact_direction: hasMultiplier ? 'high_driver' : 'neutral' }
      ],
      delay: [
        { feature: 'num_multipliers', importance: 0.43, current_value: hasMultiplier ? 2 : 0, average_value: 1.0, impact_direction: hasMultiplier ? 'high_driver' : 'neutral' },
        { feature: 'sequential_ratio', importance: 0.30, current_value: 0.5, average_value: 0.6, impact_direction: 'lowering_factor' }
      ]
    };

    const mockReport = {
      id: "mock-run-" + Math.random().toString(36).substring(7),
      filename: filename,
      timestamp: new Date().toISOString(),
      code: fileContent,
      features: {
        num_inputs: 5,
        num_outputs: 2,
        num_registers: 3,
        num_wires: 0,
        num_always_sequential: 1,
        num_always_combinational: 1,
        num_assigns: 0,
        num_case_statements: 0,
        num_arithmetic_ops: hasMultiplier ? 4 : 2,
        num_multipliers: hasMultiplier ? 2 : 0,
        num_logical_ops: 4,
        bitwidth_max: 32,
        max_if_depth: matchesIf,
        sequential_ratio: 0.5
      },
      predictions: {
        area: mockArea,
        power: mockPower,
        delay: mockDelay,
        max_frequency: 1000.0 / mockDelay
      },
      analysis: {
        design_quality_score: Math.max(10.0, mockDQS),
        deductions: matchesIf > 6 ? [["Nested if-else chain depth", 15]] : [],
        recommendations: mockRecommendations,
        attributions: mockAttributions
      }
    };

    const interval = setInterval(() => {
      setProgress((old) => {
        if (old >= 90) {
          clearInterval(interval);
          return 90;
        }
        if (old === 20) onTimelineStepChange(2);
        if (old === 50) onTimelineStepChange(3);
        if (old === 75) onTimelineStepChange(4);
        return old + 15;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      onTimelineStepChange(5);
      
      setTimeout(() => {
        onAnalysisSuccess(mockReport);
        onTimelineStepChange(6);
      }, 250);
    }, 1000);
  };

  const loadSample = (type: 'unoptimized' | 'optimized') => {
    setError(null);
    if (type === 'unoptimized') {
      setFilename('unoptimized_alu.v');
      setFileContent(`module unoptimized_alu (
    input clk,
    input [3:0] op,
    input [31:0] a,
    input [31:0] b,
    output reg [31:0] out
);
    always @(posedge clk) begin
        if (op == 4'b0000) begin
            out <= a + b;
        end else if (op == 4'b0001) begin
            out <= a - b;
        end else if (op == 4'b0010) begin
            out <= a * b; // Combinational multiplication
        end else if (op == 4'b0011) begin
            out <= a / b;
        end else if (op == 4'b0100) begin
            out <= a & b;
        end else if (op == 4'b0101) begin
            out <= a | b;
        end else if (op == 4'b0110) begin
            out <= a ^ b;
        end else if (op == 4'b0111) begin
            out <= ~a;
        end else begin
            out <= 32'd0;
        end
    end
endmodule
`);
    } else {
      setFilename('optimized_alu.v');
      setFileContent(`module optimized_alu (
    input clk,
    input [3:0] op,
    input [31:0] a,
    input [31:0] b,
    output reg [31:0] out
);
    // Latch product in register to pipeline the multiplication
    reg [31:0] mult_reg;
    always @(posedge clk) begin
        mult_reg <= a * b;
    end

    always @(posedge clk) begin
        case (op)
            4'b0000: out <= a + b;
            4'b0001: out <= a - b;
            4'b0010: out <= mult_reg; // Flat case and pipelined multiplier
            4'b0011: out <= a / b;
            4'b0100: out <= a & b;
            4'b0101: out <= a | b;
            4'b0110: out <= a ^ b;
            4'b0111: out <= ~a;
            default: out <= 32'd0;
        end
    end
endmodule
`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-accent animate-pulse" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/20 rounded-full">
              AI-Powered EDA Tool
            </span>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text mb-3">
            AI-Assisted RTL Code Quality Analyzer
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Evaluate design parameters prior to hardware synthesis. Predict post-synthesis Power, Performance, and Area (PPA) in seconds using machine learning, and refactor bottlenecks with explainable suggestions.
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-text transition-all duration-200"
            >
              Upload RTL File
            </button>
            <button 
              onClick={() => loadSample('unoptimized')} 
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/80 text-text shadow-glow hover:shadow-primary/45 transition-all duration-200"
            >
              Analyze Unoptimized ALU
            </button>
            <button 
              onClick={() => loadSample('optimized')} 
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-text shadow-blueGlow hover:shadow-secondary/45 transition-all duration-200"
            >
              Analyze Optimized ALU
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace (Split Upload & Code preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex-1 min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 relative overflow-hidden ${
              dragActive 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-white/10 hover:border-white/20 bg-card/25'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".v,.sv,.vhd"
              onChange={handleFileChange}
              className="hidden" 
            />
            
            <div className="p-4 rounded-2xl bg-background/60 border border-white/5 mb-4 text-muted hover:text-primary transition-colors">
              <Upload className="w-8 h-8" />
            </div>
            
            <h4 className="text-xs font-bold text-text mb-1">Drag and Drop RTL Code</h4>
            <p className="text-[10px] text-muted mb-4 max-w-[200px]">
              Supports Verilog (.v, .sv) and VHDL (.vhd) source files.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 text-[11px] font-bold rounded-lg bg-surface border border-white/10 hover:border-primary/30 text-text transition-colors"
            >
              Browse Files
            </button>
            
            {filename && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-background/80 border border-white/5 p-2 rounded-xl text-left">
                <FileCode className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-[10px] font-medium text-text truncate">{filename}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-text font-extrabold text-xs shadow-glow hover:shadow-primary/45 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Pipeline ({progress}%)
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run APEX Prediction Pipeline
              </>
            )}
          </button>

          {/* Animated Upload / Analysis Progress Bar */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-card/40 border border-white/5 rounded-2xl p-4 space-y-2 overflow-hidden"
              >
                <div className="flex justify-between items-center text-[10px] font-semibold text-muted">
                  <span>Inference Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent shadow-cyanGlow"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Monaco Code Editor Preview */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[350px]">
          <div className="bg-background/80 border-b border-white/5 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-text uppercase tracking-wider">{filename}</span>
            </div>
            <span className="text-[10px] text-muted bg-card/60 px-2 py-0.5 rounded border border-white/5 uppercase">
              Monaco Editor (Read-Only)
            </span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="verilog"
              language="verilog"
              theme="vs-dark"
              value={fileContent}
              onChange={(value) => value && setFileContent(value)}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'Fira Code, Courier New, monospace',
                lineHeight: 18,
                padding: { top: 10, bottom: 10 },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                cursorBlinking: 'smooth',
                renderWhitespace: 'none',
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
