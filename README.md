# APEX-RTL: AI-Powered RTL Code Quality Analyzer

> **Pre-Synthesis Design Space Exploration & Explainable PPA Optimization for Digital VLSI Circuits**

**APEX-RTL** stands for **A**I-powered **P**rediction and **Ex**plainable recommendation for **RTL** optimization. It is a compile-free, static analysis and machine learning framework designed to evaluate the physical quality of Register-Transfer Level (RTL) Verilog code before logic synthesis.

---

## 🚀 Key Features

- **Sub-10ms Feedback Loop**: Predicts post-synthesis **Area**, **Power**, and **Critical Path Delay** within **5.7 milliseconds**—achieving a **7,800× speedup** over traditional EDA logic compilers.
- **Dual Technology Node Support**:
  - **NanGate 45nm** Bulk Planar Standard Cell Library
  - **ASAP7 7nm** FinFET Predictive Standard Cell Library
- **25-Dimensional Feature Vector**: Static parsing extracts structural and routing density metrics without needing commercial compiler wrappers.
- **Explainable AI (XAI) Attributions**: Highlights specific high-impact code drivers comparing code against benchmark dataset averages.
- **Design Quality Score (DQS)**: Rates RTL code quality on a 10.0 to 100.0 scale with localized refactoring guidance.
- **Multi-Interface Deployment**: Interactive React/TypeScript Web Dashboard, FastAPI REST API, and terminal CLI tool.

---

## 🏗️ System Architecture & Workflow

```
+------------------+     +-----------------------+     +-----------------------+
|  Verilog Source  | --> |  Static Regex Parser  | --> | 25-Dimensional Vector |
+------------------+     +-----------------------+     +-----------------------+
                                                                   |
                                                                   v
+------------------+     +-----------------------+     +-----------------------+
| PPA Report & DQS | <-- |  Recommendation Engine| <-- | ML Predictor (45/7nm) |
+------------------+     +-----------------------+     +-----------------------+
```

---

## ⚡ Quick Start & Running Commands

### 1. Prerequisites
- **Python**: 3.9+ 
- **Node.js**: 18+ and `npm`

### 2. Dependencies Setup
Install backend Python dependencies:
```bash
pip install fastapi uvicorn pydantic scikit-learn pandas numpy xgboost lightgbm requests
```

Install frontend Node dependencies:
```bash
cd frontend
npm install
cd ..
```

---

### 3. Running the Backend Server (FastAPI)

Start the REST API backend:
```bash
python server.py
```
- The backend will start on **`http://127.0.0.1:8000`**.
- Interactive API documentation will be available at **`http://127.0.0.1:8000/docs`**.

*Troubleshooting (`[Errno 10048]` socket error):* If port `8000` is already in use, kill existing Python server processes:
```powershell
taskkill /f /im python.exe
```

---

### 4. Running the Web Frontend (React + Vite)

In a new terminal window:
```bash
cd frontend
npm run dev
```
- Open your browser at **`http://localhost:5173`**.

---

### 5. Running CLI Analysis (Command Line)

You can analyze Verilog files directly in your terminal without starting the web UI:

- **Analyze an Unoptimized Verilog Design**:
  ```bash
  python main.py --analyze sample_designs/unoptimized_alu.v
  ```
- **Analyze an Optimized Design**:
  ```bash
  python main.py --analyze sample_designs/optimized_alu.v
  ```
- **Force Retrain ML Models**:
  ```bash
  python main.py --train
  ```

---

## 🎓 Viva Defense & Technical Q&A (FAQs)

### Q1: What does the name "APEX-RTL" stand for?
**Answer:** **APEX-RTL** stands for **A**I-powered **P**rediction and **Ex**plainable recommendation for **RTL** optimization. It combines predictive machine learning models with localized rule-based recommendations.

### Q2: What research gap does APEX-RTL address?
**Answer:** Traditional EDA tools require hours of logic synthesis and place-and-route compilation before timing violations or power issues are discovered. Existing ML research tools act as "black boxes"—they predict raw PPA numbers but do not explain *why* the design is bad or *how* to refactor the Verilog code. APEX-RTL solves this by introducing Explainable AI (XAI) attributions and a Design Quality Score (DQS) with step-by-step remedies.

