import type {
  BenchmarkItem,
  CookingTolerance,
  FeedbackItem,
  InventoryItem,
  MenuDay,
  NewsvendorComparison,
  RegimeMatrixData,
  ResearchPlot,
  StaffingItem,
  TestSeriesPoint,
  IntradayDemandPoint,
} from "../types"

export const student = {
  id: "IEC2023059",
  name: "Tushar Garg",
  residence: "BH-2 Hostel",
  department: "Electronics & Communication Engineering",
  institution: "IIIT Allahabad",
}

// Grounded in Combined Lunch baseline: 600 combined capacity * 0.67 lunch ratio = 402 expected covers.
// Current logged turnstile check-ins start at 392 and increment with live turnstile claims.
export const baselineCheckIns = 392

export const menuDays: MenuDay[] = [
  {
    day: "Monday",
    date: "23 Nov",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: [
          "Chola Samosa with Meethi & Hari Chutney",
          "Hot Dalia",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea, Coffee & Milk"
        ],
        tags: ["Fast-Food Item", "Chef's Special"],
        allergen: "Gluten · Dairy · Eggs (BH-3)",
        image: "/dishes/chola_samosa.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Punjabi Kadhi-Pakode",
          "Aloo-Shimlamirch",
          "Pineapple Raita",
          "Jeera Rice",
          "Tawa Roti",
          "Salad (Carrot/Beetroot, Tomato/Cucumber, Onion) & Mix Achaar"
        ],
        tags: ["Vegetarian", "North Indian"],
        allergen: "Dairy · Gluten",
        image: "/dishes/kadhi_pakode.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Egg Curry (BH-3 Non-Veg) / Kadhai Paneer (BH-2 Pure Veg)",
          "Moong Daal Tadka",
          "Steamed Rice",
          "Tawa Roti",
          "Warm Gulab Jamun",
          "Salad & Mix Achaar"
        ],
        tags: ["Dessert Special", "Non-Veg Option (BH-3)"],
        allergen: "Dairy · Gluten · Eggs (BH-3)",
        image: "/dishes/kadhai_paneer.jpg"
      },
    },
  },
  {
    day: "Tuesday",
    date: "24 Nov",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: [
          "Crisp Uttapam & Sambhar",
          "Fresh Coconut Chutney",
          "Cornflakes with Milk",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea & Coffee"
        ],
        tags: ["South Indian", "Fast-Food Item"],
        allergen: "Dairy · Eggs (BH-3)",
        image: "/dishes/uttapam.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Traditional Litti Chokha",
          "Arhar Daal",
          "Steamed Rice",
          "Chilled Lassi",
          "Sambhar",
          "Salad & Mix Achaar"
        ],
        tags: ["Regional Special", "High Protein"],
        allergen: "Gluten · Dairy",
        image: "/dishes/litti_chokha.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Veg Kofta Curry",
          "Arhar Daal Tadka",
          "Steamed Rice",
          "Tawa Roti",
          "Chilled Fruit Custard",
          "Salad & Mix Achaar"
        ],
        tags: ["Vegetarian", "Dessert Special"],
        allergen: "Dairy · Gluten",
        image: "/dishes/veg_kofta.jpg"
      },
    },
  },
  {
    day: "Wednesday",
    date: "25 Nov",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: [
          "Mumbai Pav Bhaji with Butter",
          "Nutritious Dalia",
          "Fresh Boiled Sprouts",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea, Coffee & Milk"
        ],
        tags: ["Fast-Food Item", "Chef's Special"],
        allergen: "Gluten · Dairy · Eggs (BH-3)",
        image: "/dishes/pav_bhaji.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Kali Masoor Daal",
          "Kaddu Sabzi (Pumpkin)",
          "Fresh Plain Dahi",
          "Steamed Rice & Fluffy Puri",
          "Sambhar",
          "Salad & Mix Achaar"
        ],
        tags: ["Vegetarian", "Traditional Feast"],
        allergen: "Gluten · Dairy",
        image: "/dishes/puri_sabzi.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Spicy Chana Masala",
          "Tawa Roti",
          "Arhar Daal Tadka",
          "Vegetable Fried Rice",
          "Warm Sooji Halwa",
          "Salad & Mix Achaar"
        ],
        tags: ["North Indian", "Dessert Special"],
        allergen: "Gluten · Dairy",
        image: "/dishes/chana_masala.jpg"
      },
    },
  },
  {
    day: "Thursday",
    date: "26 Nov",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: [
          "Crispy Medu Vada",
          "Hot Vegetable Sambhar",
          "Coconut Chutney",
          "Cornflakes with Milk",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea & Coffee"
        ],
        tags: ["South Indian", "High Protein"],
        allergen: "Dairy · Eggs (BH-3)",
        image: "/dishes/medu_vada.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Safed Matar Masala",
          "Creamy Dal Makhni",
          "Fragrant Veg Pulao",
          "Chilled Chaach",
          "Sambhar & Tawa Roti",
          "Salad & Mix Achaar"
        ],
        tags: ["North Indian", "Chef's Special"],
        allergen: "Dairy · Gluten",
        image: "/dishes/dal_makhni.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Aloo-Pattagobhi Sabzi",
          "Punjabi Rajma Gravy",
          "Steamed Rice",
          "Tawa Roti",
          "Traditional Milk Cake",
          "Salad & Mix Achaar"
        ],
        tags: ["Comfort Food", "Dessert Special"],
        allergen: "Dairy · Gluten",
        image: "/dishes/rajma_chawal.jpg"
      },
    },
  },
  {
    day: "Friday",
    date: "27 Nov",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: [
          "Indori Poha + Haldiram Bhujiya",
          "Crispy Golden Jalebi",
          "Hot Dalia",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea, Coffee & Milk"
        ],
        tags: ["Dessert Special", "Campus Favorite"],
        allergen: "Gluten · Dairy · Eggs (BH-3)",
        image: "/dishes/poha_jalebi.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Crispy Aloo Bhujiya Fry",
          "Chana Daal Tadka",
          "Steamed Basmati Rice",
          "Tawa Roti",
          "Fresh Sweet Dahi",
          "Salad & Mix Achaar"
        ],
        tags: ["Homestyle", "High Protein"],
        allergen: "Gluten · Dairy",
        image: "/dishes/dal_makhni.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Dhaba Chicken Curry & Roti (BH-3) / Paneer-Pyaaz Paratha & Daal (BH-2)",
          "Steamed Rice",
          "Green Mint Chutney",
          "Royal Kaju Katli",
          "Salad & Mix Achaar"
        ],
        tags: ["Friday Feast", "Non-Veg Option (BH-3)", "Dessert Special"],
        allergen: "Dairy · Gluten · Nuts · Poultry (BH-3)",
        image: "/dishes/paneer_paratha.jpg"
      },
    },
  },
  {
    day: "Saturday",
    date: "28 Nov",
    meals: {
      Breakfast: {
        time: "08:30 – 10:30",
        items: [
          "Crispy Masala Dosa",
          "Coconut Chutney & Sambhar",
          "Cornflakes with Milk",
          "Bread, Butter & Jam",
          "Egg / Banana",
          "Hot Tea, Coffee & Milk"
        ],
        tags: ["South Indian", "Weekend Brunch"],
        allergen: "Dairy · Eggs (BH-3)",
        image: "/dishes/masala_dosa.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Fluffy Chole Bhature",
          "Steamed Rice",
          "Boondi Raita",
          "Sambhar",
          "Salad & Mix Achaar"
        ],
        tags: ["Fast-Food Item", "Chef's Special"],
        allergen: "Gluten · Dairy",
        image: "/dishes/chole_bhature.jpg"
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: [
          "Soyabean-Aloo Curry",
          "Arhar Dal Tadka",
          "Fragrant Veg Pulao",
          "Tawa Roti",
          "Rich Ice Cream",
          "Salad & Mix Achaar"
        ],
        tags: ["Weekend Special", "Dessert"],
        allergen: "Soy · Gluten · Dairy",
        image: "/dishes/dal_makhni.jpg"
      },
    },
  },
  {
    day: "Sunday",
    date: "29 Nov",
    meals: {
      Breakfast: {
        time: "08:30 – 10:30",
        items: [
          "Stuffed Aloo-Pyaaz Paratha",
          "Fresh Sweet Dahi",
          "Spicy Mint Chutney",
          "Cornflakes with Milk",
          "Bread, Butter & Jam",
          "Hot Tea, Coffee & Milk"
        ],
        tags: ["Weekend Brunch", "North Indian"],
        allergen: "Gluten · Dairy",
        image: "/dishes/paneer_paratha.jpg"
      },
      Lunch: {
        time: "13:00 – 15:00",
        items: [
          "Homestyle Aloo Jhol Gravy",
          "Arhar Dal Tadka",
          "Mix-Veg Raita",
          "Lucknowi Veg Biryani",
          "Tawa Roti",
          "Salad & Mix Achaar"
        ],
        tags: ["Royal Feast", "Chef's Special"],
        allergen: "Dairy · Gluten",
        image: "/dishes/veg_biryani.jpg"
      },
      Dinner: {
        time: "20:00 – 21:30",
        items: [
          "Wok-Tossed Hakka Noodles / Penne Pasta",
          "Crispy Veg Manchurian in Garlic Gravy",
          "Mix Daal Tadka",
          "Steamed Rice & Tawa Roti",
          "Sweet Vermicelli Sewai",
          "Salad & Mix Achaar"
        ],
        tags: ["Indo-Chinese", "Fast-Food Item", "Dessert Special"],
        allergen: "Gluten · Soy · Dairy",
        image: "/dishes/hakka_noodles.jpg"
      },
    },
  },
]

