# Predictive Mathematical Modeling & Smart App for Mess Management

[![IIIT Allahabad](https://img.shields.io/badge/IIIT-Allahabad-07294D?style=for-the-badge)](https://www.iiita.ac.in)
[![Department](https://img.shields.io/badge/Department-ECE-emerald?style=for-the-badge)](https://ece.iiita.ac.in)
[![License](https://img.shields.io/badge/License-Academic-blue?style=for-the-badge)](#)

> **Course:** ECE Minor Project, 7th Semester  
> **Institution:** Department of Electronics and Communication Engineering, Indian Institute of Information Technology, Allahabad  
> **Supervisor:** Dr. Kirtan Gopal Panda (Assistant Professor, IIIT Allahabad)  
> **Researchers & Authors:**  
> - **Varun Karankar** (Roll No. IEC2023037)  
> - **Aadarsh Singh** (Roll No. IEC2023058)  
> - **Tushar Garg** (Roll No. IEC2023059)  
> **Target Hostels:** BH-2 (Pure Veg, Cap: 300) · BH-3 (Non-Veg, Cap: 300)

---

## 📌 Project Overview

Institutional dining halls experience severe demand non-stationarity driven by calendar shocks (mid-sems, end-sems, semester breaks, festival departures), extreme weather events, and menu pull factors. Cooking based on guesswork leads to severe food waste or sudden meal stock-outs.

This project delivers an end-to-end mathematical modeling and full-stack software system:
1. **Multi-Regime Stochastic Simulator:** Parameterized heteroscedastic Negative Binomial distribution with Hawkes self-exciting festival decay kernels across 642 calendar days (11,718 meal events).
2. **Quantile LightGBM Forecaster:** Pinball loss optimization yielding non-crossing prediction intervals ($q_{10}, q_{50}, q_{90}$) with sub-millisecond inference.
3. **Kitchen Operations Dashboard:** Real-time headcount prep bounds, staged batch cooking advisor ($\pm 25, \pm 35, \pm 50$ tolerance windows), and a dynamic raw material ingredient procurement calculator.
4. **Interactive "What-If" Scenario Engine:** 1-click presets (*Mid-Sem Exam Rush*, *Diwali Mass Exodus*, *Rainy Sunday Brunch*, *BH-3 Non-Veg Night*) with dynamic quantile fan visualization.
5. **Student Portal & Telemetry Turnstile:** Official weekly menu viewer, simulated interactive QR card-swipe scanner with sound/visual confirmation, and dish ratings.
6. **Academic Research Showcase:** Rigorous benchmark comparisons, ablation studies, and high-resolution visual telemetry figures.

---

## 📊 Benchmark Results (612 Unseen Holdout Meal Events)

| Model / Configuration | MAE (Heads) | RMSE (Heads) | MAPE (%) | WAPE (%) | 90% Coverage (PICP) | Latency |
|---|---|---|---|---|---|---|
| **LightGBM (All Features)** | **41.54** | **53.23** | **32.14%** | **25.95%** | **72.4%** | **0.4 ms (Instant)** |
| LightGBM (No Weather Ablation) | 41.67 | 53.33 | 32.08% | 26.03% | 72.1% | 0.4 ms |
| LightGBM (No Calendar Ablation) | 47.28 | 60.89 | 38.09% | 29.54% | 68.3% | 0.3 ms |
| LightGBM Asymmetric ($q_{75}$) | 48.54 | 61.49 | 44.32% | 30.33% | 84.2% | 0.4 ms |
| Seasonal-Naive Baseline | 68.20 | 85.77 | 65.57% | 42.61% | — | 0.1 ms |
| Holt-Winters Exponential Smoothing | 69.56 | 83.47 | 58.16% | 33.58% | — | 12.3 ms |
| SARIMA (2,1,1)(1,1,1) | 72.88 | 86.01 | 58.93% | 35.18% | — | 145.0 ms |

### 🚀 Operational Procurement Impact
- **Shortage Incident Rate:** Reduced from **21.06% down to 6.88%** (a 67.3% reduction).
- **Cost Penalty per Meal:** Cut by **52.1%** (from ₹147.05 to ₹70.49).
- **Food Saved:** Prevents over **5,100 kg** of wasted food annually across both hostels.

---

## 🧮 Mathematical Formulations

### 1. Hawkes Self-Exciting Event Intensity Kernel
$$\lambda(t) = \mu_0 + \sum_{t_i < t} \alpha_i e^{-\beta_i (t - t_i)}$$
Captures the exponential home-going departure surge of students prior to major festivals (Diwali, Holi, Chhath, Eid).

### 2. Heteroscedastic Negative Binomial Count Modeling
$$Y_t \sim \text{NegBin}(\mu_t, \alpha_t), \quad \text{Var}(Y_t) = \mu_t + \alpha_t \mu_t^2$$
Accounts for variance inflation during exam periods and vacation transitions where student behavioral volatility increases.

### 3. Multi-Quantile Pinball Loss Objective
$$\mathcal{L}_\tau(y, \hat{y}) = \max(\tau(y - \hat{y}), (1 - \tau)(\hat{y} - y))$$
Optimizes asymmetric penalties: under-cooking carries higher student welfare penalty than buffer over-cooking.

### 4. Volume-Weighted WAPE Metric
$$\text{WAPE} = \frac{\sum_t |y_t - \hat{y}_t|}{\sum_t y_t}$$
Resolves the zero-denominator breakdown in vacation dining where a minor 10-head error produces a misleading 66% MAPE penalty.

---

## 🛠️ Architecture & Project Structure

```
MessApplication/
├── backend/
│   ├── server.py              # Pure Python stdlib REST API (port 8000)
│   ├── main.py                # FastAPI alternative engine
│   └── test_api.py            # Automated API verification script
├── frontend/
│   ├── index.html             # Web entry point with Inter & JetBrains Mono
│   ├── package.json
│   ├── tailwind.config.js     # IIITA Navy & Sustainability Emerald theme
│   ├── public/
│   │   ├── iiita-logo.svg     # Official IIIT Allahabad vector emblem
│   │   ├── plots/             # 11 generated research analysis figures
│   │   └── MinorProject_Presentation.pptx # Downloadable presentation deck
│   └── src/
│       ├── App.jsx            # Core layout with Dark/Light theme toggle
│       ├── services/api.js    # API client with client-side fallback
│       └── components/
│           ├── Navbar.jsx
│           ├── KitchenOpsView.jsx        # Tab 1: Operations & Procurement
│           ├── WhatIfSimulatorView.jsx   # Tab 2: Scenario ML Simulator
│           ├── StudentPortalView.jsx     # Tab 3: QR Telemetry & Menu
│           └── ResearchShowcaseView.jsx  # Tab 4: Academic Paper & Benchmarks
├── repo_ml/
│   ├── config/assumptions.yaml           # Calibrated domain multipliers
│   ├── data/                             # Synthetic datasets & calendar
│   ├── src/                              # Model training, feature pipelines
│   └── results/                          # Benchmark metrics, sweeps, plots
├── MinorProject_Updated.pptx             # Official project slide deck
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Start the Backend API Server
```bash
python backend/server.py 8000
```
API runs on `http://127.0.0.1:8000`. Test endpoint: `http://127.0.0.1:8000/api/health`.

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 4. Build for Production
```bash
cd frontend
npm run build
```
Creates an optimized static production bundle in `frontend/dist/`.

---

## 🎓 Academic Presentation & Slides

The repository includes the complete 23-slide presentation deck:
- `MinorProject_Updated.pptx`
- Accessible directly from the live web UI via the **"Deck (.pptx)"** download button in the top navigation bar.

---

## 📜 Citations

1. S. Alam Khan and A. Erdoğdu, *"A stacking ensemble model for food demand forecasting: A preventative approach to food waste reduction,"* Cleaner Logistics and Supply Chain, Elsevier, vol. 6, Art. 100225, 2025.
2. Q. Pham et al., *"Learning Fast and Slow for Online Time Series Forecasting (FSNet),"* arXiv:2202.11672, 2022.
3. G. Ke et al., *"LightGBM: A Highly Efficient Gradient Boosting Decision Tree,"* NeurIPS, 2017.
4. R. Koenker and G. Bassett, *"Regression Quantiles,"* Econometrica, vol. 46, no. 1, 1978.
5. A. C. Cameron and P. K. Trivedi, *Regression Analysis of Count Data*, 2nd ed., Cambridge University Press, 2013.
6. A. G. Hawkes, *"Spectra of some self-exciting point processes,"* Biometrika, vol. 58, pp. 83–90, 1971.

---

© 2026 Department of Electronics & Communication Engineering, Indian Institute of Information Technology, Allahabad.
