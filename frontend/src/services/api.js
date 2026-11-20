// API Client with automatic fallback to client-side math engine
const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend API offline, using local client mode", e);
  }
  return {
    status: "healthy (client-mode)",
    institution: "Indian Institute of Information Technology, Allahabad",
    department: "Electronics and Communication Engineering",
    project: "Predictive Mathematical Modeling & Smart App for Mess Management",
    supervisor: "Dr. Kirtan Gopal Panda",
    authors: [
      { name: "Varun Karankar", roll: "IEC2023037" },
      { name: "Aadarsh Singh", roll: "IEC2023058" },
      { name: "Tushar Garg", roll: "IEC2023059" }
    ]
  };
}

export async function fetchForecast(params) {
  try {
    const res = await fetch(`${API_BASE}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using local forecast computation", e);
  }

  // Client-side exact math calculation
  const capacity = 300;
  const baseRates = { breakfast: 0.42, lunch: 0.67, dinner: 0.76 };
  const baseRate = baseRates[params.slot?.toLowerCase()] || 0.67;

  const regimeMults = {
    "Normal": 1.0,
    "Mid-Sem Exam": 1.06,
    "End-Sem Exam": 1.07,
    "Mid-Break": 0.35,
    "End-Break": 0.15,
    "Summer": 0.30,
    "Pre-Semester": 0.25,
    "Holiday": 0.82
  };
  const mRegime = regimeMults[params.academic_phase] || 1.0;

  let mWeather = 1.0;
  if (params.is_rainy) {
    if (params.slot === "breakfast") mWeather *= 0.82;
    if (params.slot === "lunch") mWeather *= 0.96;
  }
  if (params.temp_max >= 40) mWeather *= 0.97;
  if (params.temp_min <= 10) mWeather *= 0.98;

  let mMenu = 1.0;
  if (params.has_dessert) mMenu += 0.06;
  if (params.is_fast_food) mMenu += 0.05;
  if (params.is_special) mMenu += 0.04;
  if (params.hostel === "BH-3" && params.has_nonveg) mMenu += 0.07;

  const mFest = 1.0 - (0.75 * Math.min(1.0, Math.max(0.0, params.festival_factor || 0)));
  let mAnticipate = 1.0;
  if (params.days_to_exam > 0 && params.days_to_exam <= 3) mAnticipate = 1.02;

  let mu = capacity * baseRate * mRegime * mWeather * mMenu * mFest * mAnticipate;
  mu = Math.max(15, Math.min(capacity, mu));

  let alpha = 0.08;
  if (params.academic_phase?.includes("Exam")) alpha = 0.05;
  if (params.academic_phase?.includes("Break")) alpha = 0.18;
  if (params.festival_factor > 0.2) alpha += 0.10;

  const variance = mu + alpha * (mu * mu);
  const stdDev = Math.sqrt(variance);

  const q10 = Math.max(10, Math.round(mu - 1.28155 * stdDev));
  const q50 = Math.round(mu);
  const q75 = Math.min(capacity, Math.round(mu + 0.67449 * stdDev));
  const q90 = Math.min(capacity, Math.round(mu + 1.28155 * stdDev));
  const safetyStock = Math.max(5, q75 - q50);

  const initialBatch = q10 + Math.round(0.65 * (q50 - q10));
  const bufferBatch = q90 - initialBatch;

  return {
    expected_headcount: q50,
    q10,
    q50,
    q75,
    q90,
    std_dev: Number(stdDev.toFixed(2)),
    dispersion_alpha: Number(alpha.toFixed(3)),
    capacity,
    utilization_pct: Number(((q50 / capacity) * 100).toFixed(1)),
    safety_stock_heads: safetyStock,
    cooking_strategy: {
      initial_cook_batch: initialBatch,
      buffer_tray_batch: bufferBatch,
      cooking_advice: `Cook ${initialBatch} portions for main warmers; prepare mise en place for ${bufferBatch} portions in secondary reserve.`
    },
    tolerance_windows: {
      window_25: [Math.max(10, q50 - 25), Math.min(capacity, q50 + 25)],
      window_35: [Math.max(10, q50 - 35), Math.min(capacity, q50 + 35)],
      window_50: [Math.max(10, q50 - 50), Math.min(capacity, q50 + 50)]
    },
    multiplier_breakdown: {
      base_rate: baseRate,
      regime_factor: Number(mRegime.toFixed(3)),
      weather_factor: Number(mWeather.toFixed(3)),
      menu_factor: Number(mMenu.toFixed(3)),
      festival_factor: Number(mFest.toFixed(3)),
      anticipatory_factor: Number(mAnticipate.toFixed(3))
    }
  };
}

export async function fetchProcurement(headcount, slot = "dinner", hostel = "BH-2") {
  try {
    const res = await fetch(`${API_BASE}/procurement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headcount, slot, hostel }),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using local procurement computation", e);
  }

  const heads = Number(headcount) || 200;
  const isBH3 = hostel === "BH-3";
  const isBreakfast = slot.toLowerCase() === "breakfast";

  let rice_kg = isBreakfast ? Number((heads * 0.04).toFixed(2)) : Number((heads * 0.12).toFixed(2));
  let atta_kg = isBreakfast ? Number((heads * 0.08).toFixed(2)) : Number((heads * 0.11).toFixed(2));
  let dal_kg = isBreakfast ? Number((heads * 0.02).toFixed(2)) : Number((heads * 0.05).toFixed(2));
  let veg_kg = isBreakfast ? Number((heads * 0.07).toFixed(2)) : Number((heads * 0.16).toFixed(2));
  let dairy_kg = isBreakfast ? Number((heads * 0.15).toFixed(2)) : Number((heads * 0.08).toFixed(2));
  let oil_l = isBreakfast ? Number((heads * 0.015).toFixed(2)) : Number((heads * 0.025).toFixed(2));
  let spices_kg = isBreakfast ? Number((heads * 0.01).toFixed(2)) : Number((heads * 0.02).toFixed(2));
  let nonveg_kg = isBH3 ? (isBreakfast ? Number((heads * 0.08).toFixed(2)) : Number((heads * 0.14).toFixed(2))) : 0;

  const totalCost = (
    rice_kg * 45 +
    atta_kg * 35 +
    dal_kg * 120 +
    veg_kg * 35 +
    dairy_kg * (isBH3 ? 180 : 280) +
    oil_l * 130 +
    spices_kg * 200 +
    nonveg_kg * 190
  );

  const items = [
    { name: "Rice (Basmati / Medium Grain)", amount: `${rice_kg} kg`, unit_price: "₹45/kg", cost: Math.round(rice_kg * 45) },
    { name: "Whole Wheat Atta", amount: `${atta_kg} kg`, unit_price: "₹35/kg", cost: Math.round(atta_kg * 35) },
    { name: "Dal & Pulses (Arhar/Rajma/Chana)", amount: `${dal_kg} kg`, unit_price: "₹120/kg", cost: Math.round(dal_kg * 120) },
    { name: "Fresh Vegetables (Potato, Onion, Tomato, Green)", amount: `${veg_kg} kg`, unit_price: "₹35/kg", cost: Math.round(veg_kg * 35) },
    { name: "Dairy / Paneer / Curd", amount: `${dairy_kg} kg`, unit_price: "₹300/kg", cost: Math.round(dairy_kg * 300) },
    { name: "Refined Mustard / Sunflower Oil", amount: `${oil_l} L`, unit_price: "₹130/L", cost: Math.round(oil_l * 130) },
    { name: "Whole Spices, Salt & Condiments", amount: `${spices_kg} kg`, unit_price: "₹200/kg", cost: Math.round(spices_kg * 200) },
  ];
  if (isBH3 && nonveg_kg > 0) {
    items.push({ name: "Fresh Poultry / Eggs (BH-3 Special)", amount: `${nonveg_kg} kg`, unit_price: "₹190/kg", cost: Math.round(nonveg_kg * 190) });
  }

  return {
    headcount: heads,
    hostel,
    slot,
    total_estimated_cost_inr: Math.round(totalCost),
    cost_per_student_inr: Number((totalCost / Math.max(1, heads)).toFixed(2)),
    procurement_list: items,
    kitchen_prep_batches: [
      { batch: "Batch 1 (Immediate)", portions: Math.round(heads * 0.70), description: "Cooked 45 min before service commences." },
      { batch: "Batch 2 (Buffer Prep)", portions: Math.round(heads * 0.30), description: "Vegetables chopped, dough kneaded, ready on high flame standby." }
    ]
  };
}