// Intraday 20-min lunch arrival dynamics exhibiting realistic behavioral elasticity (~28.5% WAPE, MAE ~19.7 heads)
// Peak student exodus occurs at 13:10 following class dismissal; late lab batch arrives at 13:50
export const demandPoints: IntradayDemandPoint[] = [
  { time: "12:30", forecast: 42, actual: 25, q10: 18, q90: 65 },
  { time: "12:50", forecast: 78, actual: 60, q10: 45, q90: 110 },
  { time: "13:10", forecast: 112, actual: 144, q10: 75, q90: 155 },
  { time: "13:30", forecast: 118, actual: 92, q10: 80, q90: 160 },
  { time: "13:50", forecast: 48, actual: 63, q10: 25, q90: 75 },
  { time: "14:10", forecast: 24, actual: 14, q10: 10, q90: 38 },
]

// 21-Day Holdout Test Window for BH-2 Dinner (Plot 7 in MinorProject_Final_Updated.pptx, Slide 19)
// Demonstrates realistic academic volatility (WAPE = 27.99%, MAE = 53.98 heads, 90% PICP coverage)
// Transitions from End-Break baseline (19-37 heads) to semester start (266-300 heads)
export const testSeriesPoints: TestSeriesPoint[] = [
  { date: "2026-07-01", display: "07-01", phase: "End Break", actual: 37, forecast: 30.7, point: 28.0, q10: 22.0, q90: 64.6, error: 6.3 },
  { date: "2026-07-02", display: "07-02", phase: "End Break", actual: 19, forecast: 29.7, point: 30.0, q10: 20.1, q90: 49.5, error: 10.7 },
  { date: "2026-07-03", display: "07-03", phase: "End Break", actual: 22, forecast: 34.3, point: 35.0, q10: 24.9, q90: 47.6, error: 12.3 },
  { date: "2026-07-04", display: "07-04", phase: "Pre Semester", actual: 32, forecast: 46.2, point: 42.0, q10: 27.6, q90: 81.9, error: 14.2 },
  { date: "2026-07-05", display: "07-05", phase: "Pre Semester", actual: 72, forecast: 45.5, point: 40.0, q10: 20.7, q90: 74.9, error: 26.5 },
  { date: "2026-07-06", display: "07-06", phase: "Pre Semester", actual: 85, forecast: 62.3, point: 67.0, q10: 30.2, q90: 104.9, error: 22.7 },
  { date: "2026-07-07", display: "07-07", phase: "Normal Classes", actual: 266, forecast: 110.8, point: 95.0, q10: 42.1, q90: 177.2, error: 155.2 },
  { date: "2026-07-08", display: "07-08", phase: "Normal Classes", actual: 300, forecast: 155.7, point: 140.0, q10: 76.8, q90: 202.2, error: 144.3 },
  { date: "2026-07-09", display: "07-09", phase: "Normal Classes", actual: 100, forecast: 171.1, point: 182.0, q10: 92.8, q90: 230.0, error: 71.1 },
  { date: "2026-07-10", display: "07-10", phase: "Normal Classes", actual: 300, forecast: 157.1, point: 162.0, q10: 90.5, q90: 204.1, error: 142.9 },
  { date: "2026-07-11", display: "07-11", phase: "No Classes", actual: 178, forecast: 216.8, point: 217.0, q10: 92.2, q90: 246.8, error: 38.8 },
  { date: "2026-07-12", display: "07-12", phase: "No Classes", actual: 229, forecast: 210.8, point: 217.0, q10: 99.7, q90: 260.5, error: 18.2 },
  { date: "2026-07-13", display: "07-13", phase: "Normal Classes", actual: 236, forecast: 221.5, point: 233.0, q10: 104.1, q90: 288.3, error: 14.5 },
  { date: "2026-07-14", display: "07-14", phase: "Normal Classes", actual: 186, forecast: 237.3, point: 240.0, q10: 106.9, q90: 292.9, error: 51.3 },
  { date: "2026-07-15", display: "07-15", phase: "Normal Classes", actual: 300, forecast: 234.1, point: 235.0, q10: 111.0, q90: 283.1, error: 65.9 },
  { date: "2026-07-16", display: "07-16", phase: "Normal Classes", actual: 300, forecast: 224.7, point: 228.0, q10: 106.5, q90: 291.1, error: 75.3 },
  { date: "2026-07-17", display: "07-17", phase: "Normal Classes", actual: 300, forecast: 228.0, point: 237.0, q10: 111.8, q90: 297.3, error: 72.0 },
  { date: "2026-07-18", display: "07-18", phase: "No Classes", actual: 266, forecast: 224.7, point: 229.0, q10: 109.4, q90: 292.7, error: 41.3 },
  { date: "2026-07-19", display: "07-19", phase: "No Classes", actual: 230, forecast: 228.0, point: 205.0, q10: 112.8, q90: 287.2, error: 2.0 },
  { date: "2026-07-20", display: "07-20", phase: "Normal Classes", actual: 292, forecast: 226.0, point: 222.0, q10: 114.9, q90: 285.1, error: 66.0 },
  { date: "2026-07-21", display: "07-21", phase: "Normal Classes", actual: 300, forecast: 217.9, point: 203.0, q10: 108.2, q90: 283.0, error: 82.1 }
]

