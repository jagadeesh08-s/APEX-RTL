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
  apiEndpoint?: string;
}

const TEMPLATES: Record<string, { unoptimized: string; optimized: string; filename: string }> = {
  alu: {
    filename: 'alu_32bit.v',
    unoptimized: `module unoptimized_alu (
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
`,
    optimized: `module optimized_alu (
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
`
  },
  priority_encoder: {
    filename: 'priority_encoder.v',
    unoptimized: `module priority_encoder_bad(
    input [7:0] in,
    output reg [2:0] out
);

always @(*) begin
    if(in[7])
        out = 3'b111;
    else if(in[6])
        out = 3'b110;
    else if(in[5])
        out = 3'b101;
    else if(in[4])
        out = 3'b100;
    else if(in[3])
        out = 3'b011;
    else if(in[2])
        out = 3'b010;
    else if(in[1])
        out = 3'b001;
    else if(in[0])
        out = 3'b000;
    else
        out = 3'b000;
end

endmodule
`,
    optimized: `module priority_encoder_good(
    input [7:0] in,
    output reg [2:0] out
);

always @(*) begin
    casez(in)
        8'b1???????: out = 3'b111;
        8'b01??????: out = 3'b110;
        8'b001?????: out = 3'b101;
        8'b0001????: out = 3'b100;
        8'b00001???: out = 3'b011;
        8'b000001??: out = 3'b010;
        8'b0000001?: out = 3'b001;
        8'b00000001: out = 3'b000;
        default:     out = 3'b000;
    endcase
end

endmodule
`
  },
  multiplier: {
    filename: 'multiplier.v',
    unoptimized: `module multiplier_bad(
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] y
);

always @(*) begin
    y = a * b; // Combinational multiplier path without pipeline stage
end

endmodule
`,
    optimized: `module multiplier_good(
    input clk,
    input [15:0] a,
    input [15:0] b,
    output reg [31:0] y
);

reg [31:0] mult_stage;

always @(posedge clk) begin
    mult_stage <= a * b; // Intermediate register pipeline stage
    y <= mult_stage;
end

endmodule
`
  },
  fsm: {
    filename: 'fsm.v',
    unoptimized: `module fsm_bad(
    input clk,
    input rst_n,
    input start,
    input ready,
    output reg [1:0] out
);
    reg [2:0] state;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= 3'd0;
            out <= 2'b00;
        end else begin
            // Nested branching conditionals inside state logic
            if (state == 3'd0) begin
                if (start) begin
                    state <= 3'd1;
                end
            end else if (state == 3'd1) begin
                if (ready) begin
                    state <= 3'd2;
                    out <= 2'b01;
                end else if (!start) begin
                    state <= 3'd0;
                end
            end else if (state == 3'd2) begin
                if (ready) begin
                    state <= 3'd3;
                    out <= 2'b10;
                end
            end else if (state == 3'd3) begin
                state <= 3'd0;
                out <= 2'b11;
            end else begin
                state <= 3'd0;
            end
        end
    end
endmodule
`,
    optimized: `module fsm_good(
    input clk,
    input rst_n,
    input start,
    input ready,
    output reg [1:0] out
);
    localparam STATE_IDLE = 2'b00;
    localparam STATE_RUN  = 2'b01;
    localparam STATE_WAIT = 2'b10;
    localparam STATE_DONE = 2'b11;

    reg [1:0] curr_state, next_state;

    // Sequential state transfer
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            curr_state <= STATE_IDLE;
        end else begin
            curr_state <= next_state;
        end
    end

    // Parallel case state transition logic
    always @(*) begin
        next_state = curr_state;
        out = 2'b00;
        case (curr_state)
            STATE_IDLE: begin
                if (start) next_state = STATE_RUN;
            end
            STATE_RUN: begin
                if (ready) begin
                    next_state = STATE_WAIT;
                    out = 2'b01;
                end else if (!start) begin
                    next_state = STATE_IDLE;
                end
            end
            STATE_WAIT: begin
                if (ready) begin
                    next_state = STATE_DONE;
                    out = 2'b10;
                end
            end
            STATE_DONE: begin
                next_state = STATE_IDLE;
                out = 2'b11;
            end
            default: next_state = STATE_IDLE;
        endcase
    end
endmodule
`
  },
  counter: {
    filename: 'counter.v',
    unoptimized: `module counter_bad(
    input clk,
    input rst_n,
    input up_down,
    input enable,
    output reg [7:0] count
);

always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        count <= 8'd0;
    end else begin
        // Redundant branching and nested ifs inside counter logic
        if (enable) begin
            if (up_down) begin
                if (count == 8'd255) begin
                    count <= 8'd0;
                end else begin
                    count <= count + 8'd1;
                end
            end else begin
                if (count == 8'd0) begin
                    count <= 8'd255;
                end else begin
                    count <= count - 8'd1;
                end
            end
        end
    end
end

endmodule
`,
    optimized: `module counter_good(
    input clk,
    input rst_n,
    input up_down,
    input enable,
    output reg [7:0] count
);

always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        count <= 8'd0;
    end else if (enable) begin
        // Optimized flattened logic
        count <= up_down ? (count + 8'd1) : (count - 8'd1);
    end
end

endmodule
`
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  onAnalysisSuccess,
  onAnalysisStart,
  isAnalyzing,
  onTimelineStepChange,
  apiEndpoint = 'http://localhost:8000'
}) => {
  const [fileContent, setFileContent] = useState<string>(TEMPLATES.alu.unoptimized);
  const [filename, setFilename] = useState<string>('alu_unoptimized.v');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Selector state variables
  const [selectedDesign, setSelectedDesign] = useState<string>('alu');
  const [selectedStyle, setSelectedStyle] = useState<'unoptimized' | 'optimized'>('unoptimized');
  const [activeNode, setActiveNode] = useState<string>('45nm');
  
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
    let interval: any;

    try {
      interval = setInterval(() => {
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
      }, 250);

      // Perform POST request to FastAPI with strictly node parameter
      const formData = new FormData();
      const codeBlob = new Blob([fileContent], { type: 'text/plain' });
      formData.append('file', codeBlob, filename);
      formData.append('node', activeNode);
      
      const response = await axios.post(`${apiEndpoint}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(interval);
      setProgress(100);
      onTimelineStepChange(5); // Recommendation / Optimization
      
      setTimeout(() => {
        onAnalysisSuccess(response.data);
        onTimelineStepChange(6); // Final Report
      }, 350);

    } catch (err: any) {
      console.error(err);
      clearInterval(interval);
      setProgress(0);
      onTimelineStepChange(0);
      onAnalysisSuccess(null);
      setError("Failed to connect to APEX-RTL API server. Please start the backend by running 'python server.py' in your local terminal on port 8000.");
    }
  };

  const handleBenchmarkSelect = (design: string, style: 'unoptimized' | 'optimized') => {
    setError(null);
    setSelectedDesign(design);
    setSelectedStyle(style);
    
    const template = TEMPLATES[design];
    if (template) {
      setFileContent(template[style]);
      const suffix = style === 'unoptimized' ? '_bad.v' : '_good.v';
      setFilename(design + suffix);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48 text-accent animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
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
          
          {/* Controls Panel */}
          <div className="flex flex-wrap items-center gap-4 bg-background/50 p-4 rounded-2xl border border-white/5">
            {/* Design selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider">Select Design</label>
              <select
                value={selectedDesign}
                onChange={(e) => handleBenchmarkSelect(e.target.value, selectedStyle)}
                className="px-3 py-1.5 bg-card border border-white/10 rounded-xl text-xs text-text focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="alu">32-bit ALU</option>
                <option value="priority_encoder">8-bit Priority Encoder</option>
                <option value="multiplier">16-bit Multiplier</option>
                <option value="fsm">Finite State Machine (FSM)</option>
                <option value="counter">Up-Down Counter</option>
              </select>
            </div>

            {/* Style Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider">Style Variant</label>
              <div className="flex bg-card border border-white/10 rounded-xl p-0.5">
                <button
                  onClick={() => handleBenchmarkSelect(selectedDesign, 'unoptimized')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedStyle === 'unoptimized' 
                      ? 'bg-danger/20 text-danger border border-danger/30' 
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Unoptimized
                </button>
                <button
                  onClick={() => handleBenchmarkSelect(selectedDesign, 'optimized')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedStyle === 'optimized' 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Optimized
                </button>
              </div>
            </div>

            {/* Tech Node Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-muted uppercase tracking-wider">Target Node</label>
              <select
                value={activeNode}
                onChange={(e) => setActiveNode(e.target.value)}
                className="px-3 py-1.5 bg-card border border-white/10 rounded-xl text-xs text-text focus:outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="45nm">NanGate 45nm Bulk Planar</option>
                <option value="7nm">ASAP7 7nm FinFET Technology</option>
              </select>
            </div>

            <div className="flex items-end h-full pt-4">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-text transition-all duration-200"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-danger animate-pulse" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Main Workspace (Split Upload & Code preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload & Run Controls */}
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