### Q3: Why use tree-based regressors (XGBoost, Gradient Boosting) instead of Deep Neural Networks (GNNs) or LLMs?
**Answer:** Graph Neural Networks (GNNs) and LLMs require full compiler parsing, netlist transformations, or long prompt processing times. Tree-based boosting models process structured tabular feature vectors in sub-milliseconds, achieve extremely high accuracy ($R^2 > 0.98$), prevent overfitting on tabular features, and run easily on standard CPUs without GPU dependencies.

### Q4: How does APEX-RTL extract features without compiling Verilog code?
**Answer:** The static parser (`parser.py`) uses regular expressions and pattern analysis to scan token keywords (`input`, `reg`, `always`, `assign`), count logical/arithmetic operators, compute block nesting depths, and calculate routing proxies in under 5 ms without requiring proprietary synthesizer licenses (like Synopsys Design Compiler or Cadence Genus).

### Q5: Explain the "Routing Congestion Factor" ($CF_{PR}$) proxy.
**Answer:** At sub-10nm nodes, physical wiring delay dominates total gate delay. The proxy is calculated as:
$$CF_{PR} = \frac{N_{wire} \times F_{out}}{\max(1, W_{max})}$$
It measures wiring density relative to maximum bus width. High routing density alerts the ML model to add area and delay penalties for buffer tree insertion and wire detours.

### Q6: What is the physical difference between NanGate 45nm planar and ASAP7 7nm FinFET models?
**Answer:** 
- **Area**: ASAP7 7nm scales down area by $\approx 50\times$ due to FinFET transistor density.
- **Power**: ASAP7 scales down power by $\approx 20\times$ due to lower operating voltages ($0.7\text{V}$ vs $1.1\text{V}$) and lower subthreshold leakage.
- **Delay**: ASAP7 transit delays are significantly faster and reported in picoseconds ($ps$) rather than nanoseconds ($ns$).

### Q7: How does nested "if-else" logic degrade clock frequency compared to "case" statements?
**Answer:** In Verilog, nested `if-else` blocks synthesize to priority encoders, where each condition depends serially on previous conditions. This builds a long carry chain of logic gates. `case` statements imply parallel condition evaluation, allowing synthesis tools to build flat, parallel multiplexer trees with shorter critical paths.

### Q8: Why do unpipelined multipliers cause critical path timing violations?
**Answer:** Multiplication requires extensive combinational add-and-shift carry trees. Performing multiplication in purely combinational paths ($D_{pipe} \le 1$) forces the clock period to accommodate the entire carry propagation. Registering multiplier inputs/outputs breaks the critical path into shorter clock cycles.

### Q9: How is the Design Quality Score (DQS) calculated?
**Answer:** The DQS starts at **100.0** and applies penalty deductions based on hardware infractions:
- **Nested if-else depth ($D_{if} > 4$):** $-15$ points (Priority encoder timing penalty).
- **Unpipelined multiplier ($N_{mult} > 0, D_{pipe} \le 1$):** $-20$ points (Heavy carry delay penalty).
- **High fan-out ($F_{out} > 4.5$):** $-10$ points (Capacitive slew overhead).
- **Wide combinational bus ($W_{max} \ge 32, N_{seq} == 0$):** $-15$ points (Wide carry chain penalty).
- **Long combinational path ($L_{comb} > 10$):** $-10$ points (Gate propagation accumulation).
- **High routing congestion ($CF_{PR} > 3.5$):** $-10$ points (Routing detour overhead).

### Q10: How are memory arrays handled during static parsing?
**Answer:** 2D register arrays (e.g. `reg [15:0] mem [0:255]`) are extracted into the `num_memory_blocks` feature. This alerts the ML predictor to scale up Area and Power estimates to simulate the physical footprint of on-chip SRAM macro blocks.

---

## 📜 License

Distributed under standard academic/research guidelines for AI-assisted VLSI Design Space Exploration.