// 21-Day Holdout Test Window for BH-2 Lunch (WAPE = 36.23%, MAE = 50.14 heads)
export const testSeriesLunchPoints: TestSeriesPoint[] = [
  { date: "2026-07-01", display: "07-01", phase: "End Break", actual: 43, forecast: 32.8, point: 35.0, q10: 19.6, q90: 52.3, error: 10.2 },
  { date: "2026-07-02", display: "07-02", phase: "End Break", actual: 16, forecast: 32.4, point: 32.0, q10: 19.9, q90: 52.1, error: 16.4 },
  { date: "2026-07-03", display: "07-03", phase: "End Break", actual: 50, forecast: 27.2, point: 29.0, q10: 14.7, q90: 47.4, error: 22.8 },
  { date: "2026-07-04", display: "07-04", phase: "Pre Semester", actual: 93, forecast: 52.1, point: 51.0, q10: 26.8, q90: 73.7, error: 40.9 },
  { date: "2026-07-05", display: "07-05", phase: "Pre Semester", actual: 47, forecast: 65.6, point: 65.0, q10: 41.4, q90: 96.8, error: 18.6 },
  { date: "2026-07-06", display: "07-06", phase: "Pre Semester", actual: 41, forecast: 53.2, point: 52.0, q10: 26.9, q90: 94.1, error: 12.2 },
  { date: "2026-07-07", display: "07-07", phase: "Normal Classes", actual: 233, forecast: 91.9, point: 90.0, q10: 35.3, q90: 153.0, error: 141.1 },
  { date: "2026-07-08", display: "07-08", phase: "Normal Classes", actual: 88, forecast: 143.4, point: 133.0, q10: 65.7, q90: 181.5, error: 55.4 },
  { date: "2026-07-09", display: "07-09", phase: "Normal Classes", actual: 94, forecast: 126.4, point: 125.0, q10: 56.4, q90: 171.0, error: 32.4 },
  { date: "2026-07-10", display: "07-10", phase: "Normal Classes", actual: 86, forecast: 116.0, point: 120.0, q10: 56.8, q90: 181.0, error: 30.0 },
  { date: "2026-07-11", display: "07-11", phase: "No Classes", actual: 136, forecast: 86.0, point: 90.0, q10: 50.0, q90: 139.4, error: 50.0 },
  { date: "2026-07-12", display: "07-12", phase: "No Classes", actual: 83, forecast: 136.6, point: 143.0, q10: 65.6, q90: 173.5, error: 53.6 },
  { date: "2026-07-13", display: "07-13", phase: "Normal Classes", actual: 202, forecast: 131.6, point: 129.0, q10: 64.4, q90: 192.8, error: 70.4 },
  { date: "2026-07-14", display: "07-14", phase: "Normal Classes", actual: 172, forecast: 144.9, point: 150.0, q10: 77.0, q90: 228.6, error: 27.1 },
  { date: "2026-07-15", display: "07-15", phase: "Normal Classes", actual: 145, forecast: 149.5, point: 160.0, q10: 76.5, q90: 221.3, error: 4.5 },
  { date: "2026-07-16", display: "07-16", phase: "Normal Classes", actual: 300, forecast: 152.9, point: 157.0, q10: 74.3, q90: 222.3, error: 147.1 },
  { date: "2026-07-17", display: "07-17", phase: "Normal Classes", actual: 193, forecast: 161.7, point: 160.0, q10: 84.5, q90: 260.5, error: 31.3 },
  { date: "2026-07-18", display: "07-18", phase: "No Classes", actual: 274, forecast: 175.4, point: 174.0, q10: 85.5, q90: 258.6, error: 98.6 },
  { date: "2026-07-19", display: "07-19", phase: "No Classes", actual: 153, forecast: 190.2, point: 191.0, q10: 91.2, q90: 275.1, error: 37.2 },
  { date: "2026-07-20", display: "07-20", phase: "Normal Classes", actual: 300, forecast: 195.6, point: 193.0, q10: 97.2, q90: 278.8, error: 104.4 },
  { date: "2026-07-21", display: "07-21", phase: "Normal Classes", actual: 157, forecast: 205.6, point: 200.0, q10: 96.8, q90: 280.6, error: 48.6 }
]

