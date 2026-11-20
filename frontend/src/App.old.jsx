import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KitchenOpsView from './components/KitchenOpsView';
import WhatIfSimulatorView from './components/WhatIfSimulatorView';
import StudentPortalView from './components/StudentPortalView';
import ResearchShowcaseView from './components/ResearchShowcaseView';
import { Building2, Heart, Award, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('kitchen');
  const [darkMode, setDarkMode] = useState(true);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* Global Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'kitchen' && <KitchenOpsView />}
        {activeTab === 'simulator' && <WhatIfSimulatorView />}
        {activeTab === 'student' && <StudentPortalView />}
        {activeTab === 'research' && <ResearchShowcaseView />}
      </main>

      {/* Official IIIT Allahabad Academic Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/80 backdrop-blur-md py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <img 
                src="/iiita-logo.svg" 
                alt="IIITA Emblem" 
                className="w-10 h-10 object-contain filter drop-shadow" 
              />
              <div>
                <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  Indian Institute of Information Technology, Allahabad
                </div>
                <div className="text-xs text-slate-500">
                  Department of Electronics and Communication Engineering · ECE Minor Project
                </div>
              </div>
            </div>

            <div className="text-center md:text-right text-xs text-slate-500 space-y-1">
              <div>
                Supervised by <strong className="text-slate-800 dark:text-slate-200">Dr. Kirtan Gopal Panda</strong>
              </div>
              <div>
                Created by <strong className="text-slate-800 dark:text-slate-200">Varun Karankar</strong> · <strong className="text-slate-800 dark:text-slate-200">Aadarsh Singh</strong> · <strong className="text-slate-800 dark:text-slate-200">Tushar Garg</strong>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              © 2026 IIIT Allahabad. Predictive Mathematical Modeling for Mess Management.
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/TusharGarg12/ml-for-the-project-presentation" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-emerald-500 transition"
              >
                GitHub Repository
              </a>
              <span>·</span>
              <a 
                href="/MinorProject_Presentation.pptx" 
                download 
                className="hover:text-emerald-500 transition"
              >
                Presentation Deck (.pptx)
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
