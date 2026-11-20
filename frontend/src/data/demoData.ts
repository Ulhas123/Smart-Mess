import type {
  BenchmarkItem,
  FeedbackItem,
  InventoryItem,
  MenuDay,
  ResearchPlot,
  StaffingItem,
} from "../types"

export const student = {
  id: "IEC2023059",
  name: "Tushar Garg",
  residence: "BH-2 Hostel",
  department: "Electronics & Communication Engineering",
  institution: "IIIT Allahabad",
}

export const baselineCheckIns = 486

export const menuDays: MenuDay[] = [
  {
    day: "Today",
    date: "12 Jun",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: ["Poha & Mint Chutney", "Boiled Sprouts & Eggs", "Seasonal Banana", "Hot Masala Chai"],
        tags: ["High protein", "Chef's Special"],
        allergen: "Eggs · Dairy",
      },
      Lunch: {
        time: "12:30 – 14:30",
        items: [
          "Smoked Dal Makhani",
          "Fragrant Jeera Rice",
          "Tandoor Paneer Tikka",
          "Crisp Cucumber Raita",
          "Tawa Phulka",
        ],
        tags: ["Vegetarian", "Chef's Selection"],
        allergen: "Dairy · Gluten",
      },
      Snacks: {
        time: "16:30 – 17:30",
        items: ["Crispy Baked Samosa", "Sweet Saunth Chutney", "Cardamom Filter Coffee"],
        tags: ["Vegetarian"],
        allergen: "Gluten",
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: ["Shahi Paneer / Kadai Chicken (BH-3)", "Yellow Moong Dal Tadka", "Laccha Paratha", "Warm Gulab Jamun"],
        tags: ["Dessert Special", "High Protein"],
        allergen: "Dairy · Gluten",
      },
    },
  },
  {
    day: "Tomorrow",
    date: "13 Jun",
    meals: {
      Breakfast: {
        time: "07:30 – 09:30",
        items: ["Steamed Idli Sambar", "Medu Vada", "Fresh Coconut Chutney", "Filter Coffee"],
        tags: ["Vegan", "South Indian"],
      },
      Lunch: {
        time: "12:30 – 14:30",
        items: ["Punjabi Rajma Masala", "Steamed Basmati Rice", "Aloo Gobi Matar", "Kachumber Salad"],
        tags: ["Vegan", "High Fibre"],
        allergen: "Gluten",
      },
      Snacks: {
        time: "16:30 – 17:30",
        items: ["Gujarati Khaman Dhokla", "Green Coriander Chutney", "Adrak Chai"],
        tags: ["Vegan"],
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: ["Kashmiri Dum Aloo", "Dal Panchratna", "Butter Naan", "Kesari Kheer"],
        tags: ["Vegetarian", "Dessert"],
        allergen: "Dairy · Gluten",
      },
    },
  },
  {
    day: "Saturday",
    date: "14 Jun",
    meals: {
      Breakfast: {
        time: "08:00 – 10:00",
        items: ["Amritsari Aloo Paratha", "Fresh Chilled Curd", "Spicy Mango Pickle", "Hot Bournvita / Milk"],
        tags: ["Vegetarian", "Weekend Brunch"],
        allergen: "Dairy · Gluten",
      },
      Lunch: {
        time: "12:30 – 14:30",
        items: ["Hyderabadi Veg Dum Biryani", "Mirchi Ka Salan", "Boondi Raita", "Roasted Papad"],
        tags: ["Vegetarian", "Special Feasts"],
        allergen: "Dairy",
      },
      Snacks: {
        time: "16:30 – 17:30",
        items: ["Mumbai Bhel Puri", "Kala Khatta Drink"],
        tags: ["Street Style"],
      },
      Dinner: {
        time: "19:30 – 21:30",
        items: ["Pindi Chole", "Fluffy Bhature", "Pickled Green Chillies", "Rasgulla"],
        tags: ["Weekend Special", "Dessert"],
        allergen: "Gluten · Dairy",
      },
    },
  },
]

export const demandPoints = [
  { time: "12:30", forecast: 72, actual: 58 },
  { time: "12:50", forecast: 134, actual: 126 },
  { time: "13:10", forecast: 188, actual: 196 },
  { time: "13:30", forecast: 242, actual: 231 },
  { time: "13:50", forecast: 198, actual: 184 },
  { time: "14:10", forecast: 112, actual: 96 },
]

export const inventory: InventoryItem[] = [
  { name: "Basmati Rice", category: "Grains", required: 82, stock: 54, unit: "kg" },
  { name: "Black Urad Dal", category: "Pulses", required: 46, stock: 51, unit: "kg" },
  { name: "Fresh Malai Paneer", category: "Dairy", required: 38, stock: 22, unit: "kg" },
  { name: "Seasonal Vegetables", category: "Produce", required: 74, stock: 61, unit: "kg" },
  { name: "Farm Whole Milk & Curd", category: "Dairy", required: 52, stock: 58, unit: "L" },
  { name: "Whole Wheat Atta", category: "Grains", required: 95, stock: 90, unit: "kg" },
  { name: "Mustard Oil & Ghee", category: "Fats & Oils", required: 26, stock: 28, unit: "L" },
]

export const initialStaffing: StaffingItem[] = [
  { station: "Main Service Line", recommended: 8, assigned: 6 },
  { station: "Tandoor & Breads", recommended: 4, assigned: 4 },
  { station: "Salad & Prep Counter", recommended: 3, assigned: 2 },
  { station: "Dining Floor & Hygiene", recommended: 5, assigned: 5 },
  { station: "Tray Clearing & Wash", recommended: 4, assigned: 3 },
]

export const wasteTrend = [
  { day: "Mon", prepared: 742, served: 699, waste: 43 },
  { day: "Tue", prepared: 768, served: 731, waste: 37 },
  { day: "Wed", prepared: 754, served: 724, waste: 30 },
  { day: "Thu", prepared: 781, served: 757, waste: 24 },
  { day: "Fri", prepared: 746, served: 727, waste: 19 },
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
  { name: "LightGBM Quantile (All Features)", mae: "41.54", rmse: "53.23", mape: "32.14%", wape: "25.95%", picp: "72.4%", speed: "0.4 ms", tag: "Best Model" },
  { name: "LightGBM (No Weather Ablation)", mae: "41.67", rmse: "53.33", mape: "32.08%", wape: "26.03%", picp: "72.1%", speed: "0.4 ms", tag: "Ablation" },
  { name: "LightGBM (No Calendar Ablation)", mae: "47.28", rmse: "60.89", mape: "38.09%", wape: "29.54%", picp: "68.3%", speed: "0.3 ms", tag: "+5.74 MAE" },
  { name: "LightGBM Asymmetric (q75 Target)", mae: "48.54", rmse: "61.49", mape: "44.32%", wape: "30.33%", picp: "84.2%", speed: "0.4 ms", tag: "Zero-Shortage" },
  { name: "Seasonal-Naive Baseline", mae: "68.20", rmse: "85.77", mape: "65.57%", wape: "42.61%", picp: "—", speed: "0.1 ms", tag: "Heuristic" },
  { name: "Holt-Winters Exponential Smoothing", mae: "69.56", rmse: "83.47", mape: "58.16%", wape: "33.58%", picp: "—", speed: "12.3 ms", tag: "Classical" },
  { name: "SARIMA (2,1,1)(1,1,1)₇", mae: "72.88", rmse: "86.01", mape: "58.93%", wape: "35.18%", picp: "—", speed: "145.0 ms", tag: "Econometric" },
]

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