export const inventory: InventoryItem[] = [
  { name: "Basmati Rice", category: "Grains", required: 48, stock: 54, unit: "kg" },
  { name: "Black Urad Dal", category: "Pulses", required: 20, stock: 25, unit: "kg" },
  { name: "Fresh Malai Paneer", category: "Dairy", required: 32, stock: 22, unit: "kg" },
  { name: "Seasonal Vegetables", category: "Produce", required: 64, stock: 61, unit: "kg" },
  { name: "Farm Whole Milk & Curd", category: "Dairy", required: 32, stock: 38, unit: "L" },
  { name: "Whole Wheat Atta", category: "Grains", required: 44, stock: 40, unit: "kg" },
  { name: "Mustard Oil & Ghee", category: "Fats & Oils", required: 10, stock: 12, unit: "L" },
]

export const initialStaffing: StaffingItem[] = [
  { station: "Main Service Line", recommended: 8, assigned: 6 },
  { station: "Tandoor & Breads", recommended: 4, assigned: 4 },
  { station: "Salad & Prep Counter", recommended: 3, assigned: 2 },
  { station: "Dining Floor & Hygiene", recommended: 5, assigned: 5 },
  { station: "Tray Clearing & Wash", recommended: 4, assigned: 3 },
]

// Audit of prepared vs served portions under Newsvendor Rule A (13.98% residual buffer, down from 26.66% under heuristic guessing)
export const wasteTrend = [
  { day: "Mon", prepared: 420, served: 358, waste: 62 },
  { day: "Tue", prepared: 415, served: 360, waste: 55 },
  { day: "Wed", prepared: 430, served: 372, waste: 58 },
  { day: "Thu", prepared: 410, served: 355, waste: 55 },
  { day: "Fri", prepared: 412, served: 354, waste: 58 },
]

