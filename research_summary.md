# APEX-RTL Research Summary: AI-Assisted RTL Code Quality Analysis & Optimization

This document summarizes the research findings, literature survey, and software implementation details for the **APEX-RTL** (**A**I-assisted **P**rediction and **Ex**plainable recommendation for **RTL** optimization) framework. The complete LaTeX source code is available in [paper.tex](file:///C:/Users/sapps/.gemini/antigravity/scratch/apex_rtl_framework/paper.tex).

---

## 1. Executive Summary
- **Objective:** Develop an AI-driven pre-synthesis code analyzer that predicts post-synthesis Power, Performance, and Area (PPA) directly from Verilog RTL code and generates explainable, actionable refactoring suggestions.
- **Significance:** By bypassing synthesis cycles (which take hours/days), APEX-RTL provides feedback in seconds, boosting designer productivity and enabling faster design-space exploration (DSE).
- **Core Novelty:** Unlike previous black-box estimators (e.g., MasterRTL, RTL-Timer) that only output a predictive value, APEX-RTL integrates a **Hybrid Heuristics-ML Engine** that calculates a **Design Quality Score (DQS)** and highlights specific line-level bottlenecks with recommended code modifications.
- **Key Findings:**
  - Gradient Boosting Regressors trained on our 350-sample Verilog benchmark dataset achieved $R^2$ scores of **0.9967** (Area), **0.9887** (Power), and **0.9568** (Delay).
  - Pipelining multipliers and flattening nested priority-encoders (if-else chains) are identified as the strongest predictors for critical path delay reduction.
  - A case study on a 16-bit ALU demonstrated a **7.9% predicted timing delay reduction** upon applying APEX-RTL suggestions.

---

## 2. Literature Survey & Research Gap

| Paper / Framework | Venue / Year | Core Method | Inputs | Primary Metrics | Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MasterRTL** \cite{xie2023master} | ICCAD 2023 | Tree-based / GNNs | Simple Operator Graph (SOG) | Negative Slack, Power | Hard to map predictions to source lines; no suggestions |
| **RTL-Timer** \cite{rtltimer} | arXiv 2403 | Tree models | Preprocessed RTL endpoints | Timing slack | Focuses only on timing; lacks power/area context |
| **GRANNITE** \cite{grannite} | DATE 2021 | GNNs | Logic simulation toggle rates | Power estimation | High simulator dependencies; slow runtime |
| **Net2** \cite{net2} | ICCAD 2022 | Customized GNNs | Post-mapping netlist | Net length, delay | Requires technology mapping step (post-synthesis) |
| **APEX-RTL** (Ours) | 2026 | Hybrid ML-Heuristics | Regex-parsed Verilog features | Area, Power, Delay | Currently relies on static regex features; ignores layout congestion |

### The Identified Research Gap:
*Existing models focus entirely on estimation accuracy, treating the predictor as a black box. Designers are left with a raw number (e.g., "Delay is 12ns") but have no guidance on which coding structures are causing the timing violation or how to refactor them. APEX-RTL bridges this gap by combining model feature importances with rules-based heuristic checkers to deliver localized, explainable recommendations.*

---

## 3. APEX-RTL Architecture
APEX-RTL runs on a 4-stage pipeline:
1. **RTL Parser (`parser.py`):** A lightweight scanner that extracts 14 structural features (number of registers, multipliers, inputs, outputs, nested if depth, sequential ratio, etc.) without requiring a compiler license.
2. **ML Predictor (`predictor.py`):** Ensemble regressor models (Gradient Boosting) that predict Area ($\mu m^2$), Power ($mW$), and Critical Path Delay ($ns$).
3. **Recommendation Engine (`recommendation_engine.py`):** Calculates a normalized Design Quality Score (DQS, 10-100) by penalizing bad designs (e.g. unpipelined multipliers, nested if-else structures) and flags explainable drivers.
4. **Main Interface (`main.py`):** Renders structured console reports presenting PPA predictions, score, driver rankings, and refactoring guidelines.

---

## 4. Experimental Results

### Model Performance Metrics (Test Set Evaluation):
*   **Area ($R^2 = 0.9967$):** Driven by bit-width ($W_{max}$) (78.7%) and multiplier count ($N_{mult}$) (19.9%).
*   **Power ($R^2 = 0.9887$):** Driven by bit-width ($W_{max}$) (83.1%) and multipliers (10.2%).
*   **Delay ($R^2 = 0.9568$):** Driven by multipliers (43.9%), sequential ratio ($R_{seq}$) (30.3%), and bit-width (18.8%).

### ALU Optimization Case Study:
Comparing `unoptimized_alu.v` (heavy nested if-else, combinational multiplier) to `optimized_alu.v` (flat case statement, pipelined multiplier):

- **Nested If Depth:** Reduced from 10 to 1.
- **Predicted Delay:** Reduced from **12.68 ns** to **11.68 ns** (a **7.9% speedup** or ~6.7 MHz Fmax improvement).
- **Design Quality Score (DQS):** Increased from **85.0/100.0** to **100.0/100.0**.

---

## 5. Overleaf Integration Guide
To compile the research paper on Overleaf:
1. Create a blank project in Overleaf.
2. Copy the entire contents of [paper.tex](file:///C:/Users/sapps/.gemini/antigravity/scratch/apex_rtl_framework/paper.tex) and paste them into Overleaf's `main.tex` file.
3. Set the compiler to **pdfLaTeX** in the Overleaf settings menu.
4. Click **Recompile** to render the IEEE-formatted research paper PDF.

---

## 6. How to Run the Prototype locally
Navigate to the directory and run these commands:

```powershell
# 1. Force train/test the machine learning models
python main.py --train

# 2. Run analysis on the unoptimized ALU
python main.py --analyze sample_designs/unoptimized_alu.v

# 3. Run analysis on the optimized ALU
python main.py --analyze sample_designs/optimized_alu.v
```
