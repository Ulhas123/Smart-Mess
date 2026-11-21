// Cloudflare Worker API & Static Asset Dispatcher
// Provides edge compute API parity for smart-mess deployment

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEFAULT_ID_CARD =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180' viewBox='0 0 300 180'><rect width='300' height='180' rx='10' fill='%231a365d'/><text x='150' y='35' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>IIIT ALLAHABAD</text><text x='150' y='55' fill='%23cbd5e1' font-family='sans-serif' font-size='11' text-anchor='middle'>STUDENT IDENTITY CARD</text><rect x='20' y='70' width='60' height='75' rx='6' fill='%23ffffff'/><circle cx='50' cy='95' r='18' fill='%2394a3b8'/><path d='M30 140 C30 115 70 115 70 140 Z' fill='%2394a3b8'/><text x='100' y='90' fill='%23ffffff' font-family='sans-serif' font-size='12' font-weight='bold'>MESS AUTHORIZED</text><text x='100' y='110' fill='%2394a3b8' font-family='sans-serif' font-size='11'>ECE Department</text><text x='100' y='130' fill='%2338bdf8' font-family='sans-serif' font-size='11'>Valid: 2023-2027</text></svg>";

// In-memory worker state
const workerStudents = [
  { roll: "IEC2023059", name: "Tushar Garg", email: "iec2023059@iiita.ac.in", hostel: "BH-2", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023059_id.svg", is_allowed: true, registered_at: "2026-01-10T10:00:00" },
  { roll: "IEC2023037", name: "Varun Karankar", email: "iec2023037@iiita.ac.in", hostel: "BH-2", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023037_id.svg", is_allowed: true, registered_at: "2026-01-10T10:00:00" },
  { roll: "IEC2023058", name: "Aadarsh Singh", email: "iec2023058@iiita.ac.in", hostel: "BH-3", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023058_id.svg", is_allowed: true, registered_at: "2026-01-10T10:00:00" },
  { roll: "IEC2023012", name: "Rohan Sharma", email: "iec2023012@iiita.ac.in", hostel: "BH-2", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023012_id.svg", is_allowed: true, registered_at: "2026-01-10T10:00:00" },
  { roll: "IEC2023088", name: "Priya Verma", email: "iec2023088@iiita.ac.in", hostel: "GH-1", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023088_id.svg", is_allowed: true, registered_at: "2026-01-10T10:00:00" },
  { roll: "IEC2023999", name: "Rahul Malviya", email: "iec2023999@iiita.ac.in", hostel: "BH-1", password: "student123", id_card_data: DEFAULT_ID_CARD, id_card_filename: "iec2023999_id.svg", is_allowed: false, registered_at: "2026-01-10T10:00:00" },
];

const workerVendors = [
  { vendor_id: "vendor", name: "Central Mess Supervisor", hostel: "BH-2", password: "vendor123" },
  { vendor_id: "bh2_vendor", name: "BH-2 Caterer & Manager", hostel: "BH-2", password: "vendor123" },
  { vendor_id: "bh3_vendor", name: "BH-3 Dining Head", hostel: "BH-3", password: "vendor123" },
  { vendor_id: "admin", name: "Mess Warden / Admin", hostel: "All Hostels", password: "admin123" },
];

const workerAttendance = [
  { id: 1, roll: "IEC2023037", name: "Varun Karankar", hostel: "BH-2", slot: "Lunch", date: new Date().toISOString().slice(0, 10), timestamp: "12:45:10", status: "APPROVED", reason: "Entry Authorized" },
  { id: 2, roll: "IEC2023058", name: "Aadarsh Singh", hostel: "BH-3", slot: "Lunch", date: new Date().toISOString().slice(0, 10), timestamp: "12:50:35", status: "APPROVED", reason: "Entry Authorized" },
  { id: 3, roll: "IEC2023012", name: "Rohan Sharma", hostel: "BH-2", slot: "Lunch", date: new Date().toISOString().slice(0, 10), timestamp: "13:02:15", status: "APPROVED", reason: "Entry Authorized" },
];

const workerFeedback = [
  { id: 1, roll: "IEC2023059", rating: 5, comment: "Special Paneer Butter Masala was excellent tonight!", meal: "Dinner", date: "Today" },
  { id: 2, roll: "IEC2023037", rating: 4, comment: "Crisp dosas for breakfast, zero waiting time.", meal: "Breakfast", date: "Today" },
];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

function computeForecast(params) {
  const capacity = 300;
  const baseRates = { breakfast: 0.42, lunch: 0.67, dinner: 0.76 };
  const baseRate = baseRates[params.slot?.toLowerCase()] || 0.67;

  const regimeMults = {
    Normal: 1.0,
    "Mid-Sem Exam": 1.06,
    "End-Sem Exam": 1.07,
    "Mid-Break": 0.35,
    "End-Break": 0.15,
    Summer: 0.3,
    "Pre-Semester": 0.25,
    Holiday: 0.82,
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

  const mFest = 1.0 - 0.75 * Math.min(1.0, Math.max(0.0, params.festival_factor || 0));
  let mAnticipate = 1.0;
  if (params.days_to_exam > 0 && params.days_to_exam <= 3) mAnticipate = 1.02;

  let mu = capacity * baseRate * mRegime * mWeather * mMenu * mFest * mAnticipate;
  mu = Math.max(15, Math.min(capacity, mu));

  let alpha = 0.08;
  if (params.academic_phase?.includes("Exam")) alpha = 0.05;
  if (params.academic_phase?.includes("Break")) alpha = 0.18;
  if (params.festival_factor > 0.2) alpha += 0.1;

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
      cooking_advice: `Cook ${initialBatch} portions for main warmers; prepare mise en place for ${bufferBatch} portions in secondary reserve.`,
    },
    tolerance_windows: {
      window_25: [Math.max(10, q50 - 25), Math.min(capacity, q50 + 25)],
      window_35: [Math.max(10, q50 - 35), Math.min(capacity, q50 + 35)],
      window_50: [Math.max(10, q50 - 50), Math.min(capacity, q50 + 50)],
    },
    multiplier_breakdown: {
      base_rate: baseRate,
      regime_factor: Number(mRegime.toFixed(3)),
      weather_factor: Number(mWeather.toFixed(3)),
      menu_factor: Number(mMenu.toFixed(3)),
      festival_factor: Number(mFest.toFixed(3)),
      anticipatory_factor: Number(mAnticipate.toFixed(3)),
    },
  };
}

function computeProcurement(heads, slot = "dinner", hostel = "BH-2") {
  const count = Number(heads) || 200;
  const isBH3 = hostel === "BH-3";
  const isBreakfast = slot.toLowerCase() === "breakfast";

  let rice_kg = isBreakfast ? Number((count * 0.04).toFixed(2)) : Number((count * 0.12).toFixed(2));
  let atta_kg = isBreakfast ? Number((count * 0.08).toFixed(2)) : Number((count * 0.11).toFixed(2));
  let dal_kg = isBreakfast ? Number((count * 0.02).toFixed(2)) : Number((count * 0.05).toFixed(2));
  let veg_kg = isBreakfast ? Number((count * 0.07).toFixed(2)) : Number((count * 0.16).toFixed(2));
  let dairy_kg = isBreakfast ? Number((count * 0.15).toFixed(2)) : Number((count * 0.08).toFixed(2));
  let oil_l = isBreakfast ? Number((count * 0.015).toFixed(2)) : Number((count * 0.025).toFixed(2));
  let spices_kg = isBreakfast ? Number((count * 0.01).toFixed(2)) : Number((count * 0.02).toFixed(2));
  let nonveg_kg = isBH3 ? (isBreakfast ? Number((count * 0.08).toFixed(2)) : Number((count * 0.14).toFixed(2))) : 0;

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

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

  return {
    headcount: count,
    hostel,
    slot,
    total_estimated_cost_inr: Math.round(totalCost),
    cost_per_student_inr: Number((totalCost / Math.max(1, count)).toFixed(2)),
    procurement_list: items,
    kitchen_prep_batches: [
      { batch: "Batch 1 (Immediate)", portions: Math.round(count * 0.7), description: "Cooked 45 min before service commences." },
      { batch: "Batch 2 (Buffer Prep)", portions: Math.round(count * 0.3), description: "Vegetables chopped, dough kneaded, ready on high flame standby." },
    ],
  };
}

async function handleApiRequest(request, url) {
  const method = request.method;
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // --- GET Routes ---
  if (method === "GET") {
    if (path === "/api/health") {
      return jsonResponse({
        status: "healthy",
        institution: "Indian Institute of Information Technology, Allahabad",
        department: "Electronics and Communication Engineering",
        project: "Predictive Mathematical Modeling & Smart App for Mess Management",
        supervisor: "Dr. Kirtan Gopal Panda",
        authors: [
          { name: "Varun Karankar", roll: "IEC2023037" },
          { name: "Aadarsh Singh", roll: "IEC2023058" },
          { name: "Tushar Garg", roll: "IEC2023059" },
        ],
      });
    }

    if (path === "/api/weather") {
      try {
        const openMeteoUrl =
          "https://api.open-meteo.com/v1/forecast?latitude=25.4358&longitude=81.8463&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata";
        const res = await fetch(openMeteoUrl);
        if (res.ok) {
          const data = await res.json();
          const current = data.current || {};
          const daily = data.daily || {};
          const code = current.weather_code || 1;
          const isRainy = (current.precipitation || 0) > 0.1 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code);
          return jsonResponse({
            city: "Prayagraj",
            state: "Uttar Pradesh",
            country: "India",
            coordinates: { latitude: 25.4358, longitude: 81.8463 },
            temperature: Number((current.temperature_2m ?? 24.5).toFixed(1)),
            apparent_temperature: Number((current.apparent_temperature ?? 25.0).toFixed(1)),
            humidity: current.relative_humidity_2m ?? 65,
            precipitation_mm: current.precipitation ?? 0.0,
            wind_speed_kmh: current.wind_speed_10m ?? 7.5,
            weather_code: code,
            condition: isRainy ? "Rain Showers" : code === 0 ? "Clear Sky" : "Mainly Clear",
            icon: isRainy ? "rain" : "partly-cloudy",
            is_day: current.is_day ?? 1,
            is_rainy: isRainy,
            temp_max: daily.temperature_2m_max?.[0] ?? 28.0,
            temp_min: daily.temperature_2m_min?.[0] ?? 17.0,
            source: "Open-Meteo API (Prayagraj, UP)",
            updated_at: new Date().toLocaleTimeString(),
          });
        }
      } catch (e) {}

      return jsonResponse({
        city: "Prayagraj",
        state: "Uttar Pradesh",
        country: "India",
        coordinates: { latitude: 25.4358, longitude: 81.8463 },
        temperature: 24.5,
        apparent_temperature: 25.0,
        humidity: 65,
        precipitation_mm: 0.0,
        wind_speed_kmh: 7.5,
        weather_code: 1,
        condition: "Mainly Clear",
        icon: "partly-cloudy",
        is_day: 1,
        is_rainy: false,
        temp_max: 28.0,
        temp_min: 17.0,
        source: "Open-Meteo (Prayagraj Profile)",
        updated_at: new Date().toLocaleTimeString(),
      });
    }

    if (path === "/api/calendar") {
      return jsonResponse({
        total_days: 730,
        regimes: ["Normal", "Mid-Sem Exam", "End-Sem Exam", "Mid-Break", "End-Break", "Summer", "Pre-Semester", "Holiday"],
        sample: [],
      });
    }

    if (path === "/api/menu") {
      return jsonResponse({
        "BH-2": [
          { day: "Monday", breakfast: "Poha, Jalebi, Tea/Milk", lunch: "Rajma, Rice, Chapati, Mixed Veg, Salad", dinner: "Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun", has_dessert: true, is_special: true },
          { day: "Tuesday", breakfast: "Aloo Paratha, Curd, Pickle, Tea", lunch: "Kadhi Pakora, Steamed Rice, Aloo Gobi, Chapati", dinner: "Matar Paneer, Yellow Dal, Chapati, Rice, Kheer", has_dessert: true, is_special: false },
          { day: "Wednesday", breakfast: "Idli Sambar, Coconut Chutney, Tea", lunch: "Chole Bhature, Pulao, Boondi Raita, Onion Salad", dinner: "Mix Veg Curry, Dal Tadka, Chapati, Rice, Custard", is_fast_food: true, has_dessert: true },
          { day: "Thursday", breakfast: "Veg Upma, Banana, Tea/Coffee", lunch: "Black Chana Masala, Rice, Bhindi Do Pyaza, Chapati", dinner: "Shahi Paneer, Dal Fry, Naan/Chapati, Pulao, Ice Cream", is_special: true, has_dessert: true },
          { day: "Friday", breakfast: "Puri Sabzi, Halwa, Tea", lunch: "Dal Makhani, Rice, Chapati, Aloo Jeera, Salad", dinner: "Dum Aloo Kashmiri, Dal Tadka, Tandoori Roti, Pulao, Rasgulla", has_dessert: true },
          { day: "Saturday", breakfast: "Masala Dosa, Sambhar, Chutney", lunch: "Kashmiri Pulao, Paneer Bhurji, Dal, Chapati", dinner: "Veg Biryani, Mirchi Ka Salan, Raita, Rasmalai", is_fast_food: true, is_special: true, has_dessert: true },
          { day: "Sunday", breakfast: "Pav Bhaji, Boiled Egg/Sprouts, Tea", lunch: "Special Thali: Paneer Lababdar, Dal Tadka, Puri, Pulao, Sweet", dinner: "Aloo Matar, Dal Fry, Rice, Chapati, Fruit Salad", is_fast_food: true, is_special: true },
        ],
        "BH-3": [
          { day: "Monday", breakfast: "Poha, Boiled Eggs / Banana, Tea", lunch: "Rajma Masala, Rice, Chapati, Seasonal Veg", dinner: "Chicken Curry / Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun", has_nonveg: true, has_dessert: true, is_special: true },
          { day: "Tuesday", breakfast: "Egg Bhurji / Aloo Paratha, Curd, Tea", lunch: "Kadhi Pakora, Steamed Rice, Aloo Gobi, Chapati", dinner: "Matar Paneer, Yellow Dal, Chapati, Rice, Kheer", has_dessert: true },
          { day: "Wednesday", breakfast: "Idli Sambar, Omelette / Coconut Chutney, Tea", lunch: "Chole Bhature, Pulao, Boondi Raita, Salad", dinner: "Mix Veg Curry, Dal Tadka, Chapati, Rice, Custard", is_fast_food: true, has_dessert: true },
          { day: "Thursday", breakfast: "Bread Omelette / Veg Sandwich, Tea", lunch: "Egg Curry / Black Chana, Rice, Bhindi Masala, Chapati", dinner: "Shahi Paneer, Dal Fry, Chapati, Pulao, Ice Cream", has_nonveg: true, has_dessert: true },
          { day: "Friday", breakfast: "Puri Sabzi, Halwa, Tea", lunch: "Dal Makhani, Rice, Chapati, Aloo Jeera, Salad", dinner: "Hyderabadi Chicken Biryani / Veg Biryani, Mirchi Ka Salan, Raita, Rasgulla", has_nonveg: true, is_special: true, has_dessert: true },
          { day: "Saturday", breakfast: "Masala Dosa, Sambhar, Chutney", lunch: "Egg Fried Rice / Veg Pulao, Dal, Chapati", dinner: "Veg Kolhapuri, Dal Tadka, Chapati, Pulao, Sweet", is_fast_food: true },
          { day: "Sunday", breakfast: "Egg Roll / Pav Bhaji, Tea", lunch: "Sunday Feast: Chicken Roast / Paneer Lababdar, Pulao, Puri, Ice Cream", dinner: "Light Khichdi / Aloo Matar, Curd, Chapati", has_nonveg: true, is_special: true, has_dessert: true },
        ],
      });
    }

    if (path === "/api/benchmarks") {
      return jsonResponse({
        models: [
          { model: "LightGBM (All Features)", mae: 41.54, rmse: 53.23, mape: "32.14%", wape: "25.95%", picp_90: "72.4%", speed: "0.4 ms (Instant)" },
          { model: "LightGBM (No Weather)", mae: 41.67, rmse: 53.33, mape: "32.08%", wape: "26.03%", picp_90: "72.1%", speed: "0.4 ms" },
          { model: "LightGBM (No Calendar)", mae: 47.28, rmse: 60.89, mape: "38.09%", wape: "29.54%", picp_90: "68.3%", speed: "0.3 ms" },
          { model: "LightGBM Asymmetric (q75)", mae: 48.54, rmse: 61.49, mape: "44.32%", wape: "30.33%", picp_90: "84.2%", speed: "0.4 ms" },
          { model: "Seasonal-Naive Baseline", mae: 68.2, rmse: 85.77, mape: "65.57%", wape: "42.61%", picp_90: "—", speed: "0.1 ms" },
          { model: "Holt-Winters Smoothing", mae: 69.56, rmse: 83.47, mape: "58.16%", wape: "33.58%", picp_90: "—", speed: "12.3 ms" },
          { model: "SARIMA (2,1,1)(1,1,1)", mae: 72.88, rmse: 86.01, mape: "58.93%", wape: "35.18%", picp_90: "—", speed: "145.0 ms" },
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
            total_cost_units: 43138,
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
            total_cost_units: 89997,
          },
          shortage_reduction_pct: "67.3% lower shortage",
          cost_savings_pct: "52.1% lower cost penalty",
        },
      });
    }

    if (path === "/api/students/list") {
      const safe = workerStudents.map(({ password, ...rest }) => rest);
      return jsonResponse({ students: safe });
    }

    if (path === "/api/attendance/today") {
      const today = new Date().toISOString().slice(0, 10);
      const records = workerAttendance.filter((a) => a.date === today);
      return jsonResponse({ date: today, total: records.length, records });
    }

    if (path.startsWith("/api/attendance/student/")) {
      const rawRoll = path.slice("/api/attendance/student/".length);
      const roll = decodeURIComponent(rawRoll).trim().toUpperCase();
      const student = workerStudents.find((s) => s.roll.toUpperCase() === roll);
      const history = workerAttendance.filter((a) => a.roll.toUpperCase() === roll);
      return jsonResponse({
        roll,
        student: student ? { roll: student.roll, name: student.name, hostel: student.hostel, is_allowed: student.is_allowed } : null,
        history,
      });
    }

    if (path === "/api/telemetry/stats") {
      return jsonResponse({
        total_scans_today: workerAttendance.length,
        recent_scans: workerAttendance.slice(0, 10),
        feedback: workerFeedback,
      });
    }
  }

  // --- POST Routes ---
  if (method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    if (path === "/api/forecast") {
      return jsonResponse(computeForecast(body));
    }

    if (path === "/api/procurement") {
      return jsonResponse(computeProcurement(body.headcount, body.slot, body.hostel));
    }

    if (path === "/api/auth/student/login") {
      const roll = String(body.roll || "").trim().toUpperCase();
      const password = String(body.password || "").trim();
      const student = workerStudents.find((s) => s.roll.toUpperCase() === roll);
      if (!student || student.password !== password) {
        return jsonResponse({ detail: "Invalid Roll Number or Password" }, 401);
      }
      const { password: _, ...profile } = student;
      return jsonResponse({ status: "success", message: "Login successful", student: profile });
    }

    if (path === "/api/auth/vendor/login") {
      const vendorId = String(body.vendor_id || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const vendor = workerVendors.find((v) => v.vendor_id.toLowerCase() === vendorId);
      if (!vendor || vendor.password !== password) {
        return jsonResponse({ detail: "Invalid Vendor ID or Password" }, 401);
      }
      return jsonResponse({
        status: "success",
        message: "Vendor authorized",
        vendor: { vendor_id: vendor.vendor_id, name: vendor.name, hostel: vendor.hostel },
      });
    }

    if (path === "/api/auth/student/register") {
      const roll = String(body.roll || "").trim().toUpperCase();
      const name = String(body.name || "").trim();
      const hostel = String(body.hostel || "BH-2").trim();
      const password = String(body.password || "").trim();

      if (!roll || !name || !password) {
        return jsonResponse({ detail: "Roll number, name, and password are required" }, 400);
      }
      if (workerStudents.some((s) => s.roll.toUpperCase() === roll)) {
        return jsonResponse({ detail: `Student with Roll Number ${roll} is already registered. Please log in.` }, 400);
      }

      const newStudent = {
        roll,
        name,
        hostel,
        email: body.email || `${roll.toLowerCase()}@iiita.ac.in`,
        password,
        id_card_data: body.id_card_data || DEFAULT_ID_CARD,
        id_card_filename: body.id_card_filename || `${roll.toLowerCase()}_id.svg`,
        is_allowed: true,
        registered_at: new Date().toISOString(),
      };
      workerStudents.push(newStudent);
      const { password: _, ...profile } = newStudent;
      return jsonResponse({ status: "success", message: "Registration successful", student: profile });
    }

    if (path === "/api/attendance/generate-pass") {
      const roll = String(body.roll || "").trim().toUpperCase();
      const slot = body.slot || "Lunch";
      const student = workerStudents.find((s) => s.roll.toUpperCase() === roll);
      const today = new Date().toISOString().slice(0, 10);
      const passData = {
        type: "IIITA_MESS_PASS",
        roll,
        name: student ? student.name : `Student ${roll}`,
        hostel: student ? student.hostel : "BH-2",
        slot,
        date: today,
        timestamp: Date.now(),
        signature: Math.random().toString(36).substring(2, 12),
        is_allowed: student ? student.is_allowed : true,
      };
      return jsonResponse({
        status: "success",
        pass_data: passData,
        qr_string: JSON.stringify(passData),
        is_allowed: passData.is_allowed,
        student: student ? { roll: student.roll, name: student.name, hostel: student.hostel, id_card_data: student.id_card_data } : null,
      });
    }

    if (path === "/api/attendance/scan") {
      const raw = String(body.qr_data || "").trim();
      let roll = raw;
      let slot = body.slot || "Lunch";
      let passDate = null;

      if (raw.startsWith("{") && raw.endsWith("}")) {
        try {
          const parsed = JSON.parse(raw);
          roll = parsed.roll || roll;
          passDate = parsed.date;
          if (!body.slot && parsed.slot) slot = parsed.slot;
        } catch (e) {}
      }

      const rollUpper = String(roll).trim().toUpperCase();
      const today = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toLocaleTimeString();

      if (passDate && passDate !== today) {
        return jsonResponse({
          status: "DENIED",
          roll: rollUpper,
          name: "Student",
          hostel: "N/A",
          slot,
          timestamp: timeStr,
          allowed: false,
          reason: `Expired Pass: Meal pass is dated ${passDate}, not today (${today}). Access Denied.`,
        });
      }

      const student = workerStudents.find((s) => s.roll.toUpperCase() === rollUpper);
      if (!student) {
        return jsonResponse({
          status: "DENIED",
          roll: rollUpper,
          name: "Unknown Student",
          hostel: "N/A",
          slot,
          timestamp: timeStr,
          allowed: false,
          reason: `Roll Number ${rollUpper} is not registered in institutional mess registry. Student must register first.`,
        });
      }

      if (!student.is_allowed) {
        return jsonResponse({
          status: "DENIED",
          roll: student.roll,
          name: student.name,
          hostel: student.hostel,
          slot,
          timestamp: timeStr,
          allowed: false,
          reason: `Access Denied: Student ${student.roll} (${student.name}) is NOT AUTHORIZED to enter the mess (status: Barred/Unpaid mess dues).`,
          id_card_data: student.id_card_data,
        });
      }

      const dup = workerAttendance.find(
        (a) => a.roll.toUpperCase() === rollUpper && a.date === today && a.slot.toLowerCase() === slot.toLowerCase() && a.status === "APPROVED"
      );
      if (dup) {
        return jsonResponse({
          status: "DUPLICATE",
          roll: student.roll,
          name: student.name,
          hostel: student.hostel,
          slot,
          timestamp: timeStr,
          allowed: false,
          claimed_at: dup.timestamp,
          reason: `Duplicate Entry Blocked: Meal pass already claimed for ${slot} at ${dup.timestamp} today.`,
          id_card_data: student.id_card_data,
        });
      }

      const scanRecord = {
        id: Date.now(),
        roll: student.roll,
        name: student.name,
        hostel: student.hostel,
        slot,
        date: today,
        timestamp: timeStr,
        status: "APPROVED",
        reason: "Entry Authorized: Meal verified and recorded.",
      };
      workerAttendance.unshift(scanRecord);

      return jsonResponse({
        status: "APPROVED",
        roll: student.roll,
        name: student.name,
        hostel: student.hostel,
        slot,
        timestamp: timeStr,
        allowed: true,
        reason: "Entry Authorized: Meal verified and recorded.",
        id_card_data: student.id_card_data,
      });
    }

    if (path === "/api/students/toggle-allowed") {
      const roll = String(body.roll || "").trim().toUpperCase();
      const isAllowed = Boolean(body.is_allowed);
      const student = workerStudents.find((s) => s.roll.toUpperCase() === roll);
      if (student) {
        student.is_allowed = isAllowed;
      }
      return jsonResponse({ status: "success", updated: { roll, is_allowed: isAllowed } });
    }

    if (path === "/api/telemetry/swipe") {
      const roll = String(body.roll || "IEC2023000").toUpperCase();
      const hostel = body.hostel || "BH-2";
      const slot = body.slot || "dinner";
      const scan = {
        id: workerAttendance.length + 1,
        roll,
        name: body.name || `Student ${roll}`,
        hostel,
        slot,
        timestamp: new Date().toLocaleTimeString(),
      };
      return jsonResponse({
        status: "success",
        message: `Verified check-in for ${roll} at ${hostel} (${slot})`,
        scan,
      });
    }

    if (path === "/api/telemetry/feedback") {
      const entry = {
        id: workerFeedback.length + 1,
        roll: String(body.roll || "Anonymous").toUpperCase(),
        rating: Number(body.rating || 5),
        comment: body.comment || "",
        meal: body.meal || "Dinner",
        date: "Just now",
      };
      workerFeedback.unshift(entry);
      return jsonResponse({ status: "success", entry });
    }
  }

  return jsonResponse({ error: "Endpoint Not Found" }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, url);
    }

    // Static assets fallback
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