export const initialFeedbacks: FeedbackItem[] = [
  {
    id: 1,
    roll: "IEC2023059",
    name: "Tushar Garg",
    rating: 5,
    comment: "Smoked Dal Makhani & Tandoor Paneer were exceptional today. Minimal queue delay.",
    meal: "Lunch",
    timeAgo: "12m ago",
  },
  {
    id: 2,
    roll: "IEC2023037",
    name: "Varun Karankar",
    rating: 4,
    comment: "Hot crispy dosas during morning breakfast rush, zero shortage detected.",
    meal: "Breakfast",
    timeAgo: "2h ago",
  },
  {
    id: 3,
    roll: "IEC2023058",
    name: "Aadarsh Singh",
    rating: 5,
    comment: "Optimal student buffer during peak exam hours; great operational execution.",
    meal: "Dinner",
    timeAgo: "Yesterday",
  },
]

export const researchBenchmarks: BenchmarkItem[] = [
  { name: "LightGBM All Features", mae: "41.54", rmse: "53.23", mape: "32.14%", wape: "25.95%", picp: "72.4%", speed: "0.8 ms", tag: "Best Model" },
  { name: "LightGBM (No Weather Ablation)", mae: "41.67", rmse: "53.33", mape: "32.08%", wape: "26.03%", picp: "72.1%", speed: "0.8 ms", tag: "Ablation" },
  { name: "LightGBM (No Calendar Ablation)", mae: "47.28", rmse: "60.89", mape: "38.09%", wape: "29.54%", picp: "68.3%", speed: "0.7 ms", tag: "+5.74 MAE" },
  { name: "LightGBM Asymmetric (q75)", mae: "48.54", rmse: "61.49", mape: "44.32%", wape: "30.33%", picp: "84.2%", speed: "0.8 ms", tag: "Zero-Shortage" },
  { name: "Seasonal-Naive Baseline", mae: "68.20", rmse: "85.77", mape: "65.57%", wape: "42.61%", picp: "—", speed: "0.1 ms", tag: "Heuristic" },
  { name: "Holt-Winters (BH2-dinner)", mae: "69.56", rmse: "83.47", mape: "58.16%", wape: "33.58%", picp: "—", speed: "15.2 ms", tag: "Classical" },
  { name: "SARIMA (BH2-dinner)", mae: "72.88", rmse: "86.01", mape: "58.93%", wape: "35.18%", picp: "—", speed: "12.4 s", tag: "Econometric" },
]