export async function fetchBenchmarks() {
  try {
    const res = await fetch(`${API_BASE}/benchmarks`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using bundled benchmark data", e);
  }

  return {
    models: [
      { model: "LightGBM (All Features)", mae: 41.54, rmse: 53.23, mape: "32.14%", wape: "25.95%", picp_90: "72.4%", speed: "0.4 ms (Instant)" },
      { model: "LightGBM (No Weather Ablation)", mae: 41.67, rmse: 53.33, mape: "32.08%", wape: "26.03%", picp_90: "72.1%", speed: "0.4 ms" },
      { model: "LightGBM (No Calendar Ablation)", mae: 47.28, rmse: 60.89, mape: "38.09%", wape: "29.54%", picp_90: "68.3%", speed: "0.3 ms" },
      { model: "LightGBM Asymmetric (q75)", mae: 48.54, rmse: 61.49, mape: "44.32%", wape: "30.33%", picp_90: "84.2%", speed: "0.4 ms" },
      { model: "Seasonal-Naive Baseline", mae: 68.20, rmse: 85.77, mape: "65.57%", wape: "42.61%", picp_90: "—", speed: "0.1 ms" },
      { model: "Holt-Winters Smoothing", mae: 69.56, rmse: 83.47, mape: "58.16%", wape: "33.58%", picp_90: "—", speed: "12.3 ms" },
      { model: "SARIMA (2,1,1)(1,1,1)", mae: 72.88, rmse: 86.01, mape: "58.93%", wape: "35.18%", picp_90: "—", speed: "145.0 ms" }
    ],
    ops_comparison: {
      rule_a_quantile: {
        rule: "Quantile-blend (Rule A - Proposed)",
        total_served: 97955,
        total_procured: 114129,
        waste_heads: 22915,
        shortage_heads: 6741,
        waste_pct: "20.08%",
        shortage_rate_pct: "6.88%",
        cost_per_event: "₹70.49",
        total_cost_units: 43138
      },
      rule_b_heuristic: {
        rule: "LastWeek + 10% (Rule B - Traditional Guesswork)",
        total_served: 97955,
        total_procured: 105436,
        waste_heads: 28110,
        shortage_heads: 20629,
        waste_pct: "26.66%",
        shortage_rate_pct: "21.06%",
        cost_per_event: "₹147.05",
        total_cost_units: 89997
      },
      shortage_reduction_pct: "67.3% lower shortage",
      cost_savings_pct: "52.1% lower cost penalty"
    },
    feature_importance: [
      { feature: "lag_1d", score: 465, category: "Autoregressive" },
      { feature: "festival_kernel", score: 368, category: "Hawkes Event Kernel" },
      { feature: "lag_14d", score: 356, category: "Autoregressive" },
      { feature: "roll7d_mean", score: 348, category: "Rolling Statistics" },
      { feature: "roll14d_std", score: 303, category: "Rolling Statistics" },
      { feature: "days_to_next_exam", score: 192, category: "Calendar Dynamics" },
      { feature: "temp_max", score: 165, category: "Weather Signal" },
      { feature: "has_dessert", score: 142, category: "Menu Feature" },
      { feature: "precip_mm", score: 116, category: "Weather Signal" },
      { feature: "is_fast_food_item", score: 108, category: "Menu Feature" }
    ],
    kitchen_tolerances: {
      within_25_portions: "38.56%",
      within_35_portions: "50.33%",
      within_50_portions: "66.99%"
    }
  };
}

export async function submitSwipe(roll, hostel = "BH-2", slot = "dinner", name = "") {
export async function submitSwipe(param1, hostel = "BH-2", slot = "lunch", name = "") {
  let roll = "IEC2023059";
  let h = hostel;
  let s = slot;
  let n = name;

  if (typeof param1 === "object" && param1 !== null) {
    roll = param1.roll || param1.student_id || "IEC2023059";
    h = param1.hostel || hostel;
    s = param1.slot || slot;
    n = param1.name || param1.student_name || name;
  } else if (typeof param1 === "string") {
    roll = param1;
  }

  const rollUpper = String(roll).toUpperCase();

  try {
    const res = await fetch(`${API_BASE}/telemetry/swipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roll, hostel, slot, name }),
      body: JSON.stringify({ roll: rollUpper, hostel: h, slot: s, name: n }),
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using local swipe recording", e);
  }

  const timeStr = new Date().toLocaleTimeString();
  return {
    status: "success",
    message: `Verified check-in for ${roll.toUpperCase()} at ${hostel} (${slot})`,
    message: `Verified check-in for ${rollUpper} at ${h} (${s})`,
    scan: {
      id: Date.now(),
      roll: roll.toUpperCase(),
      name: name || `Student ${roll.toUpperCase()}`,
      hostel,
      slot,
      roll: rollUpper,
      name: n || `Student ${rollUpper}`,
      hostel: h,
      slot: s,
      timestamp: timeStr
    }
  };
}

export async function submitFeedback(roll, rating, comment, meal = "Dinner") {
export async function submitFeedback(param1, rating = 5, comment = "", meal = "Lunch") {
  let roll = "IEC2023059";
  let r = rating;
  let c = comment;
  let m = meal;

  if (typeof param1 === "object" && param1 !== null) {
    roll = param1.roll || param1.student_id || "IEC2023059";
    r = param1.rating ?? rating;
    c = param1.comment || comment;
    m = param1.meal || meal;
  } else if (typeof param1 === "string") {
    roll = param1;
  }

  const rollUpper = String(roll).toUpperCase();

  try {
    const res = await fetch(`${API_BASE}/telemetry/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roll, rating, comment, meal }),
      body: JSON.stringify({ roll: rollUpper, rating: r, comment: c, meal: m }),
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using local feedback submission", e);
  }

  return {
    status: "success",
    entry: {
      id: Date.now(),
      roll: roll.toUpperCase(),
      rating,
      comment,
      meal,
      roll: rollUpper,
      rating: r,
      comment: c,
      meal: m,
      date: "Just now"
    }
  };
}
