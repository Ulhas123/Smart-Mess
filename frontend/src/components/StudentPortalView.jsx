import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Utensils, 
  Star, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Send, 
  Sparkles,
  Calendar,
  ChefHat,
  Heart
} from 'lucide-react';
import { submitSwipe, submitFeedback } from '../services/api';

export default function StudentPortalView() {
  const [activeHostel, setActiveHostel] = useState('BH-2');
  const [activeDay, setActiveDay] = useState('Monday');
  
  // QR Check-in states
  const [rollInput, setRollInput] = useState('IEC2023059');
  const [studentName, setStudentName] = useState('Tushar Garg');
  const [scanSlot, setScanSlot] = useState('dinner');
  const [recentScans, setRecentScans] = useState([
    { id: 1, roll: 'IEC2023059', name: 'Tushar Garg', hostel: 'BH-3', slot: 'dinner', timestamp: '19:42:10' },
    { id: 2, roll: 'IEC2023037', name: 'Varun Karankar', hostel: 'BH-2', slot: 'dinner', timestamp: '19:44:45' },
    { id: 3, roll: 'IEC2023058', name: 'Aadarsh Singh', hostel: 'BH-3', slot: 'dinner', timestamp: '19:46:20' },
    { id: 4, roll: 'IEC2023012', name: 'Rohan Sharma', hostel: 'BH-2', slot: 'dinner', timestamp: '19:48:05' },
  ]);
  const [liveCount, setLiveCount] = useState(214);
  const [lastCheckin, setLastCheckin] = useState(null);

  // Feedback states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackMeal, setFeedbackMeal] = useState('Dinner');
  const [feedbackList, setFeedbackList] = useState([
    { id: 1, roll: 'IEC2023059', rating: 5, comment: 'Special Paneer Butter Masala was top-tier tonight!', meal: 'Dinner', date: '10m ago' },
    { id: 2, roll: 'IEC2023037', rating: 4, comment: 'Crisp hot dosas for breakfast, zero waiting time.', meal: 'Breakfast', date: '2h ago' },
    { id: 3, roll: 'IEC2023058', rating: 5, comment: 'Sufficient food buffer during late exam night dinner.', meal: 'Dinner', date: 'Yesterday' }
  ]);

  // Weekly Menu Data for BH-2 & BH-3
  const weeklyMenu = {
    'BH-2': {
      'Monday': {
        breakfast: 'Poha, Jalebi, Sprouts, Hot Tea / Milk',
        lunch: 'Rajma Masala, Steamed Rice, Phulka Chapati, Seasonal Veg, Green Salad',
        dinner: 'Paneer Butter Masala, Dal Makhani, Jeera Rice, Chapati, Gulab Jamun',
        tags: ['Dessert', 'Chef Special']
      },
      'Tuesday': {
        breakfast: 'Stuffed Aloo Paratha, Fresh Curd, Mixed Pickle, Tea',
        lunch: 'Punjabi Kadhi Pakora, Jeera Rice, Aloo Gobi Masala, Chapati',
        dinner: 'Matar Paneer, Yellow Moong Dal Fry, Phulka, Rice, Kheer',
        tags: ['Dessert']
      },
      'Wednesday': {
        breakfast: 'Steamed Idli Sambar, Medu Vada, Coconut Chutney, Tea/Coffee',
        lunch: 'Chole Bhature, Veg Pulao, Boondi Raita, Sliced Onion Salad',
        dinner: 'Mixed Vegetable Handi, Dal Tadka, Chapati, Rice, Fruit Custard',
        tags: ['Fast Food Favorite', 'Dessert']
      },
      'Thursday': {
        breakfast: 'Vegetable Upma, Boiled Corn, Banana, Hot Tea',
        lunch: 'Kala Chana Masala, Steamed Rice, Bhindi Do Pyaza, Chapati',
        dinner: 'Shahi Paneer, Dal Fry, Butter Roti, Peas Pulao, Vanilla Ice Cream',
        tags: ['Dessert', 'Chef Special']
      },
      'Friday': {
        breakfast: 'Puri Sabzi, Sooji Halwa, Hot Tea',
        lunch: 'Dal Makhani, Jeera Rice, Aloo Jeera, Butter Milk, Salad',
        dinner: 'Kashmiri Dum Aloo, Yellow Dal, Tandoori Roti, Veg Biryani, Rasgulla',
        tags: ['Dessert']
      },
      'Saturday': {
        breakfast: 'Crispy Masala Dosa, Potato Masala, Sambar, Chutney',
        lunch: 'Kashmiri Pulao, Paneer Bhurji, Dal Tadka, Chapati',
        dinner: 'Hyderabadi Veg Dum Biryani, Mirchi Ka Salan, Veg Raita, Rasmalai',
        tags: ['Fast Food Favorite', 'Chef Special', 'Dessert']
      },
      'Sunday': {
        breakfast: 'Mumbai Pav Bhaji, Butter Toasted Pav, Chopped Onions & Lemon, Tea',
        lunch: 'Sunday Feast: Paneer Lababdar, Dal Tadka, Poori, Peas Pulao, Sweet',
        dinner: 'Aloo Matar Rasedar, Dal Fry, Rice, Chapati, Seasonal Fruit Bowl',
        tags: ['Fast Food Favorite', 'Chef Special', 'Dessert']
      }
    },
    'BH-3': {
      'Monday': {
        breakfast: 'Poha, Boiled Eggs / Fresh Banana, Tea / Milk',
        lunch: 'Rajma Masala, Steamed Rice, Chapati, Aloo Beans, Salad',
        dinner: 'Chicken Curry / Paneer Butter Masala, Dal Makhani, Jeera Rice, Gulab Jamun',
        tags: ['Non-Veg Night', 'Dessert', 'Special']
      },
      'Tuesday': {
        breakfast: 'Egg Bhurji / Stuffed Aloo Paratha, Curd, Tea',
        lunch: 'Kadhi Pakora, Rice, Aloo Gobi, Chapati, Salad',
        dinner: 'Matar Paneer, Dal Tadka, Rice, Chapati, Sevai Kheer',
        tags: ['Dessert']
      },
      'Wednesday': {
        breakfast: 'Idli Sambar, Single-Egg Omelette / Coconut Chutney, Tea',
        lunch: 'Chole Bhature, Pulao, Boondi Raita, Onion Salad',
        dinner: 'Mixed Veg Curry, Dal Fry, Chapati, Steamed Rice, Fruit Custard',
        tags: ['Fast Food Favorite', 'Dessert']
      },
      'Thursday': {
        breakfast: 'Bread Omelette / Veg Club Sandwich, Mint Chutney, Tea',
        lunch: 'Egg Curry / Kala Chana Masala, Steamed Rice, Bhindi, Chapati',
        dinner: 'Shahi Paneer, Dal Fry, Naan/Chapati, Pulao, Ice Cream',
        tags: ['Non-Veg Option', 'Dessert']
      },
      'Friday': {
        breakfast: 'Puri Sabzi, Halwa, Tea / Milk',
        lunch: 'Dal Makhani, Rice, Chapati, Aloo Jeera, Fresh Salad',
        dinner: 'Hyderabadi Chicken Biryani / Veg Biryani, Mirchi Ka Salan, Raita, Rasgulla',
        tags: ['Non-Veg Night', 'Chef Special', 'Dessert']
      },
      'Saturday': {
        breakfast: 'Masala Dosa, Sambhar, Chutney, Tea',
        lunch: 'Egg Fried Rice / Veg Fried Rice, Manchurian Gravy, Salad',
        dinner: 'Paneer Kolhapuri, Dal Tadka, Chapati, Rice, Sweet',
        tags: ['Fast Food Favorite']
      },
      'Sunday': {
        breakfast: 'Egg Roll / Pav Bhaji, Hot Tea',
        lunch: 'Sunday Feast: Butter Chicken Roast / Paneer Lababdar, Puri, Pulao, Ice Cream',
        dinner: 'Light Khichdi, Aloo Matar, Dahi, Chapati, Fruit',
        tags: ['Non-Veg Feast', 'Chef Special', 'Dessert']
      }
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentMealDay = weeklyMenu[activeHostel]?.[activeDay] || weeklyMenu['BH-2']['Monday'];

  // Handle Swipe Simulation
  const handleSwipe = async (roll, name) => {
    const res = await submitSwipe(roll, activeHostel, scanSlot, name);
    setLiveCount(prev => prev + 1);
    setLastCheckin(res.scan);
    setRecentScans(prev => [res.scan, ...prev.slice(0, 14)]);
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const res = await submitFeedback(rollInput, rating, comment, feedbackMeal);
    setFeedbackList(prev => [res.entry, ...prev]);
    setComment('');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <QrCode className="w-3.5 h-3.5 text-emerald-500" />
              Student Portal & Telemetry
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Empirical Ground-Truth Collection Module
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Student Mess Card Check-In & Telemetry
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Simulates real-world QR card-swipe intake at mess entry turnstiles to capture empirical attendance logs for model fine-tuning.
          </p>
        </div>

        {/* Live Attendance Counter */}
        <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <UserCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Live Turnstile Intake</div>
            <div className="text-2xl font-black text-white">{liveCount} <span className="text-xs font-normal text-slate-400">/ 300</span></div>
          </div>
        </div>
      </div>

      {/* Main Grid: QR Scanner Simulator on Left, Weekly Menu on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: QR Code Scanner Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Turnstile QR Scanner
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                Camera Active
              </span>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/60 overflow-hidden flex flex-col items-center justify-center p-4">
              {/* Laser Sweep Animation */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-bounce top-1/2"></div>
              
              {/* QR Box target */}
              <div className="w-36 h-36 rounded-xl border-2 border-emerald-500 relative flex items-center justify-center bg-emerald-950/20 backdrop-blur-sm">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white"></div>
                <QrCode className="w-16 h-16 text-emerald-400/80" />
              </div>

              <span className="text-[11px] text-emerald-400 font-mono mt-3">
                Align Student Digital ID in Frame
              </span>
            </div>

            {/* Quick Author / Student Swipe Buttons */}
            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-slate-500 block">
                Quick 1-Tap Student Simulation
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleSwipe('IEC2023059', 'Tushar Garg')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-left transition"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">Tushar Garg</div>
                  <div className="text-[10px] text-slate-500 font-mono">IEC2023059</div>
                </button>

                <button
                  onClick={() => handleSwipe('IEC2023037', 'Varun Karankar')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-left transition"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">Varun Karankar</div>
                  <div className="text-[10px] text-slate-500 font-mono">IEC2023037</div>
                </button>

                <button
                  onClick={() => handleSwipe('IEC2023058', 'Aadarsh Singh')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-left transition"
                >
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">Aadarsh Singh</div>
                  <div className="text-[10px] text-slate-500 font-mono">IEC2023058</div>
                </button>
              </div>

              {/* Custom Student Roll Input */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Roll No (e.g. IEC2023099)"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleSwipe(rollInput || 'IEC2023000', studentName)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <span>Verify</span>
                </button>
              </div>

            </div>

            {/* Check-in Confirmation Badge */}
            {lastCheckin && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">{lastCheckin.name}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-mono">
                      Verified at {lastCheckin.timestamp} · {lastCheckin.hostel}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 uppercase">
                  Swipe OK
                </span>
              </div>
            )}

          </div>

          {/* Live Recent Scans Feed */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Live Turnstile Telemetry Log
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Stream</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentScans.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({s.roll})</span>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    {s.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Weekly Mess Menu & Student Ratings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Weekly Interactive Mess Menu */}
          <div className="glass-panel p-6 border-t-4 border-t-iiita-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-iiita-600 dark:text-iiita-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Official Weekly Mess Menu
                  </h3>
                  <p className="text-xs text-slate-500">IIITA Hostel Dining Schedule</p>
                </div>
              </div>

              {/* Hostel Selector */}
              <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                <button
                  onClick={() => setActiveHostel('BH-2')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeHostel === 'BH-2'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  BH-2 (Veg)
                </button>
                <button
                  onClick={() => setActiveHostel('BH-3')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeHostel === 'BH-3'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  BH-3 (Non-Veg)
                </button>
              </div>
            </div>

            {/* Day of Week Tabs */}
            <div className="flex overflow-x-auto gap-1.5 py-3 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
              {daysOfWeek.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeDay === d
                      ? 'bg-iiita-900 dark:bg-iiita-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Daily Meals Breakdown */}
            <div className="mt-4 space-y-3">
              
              {/* Breakfast */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Breakfast (07:30 – 09:30 AM)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">42% base dining</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {currentMealDay.breakfast}
                </p>
              </div>

              {/* Lunch */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Lunch (12:30 – 02:30 PM)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">67% base dining</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {currentMealDay.lunch}
                </p>
              </div>

              {/* Dinner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Dinner (07:30 – 09:30 PM)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">76% base dining</span>
                </div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {currentMealDay.dinner}
                </p>
                {currentMealDay.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentMealDay.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Student Meal Rating & Feedback Box */}
          <div className="glass-panel p-6 border-t-4 border-t-amber-500">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Student Dish Feedback & Meal Ratings
            </h3>

            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
                <select
                  value={feedbackMeal}
                  onChange={(e) => setFeedbackMeal(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-xs rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share dish feedback (e.g. Matar Paneer was perfectly spiced)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit</span>
                </button>
              </div>
            </form>

            {/* Feedback Feed */}
            <div className="mt-4 space-y-2 max-h-36 overflow-y-auto pr-1">
              {feedbackList.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{f.roll} · {f.meal}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {'★'.repeat(f.rating)}
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">{f.comment}</p>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