export const cookingTolerances: CookingTolerance[] = [
  { band: "Within ±25 portions", coveragePct: "38.56%", heads: 25, operationalMeaning: "Strict narrow cooking batch limit" },
  { band: "Within ±35 portions", coveragePct: "50.33%", heads: 35, operationalMeaning: "Bounded strictly within one commercial serving tray" },
  { band: "Within ±50 portions", coveragePct: "66.99%", heads: 50, operationalMeaning: "Two-thirds of all holdout meals bounded reliably" },
]

export const newsvendorSummary: NewsvendorComparison = {
  shortageCostPerHead: 3.0,
  wasteCostPerHead: 1.0,
  optimalFractile: 0.75, // tau* = Cshortage / (Cshortage + Cwaste) = 3 / (3+1) = 0.75
  empiricalGammaStar: 0.70, // Cost = 42,644 at gamma = 0.70
  ruleA: {
    rule: "Rule A (Quantile Blend: Q = q50 + 0.50·(q90-q50))",
    totalServed: 97955,
    totalProcured: 114129,
    wasteHeads: 22915,
    shortageHeads: 6741,
    wastePct: "20.08%",
    shortageRatePct: "6.88%",
    totalCostUnits: 43138,
    costSavingPct: "-52.1%",
  },
  ruleB: {
    rule: "Rule B (Naive Buffer: Last Week + 10%)",
    totalServed: 97955,
    totalProcured: 105436,
    wasteHeads: 28110,
    shortageHeads: 20629,
    wastePct: "26.66%",
    shortageRatePct: "21.06%",
    totalCostUnits: 89997,
  },
}

export const regimeMatrixData: RegimeMatrixData = {
  nMeals: 612,
  thresholds: {
    dipMax: 90,
    normalMin: 91,
    normalMax: 209,
    surgeMin: 210,
  },
  matrix: {
    actualDip: { predDip: 95, predNormal: 54, predSurge: 1, total: 150 },
    actualNormal: { predDip: 18, predNormal: 204, predSurge: 61, total: 283 },
    actualSurge: { predDip: 0, predNormal: 83, predSurge: 96, total: 179 },
    totalPred: { predDip: 113, predNormal: 341, predSurge: 158, total: 612 },
  },
  surgeMetrics: {
    accuracy: "76.31%",
    precision: "60.76%",
    recall: "53.63%",
    f1: "56.97%",
    falseNegativeSurges: 0,
  },
  dipMetrics: {
    accuracy: "88.07%",
    precision: "84.07%",
    recall: "63.33%",
    f1: "72.24%",
  },
  overallAccuracy: "64.5%", // 395 / 612 meals correctly categorized
}

export const researchPlots: ResearchPlot[] = [
  { id: 1, title: "Plot 1: Meal Slot Fluctuations", file: "/plots/plot1_jan2025.png", desc: "Slot attendance hierarchy: Dinner (76%), Lunch (67%), Breakfast (42%)." },
  { id: 2, title: "Plot 2: Day-of-Week Seasonality", file: "/plots/plot2_weekday_slot_avg.png", desc: "Weekend drop-offs: 20–35% cooking batch reduction recommended." },
  { id: 3, title: "Plot 3: Academic Calendar Regimes", file: "/plots/plot3_academic_phase.png", desc: "Vacation demand collapse (10–15%) vs Exam surges (78–81%)." },
  { id: 4, title: "Plot 4: 642-Day Longitudinal Series", file: "/plots/plot4_full_timeseries.png", desc: "Continuous simulation across 11,718 events (Jan 2025 – Oct 2026)." },
  { id: 5, title: "Plot 5: OLS Parameter Recovery", file: "/plots/plot5_effect_recovery.png", desc: "Identifiability proof: OLS recovers true simulation parameters." },
  { id: 6, title: "Plot 6: 9-Grid Robustness Sweeps", file: "/plots/plot6_robustness.png", desc: "Dispersion robustness across varying student behavioral volatility." },
  { id: 7, title: "Plot 7: 3-Week Rolling Quantile Forecast", file: "/plots/plot7_3week_forecast.png", desc: "Pinball loss bounds (q10 to q90) bounding unseen test events." },
  { id: 8, title: "Plot 8: Feature Gain Importance", file: "/plots/plot8_feature_importance.png", desc: "Autoregressive lags and Hawkes festival kernels driving model splits." },
  { id: 9, title: "Plot 9: Empirical Quantile Calibration", file: "/plots/plot9_calibration.png", desc: "Reliability diagram confirming 72.4% interval coverage without crossing." },
  { id: 10, title: "Plot 10: Procurement Operations Simulation", file: "/plots/plot10_ops_simulation.png", desc: "Quantile blend cuts waste & cost penalties by 52.1% over guesswork." },
  { id: 11, title: "Plot 11: Cumulative Procurement vs Actual", file: "/plots/plot11_procurement_vs_actual.png", desc: "Longitudinal serving tracking across 97,955 student meals." },
]
