// MP42 Jadaene Brown 1903233
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Map as MapIcon,
  Container, 
  Leaf, 
  BookOpen, 
  AlertTriangle, 
  Droplets, 
  Thermometer, 
  Plus, 
  CheckCircle2, 
  Sprout,
  ChevronRight,
  TrendingUp,
  Droplet,
  Cloud,
  ArrowUpRight,
  ArrowDownLeft,
  LayoutDashboard,
  ClipboardList,
  Activity,
  Calendar,
  Volume2,
  Loader2,
  Sun,
  Moon,
  Camera,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets as HumidityIcon,
  GitCompare,
  Carrot,
  Wheat,
  Flame,
  Salad,
  Cherry,
  Apple,
  LogOut,
  Radio,
  Cpu,
  Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';
import { cn } from './lib/utils';
import { MOCK_PLOTS, MOCK_NUTRIENTS, MOCK_LOGS, generateGrowthHistoryRange, type FarmPlot, type NutrientData, type LogEntry } from './constants';
import { getAIRecommendations, getAIAudio } from './lib/gemini';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Login } from './components/Login';

// --- Global Context ---
type AppContextType = {
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  profilePhoto: string | null;
  setProfilePhoto: (p: string | null) => void;
  user: User | null;
  logout: () => void;
  plots: FarmPlot[];
  weatherData: any | null;
  systemLogs: LogEntry[];
  addSystemLog: (log: Omit<LogEntry, 'id'>) => void;
};
const AppContext = React.createContext<AppContextType>({} as any);

// --- Shared Elements ---
const CropImage = ({ crop, className, size = "md" }: { crop: string, className?: string, size?: "sm" | "md" | "lg" }) => {
  const crops = crop.split(/&|,/).map(s => s.trim()).filter(Boolean);
  
  const getImageUrl = (cInput: string) => {
    const c = cInput.toLowerCase();
    if (c.includes('yam')) return './Yam.png';
    if (c.includes('pepper')) return './Pepper.jpg';
    if (c.includes('pak choy') || c.includes('callaloo')) return './Pak Choy.jpg';
    if (c.includes('tomato')) return './Tomato.jpg';
    if (c.includes('corn')) return './Corn.jpg';
    return 'https://images.unsplash.com/photo-1599598425947-330026206a05?w=100&h=100&fit=crop';
  };

  const szClass = size === "sm" ? "w-10 h-10 border-2" : size === "lg" ? "w-24 h-24 border-[4px]" : "w-[78px] h-[78px] border-[3px]";
  const spClass = size === "sm" ? "-space-x-3" : size === "lg" ? "-space-x-8" : "-space-x-6";

  return (
    <div className={cn("flex flex-row items-center justify-center", spClass, className)}>
      {crops.map((c, i) => (
        <div 
          key={i} 
          className={cn("rounded-full flex-shrink-0 overflow-hidden border-white dark:border-slate-800 shadow-md relative z-10 hover:z-20", szClass)}
          style={{ zIndex: i }}
        >
          <img src={getImageUrl(c)} alt={c} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      ))}
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { darkMode, setDarkMode, profilePhoto, setProfilePhoto, logout, user } = React.useContext(AppContext);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target.result as string;
          setProfilePhoto(url);
          if (user) {
            try {
              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
              await updateDoc(doc(db, 'users', user.uid), {
                photoURL: url,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Failed to save profile photo:", err);
            }
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const menuGroups = [
    {
      title: "Management",
      items: [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tank', label: 'Water Tank', icon: Container },
        { id: 'map', label: 'Map', icon: MapIcon },
        { id: 'log', label: 'Operation Logs', icon: ClipboardList },
      ]
    },
    {
      title: "Analysis",
      items: [
        { id: 'ai', label: 'AI Advisor', icon: Leaf },
        { id: 'compare', label: 'Compare Plots', icon: GitCompare },
      ]
    },
    {
      title: "System",
      items: [
        { id: 'devices', label: 'Devices', icon: Radio },
      ]
    }
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-brand-rich text-emerald-50 h-screen sticky top-0 border-r border-emerald-800 shrink-0">
      <div className="p-6 mb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <img src="./WNM%20logo%202.png" alt="WNM Logo" className="w-16 h-16 object-contain" />
            <h1 className="text-xl font-black text-white tracking-tight">WNM Helper</h1>
          </div>
          <p className="text-emerald-400/60 text-[10px] mt-1 font-bold uppercase tracking-widest">v2.4.0 • Major Projects #42</p>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="text-emerald-400/60 hover:text-white p-2 bg-emerald-900/30 rounded border border-emerald-800/50 hover:bg-emerald-800 transition-colors"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <div className="px-6 mb-8 flex justify-center">
        <label className="relative group cursor-pointer border-2 border-dashed border-emerald-800 rounded-full w-20 h-20 flex items-center justify-center overflow-hidden bg-brand-rich hover:border-emerald-500 transition-colors">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </label>
      </div>
      
      <nav className="flex-1 px-4 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <div className="text-emerald-500 text-[10px] uppercase tracking-widest font-black mb-3 px-2">{group.title}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-md transition-all text-sm font-medium",
                      isActive ? "bg-emerald-800 text-white shadow-sm" : "text-emerald-100/60 hover:bg-emerald-800/40 hover:text-white"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-emerald-800 text-center">
        <button className="text-emerald-300 font-bold text-xs hover:text-white transition-colors uppercase tracking-widest border border-emerald-700 w-full py-2 rounded mb-2 hover:bg-emerald-800" onClick={() => logout()}>
          Sign Out
        </button>
        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-4 mb-2">
          Last Sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </aside>
  );
};

const Header = () => {
  const { darkMode, setDarkMode, profilePhoto, setProfilePhoto, plots, user, logout } = React.useContext(AppContext);
  const thirstyPlots = plots.filter(p => p.moisture < 40);
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target.result as string;
          setProfilePhoto(url);
          if (user) {
            try {
              const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
              await updateDoc(doc(db, 'users', user.uid), {
                photoURL: url,
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Failed to save profile photo:", err);
            }
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Site:</span>
          <span className="font-black text-slate-800 dark:text-white">St. Thomas Central</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Field Health:</span>
          <span className={cn(
            "flex items-center gap-1.5 font-bold",
            thirstyPlots.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              thirstyPlots.length > 0 ? "bg-amber-500" : "bg-emerald-500"
            )} />
            {thirstyPlots.length > 0 ? `${thirstyPlots.length} Plots Need Water` : "Optimal"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-bold text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div className="text-slate-400 text-[10px] font-bold uppercase">Day 114 of Season Cycle</div>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="lg:hidden w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <label className="lg:hidden relative group cursor-pointer w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-4 h-4 text-slate-400" />
          )}
          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
        </label>
        <button 
          onClick={() => logout()}
          className="lg:hidden w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors cursor-pointer active:scale-95"
          title="Sign Out"
        >
          <LogOut size={14} />
        </button>
        <div className="hidden lg:flex w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center">
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

const MobileNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'tank', label: 'Tank', icon: Container },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'ai', label: 'AI', icon: Leaf },
    { id: 'devices', label: 'Devices', icon: Radio },
  ];

  return (
    <nav className="lg:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 fixed bottom-0 left-0 right-0 z-50 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// --- Helper Functions ---

const calculateGrowthProgress = (plantingDate: string, growthCycleDays: number) => {
  const start = new Date(plantingDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const progress = Math.min(100, Math.max(0, (diffDays / growthCycleDays) * 100));
  return {
    percentage: Math.round(progress),
    currentDay: diffDays,
    totalDays: growthCycleDays
  };
};

// --- Tank Water Tracker Component ---
const TankWaterTracker = ({ onLogView, percentage = 65, remainingGal = 422 }: { onLogView?: () => void, percentage?: number, remainingGal?: number }) => {
  const { weatherData, addSystemLog } = React.useContext(AppContext);
  const [rainRefill, setRainRefill] = useState(0);

  // Weather codes > 48 in OpenMeteo represent rainy, showery, or stormy conditions
  const isRaining = weatherData?.current?.precipitation > 0 || (weatherData?.current?.weather_code && weatherData.current.weather_code > 48);

  // Memoize raindrops to avoid recreating them on every render
  const raindrops = React.useMemo(() => {
    return [...Array(6)].map((_, i) => ({
      delay: Math.random() * 0.5,
      duration: 0.5 + Math.random() * 0.5
    }));
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRaining) {
      interval = setInterval(() => {
         setRainRefill(prev => prev + 2.5); // Add a constant amount so it's noticeably moving
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRaining]);

  useEffect(() => {
    let logInterval: any;
    if (isRaining) {
      logInterval = setInterval(() => {
        addSystemLog({
          type: 'Observation', // or we could use 'Refill' but 'Observation' is in the defined literal types 
          value: 'Rainfall',
          date: new Date().toISOString().split('T')[0],
          notes: `Automated Water Tracking: Main Tank refilled by approx 10 gallons due to current weather precipitation in St. Thomas.`
        });
      }, 15000); // Log every 15 seconds during rainfall
    }
    return () => clearInterval(logInterval);
  }, [isRaining, addSystemLog]);

  const actualRemaining = Math.min(650, remainingGal + Math.floor(rainRefill));
  const actualPercentage = (actualRemaining / 650) * 100;
  const level = Math.round(actualPercentage);

  const levelStatus = level > 75 ? 'Full' : level > 25 ? 'Half' : 'Low';
  const colorClass = level > 75 ? 'text-blue-500' : level > 25 ? 'text-blue-400' : 'text-red-500';
  const bgColorClass = level > 75 ? 'bg-blue-500' : level > 25 ? 'bg-blue-400' : 'bg-red-500';

  return (
    <div className="stat-card h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Main Tank</h2>
          <div className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{levelStatus} ({level}%)</div>
        </div>
        {onLogView && (
          <button 
            onClick={onLogView}
            className="text-[9px] font-black uppercase text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors tracking-widest"
          >
            Tank Logs
          </button>
        )}
      </div>

      <div className="flex items-center justify-center py-2 flex-1 relative">
        {isRaining && (
           <div className="absolute top-0 bottom-12 w-32 pointer-events-none flex justify-around opacity-60 z-30">
             {raindrops.map((drop, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 80, opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: drop.duration, delay: drop.delay }}
                  className="w-[2px] h-3 bg-blue-500 rounded-full"
                />
             ))}
           </div>
        )}
        <div className="relative w-24 h-32 border-4 border-slate-200 rounded-t-sm rounded-b-xl overflow-hidden bg-white shadow-inner flex items-end justify-center z-10">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${level}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className={`w-full relative ${bgColorClass} opacity-80`}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 animate-pulse"></div>
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="absolute bottom-6 right-4 w-1 h-1 rounded-full bg-white/30" />
            <div className="absolute top-4 left-6 w-1.5 h-1.5 rounded-full bg-white/30" />
          </motion.div>
          
          <div className="absolute left-0 top-0 bottom-0 w-2 border-r border-slate-200 flex flex-col justify-between py-1 opacity-50 z-20">
            <div className="w-1.5 h-[1px] bg-slate-400 ml-0.5"></div>
            <div className="w-1 h-[1px] bg-slate-400 ml-0.5"></div>
            <div className="w-1.5 h-[1px] bg-slate-400 ml-0.5"></div>
            <div className="w-1 h-[1px] bg-slate-400 ml-0.5"></div>
            <div className="w-1.5 h-[1px] bg-slate-400 ml-0.5"></div>
          </div>
        </div>
      </div>
      
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2 flex flex-col gap-1">
        <span>Current Supply: {actualRemaining} gal</span>
        <span>Estimated: {Math.max(1, Math.round(actualRemaining / 25))} Days</span>
        {isRaining && <span className="text-blue-500 animate-pulse">Refilling from rainfall...</span>}
      </div>
    </div>
  );
};

// --- Tank View Component ---
const TankView = ({ onLogView }: { onLogView?: () => void }) => {
  const { plots } = React.useContext(AppContext);
  
  // Calculate stats from MOCK_LOGS 
  const irrigationLogs = MOCK_LOGS.filter(log => log.type === 'Irrigation');
  
  const plotUsage: Record<string, number> = {};
  let totalUsage = 0;
  
  irrigationLogs.forEach(log => {
    // Parse the value, e.g., "15gal"
    const amount = parseInt(log.value.replace(/[^0-9]/g, ''), 10) || 0;
    if (log.plotId) {
      if (!plotUsage[log.plotId]) plotUsage[log.plotId] = 0;
      plotUsage[log.plotId] += amount;
    }
    totalUsage += amount;
  });
  
  const tankCapacity = 650;
  const remainingGal = tankCapacity - (totalUsage % tankCapacity);
  const percentage = (remainingGal / tankCapacity) * 100;

  const usageArray = Object.entries(plotUsage)
    .map(([plotId, amount]) => {
      const plot = plots.find(p => p.id === plotId);
      return {
        plotId,
        name: plot ? plot.name : `Plot ${plotId}`,
        crop: plot ? plot.crop : 'Unknown',
        amount
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const highestPlot = usageArray.length > 0 ? usageArray[0] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto h-full">
      <div className="lg:w-1/3">
        <TankWaterTracker percentage={percentage} remainingGal={remainingGal} onLogView={onLogView} />
      </div>
      <div className="lg:w-2/3 flex flex-col gap-6">
        <div className="stat-card">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Tank Overview</h2>
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 border border-slate-100 rounded bg-slate-50">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Capacity</div>
               <div className="text-2xl font-black text-slate-800">650 <span className="text-sm text-slate-500">gal</span></div>
             </div>
             <div className="p-4 border border-slate-100 rounded bg-slate-50">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Dispensed All Time</div>
               <div className="text-2xl font-black text-blue-600">{totalUsage} <span className="text-sm text-blue-400">gal</span></div>
             </div>
           </div>
        </div>
        
        <div className="stat-card flex-1">
           <div className="flex justify-between items-end mb-6">
             <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Water Usage by Plot</h2>
             {highestPlot && (
               <div className="text-xs font-bold text-slate-500">
                 Highest: <span className="text-red-500">{highestPlot.name}</span> ({highestPlot.amount} gal)
               </div>
             )}
           </div>
           
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
             {usageArray.map((plot, i) => (
                <div key={plot.plotId} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 text-xs font-black text-slate-400 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                       <div className="text-sm font-bold text-slate-800">{plot.name} <span className="text-xs font-medium text-slate-500">({plot.crop})</span></div>
                       <div className="text-sm font-black text-blue-600">{plot.amount} <span className="text-xs text-blue-400">gal</span></div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.max(2, (plot.amount / (highestPlot ? highestPlot.amount : 1)) * 100)}%` }}
                         className={cn("h-full rounded", i === 0 ? "bg-red-400" : "bg-blue-400")}
                       />
                    </div>
                  </div>
                </div>
             ))}
             {usageArray.length === 0 && (
                <div className="text-sm text-slate-500 py-4 text-center">No irrigation logs available yet.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

const DashboardGrid = ({ onPlotClick, onLogView }: { onPlotClick: (plotId: string) => void, onLogView?: () => void }) => {
  const { plots } = React.useContext(AppContext);
  
  if (plots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Active Plots</h2>
        <p className="text-sm text-slate-500">Your farm dashboard will be populated here once plots are configured.</p>
      </div>
    );
  }

  return (
  <div className="space-y-6">
    <div>
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Current Conditions</h2>
      <LiveWeather horizontal />
    </div>

    <div className="flex justify-between items-end px-1">
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Crop Monitoring</h2>
      <button className="text-blue-600 font-bold text-xs hover:underline">Full Mapping</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plots.map((plot) => {
        const growth = calculateGrowthProgress(plot.plantingDate, plot.growthCycleDays);
        return (
          <div 
            key={plot.id} 
            className="stat-card cursor-pointer hover:border-emerald-200 transition-colors group"
            onClick={() => onPlotClick(plot.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{plot.name}</div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 italic font-medium uppercase tracking-wider">{plot.crop}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                      plot.cropType === 'mixed' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {plot.cropType === 'mixed' ? 'Mixed' : 'Mono'}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Planted: {new Date(plot.plantingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <span className={cn(
                "tag",
                plot.status === 'optimal' ? "tag-green" :
                plot.status === 'warning' ? "tag-amber" : "tag-red"
              )}>{plot.status}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold border-y border-slate-50 dark:border-slate-800/50 py-3 my-2 bg-slate-50/30 dark:bg-slate-800/30 rounded-md px-2">
              <div className="flex justify-between border-r border-slate-100 pr-2">
                <span className="text-slate-400">Moisture:</span> 
                <span className={cn(plot.moisture < 40 ? "text-amber-600" : "text-emerald-600")}>{plot.moisture}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nitrogen:</span> 
                <span className="text-slate-700">{plot.nitrogen}</span>
              </div>
              <div className="flex justify-between border-r border-slate-100 pr-2">
                <span className="text-slate-400">Phosphorus:</span> 
                <span className="text-slate-700">{plot.phosphorus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Potassium:</span> 
                <span className="text-slate-700">{plot.potassium}</span>
              </div>
            </div>

            {plot.moisture < 40 && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-100 rounded flex items-center gap-2">
                <HumidityIcon className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Crop will need water soon</span>
              </div>
            )}
            
            <div className="mb-3 bg-slate-50/50 dark:bg-slate-800/50 rounded p-2">
              <span className="text-[9px] font-black uppercase text-slate-400 mb-1 block">7-Day Moisture Trend</span>
              <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={plot.moistureHistory}>
                    <YAxis type="number" domain={[0, 100]} hide />
                    <Line 
                      type="monotone" 
                      dataKey="level" 
                      stroke={plot.moisture < 40 ? "#F59E0B" : "#059669"} 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-1">
              <span>Growth Progress (Day {growth.currentDay})</span>
              <span className="text-slate-600">{growth.percentage}%</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${growth.percentage}%` }} />
            </div>
            
            <div className="mt-3 text-center">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                View AI Insights →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  );
};

const LiveWeather = ({ horizontal = false }: { horizontal?: boolean }) => {
  const { weatherData: data } = React.useContext(AppContext);

  const getWeatherInfo = (code: number) => {
    if (code === 0) return { label: "Clear Sky", icon: Sun, color: "text-amber-300" };
    if (code <= 3) return { label: "Partly Cloudy", icon: Cloud, color: "text-blue-200" };
    if (code <= 48) return { label: "Foggy", icon: Cloud, color: "text-slate-300" };
    if (code <= 67) return { label: "Rainy", icon: CloudRain, color: "text-blue-300" };
    if (code <= 82) return { label: "Showers", icon: CloudRain, color: "text-blue-400" };
    if (code <= 99) return { label: "Stormy", icon: CloudLightning, color: "text-purple-300" };
    return { label: "Cloudy", icon: Cloud, color: "text-blue-200" };
  };

  if (!data || !data.current || !data.daily) return <div className={cn("stat-card bg-blue-900 animate-pulse rounded-lg", horizontal ? "h-24" : "h-32")} />;

  const info = getWeatherInfo(data.current.weather_code);
  const WeatherIcon = info.icon;

  return (
    <div className={cn("bg-blue-900 text-white rounded-lg shadow-inner overflow-hidden relative group p-5 flex flex-col gap-4", horizontal && "md:p-4")}>
      <div className={cn("absolute top-0 right-0 p-2 opacity-10 rotate-12 group-hover:scale-110 transition-all duration-500", info.color)}>
        <WeatherIcon className={cn("w-32 h-32 md:w-48 md:h-48")} />
      </div>
      
      <div className={cn("relative z-10 flex flex-col md:flex-row gap-4", horizontal ? "md:items-center md:justify-between" : "")}>
        <div className="flex items-center gap-4">
          <span className="text-4xl sm:text-5xl font-black tracking-tighter">{Math.round(data.current.temperature_2m)}°</span>
          <span className="text-[10px] sm:text-xs text-blue-200 uppercase font-black tracking-widest leading-tight">
            {info.label}<br/>
            <span className="text-blue-400">Current</span>
          </span>
        </div>

        <div className={cn("grid grid-cols-3 gap-2 text-[9px] text-center font-black", horizontal ? "md:flex-1 md:max-w-xs" : "mt-2")}>
          <div className="bg-blue-800/60 p-2 px-3 rounded backdrop-blur-sm flex flex-col items-center gap-1">
            <HumidityIcon className="w-3 h-3 text-blue-300" />
            <span className="text-blue-200 text-[8px] uppercase">Humidity</span>
            {data.current.relative_humidity_2m}%
          </div>
          <div className="bg-blue-800/60 p-2 px-3 rounded backdrop-blur-sm flex flex-col items-center gap-1">
            <Wind className="w-3 h-3 text-blue-300" />
            <span className="text-blue-200 text-[8px] uppercase">Wind</span>
            {Math.round(data.current.wind_speed_10m)}k/h
          </div>
          <div className="bg-blue-800/60 p-2 px-3 rounded backdrop-blur-sm flex flex-col items-center gap-1">
            <CloudRain className="w-3 h-3 text-blue-300" />
            <span className="text-blue-200 text-[8px] uppercase">Precip</span>
            {data.current.precipitation}mm
          </div>
        </div>
        
        <div className={cn("hidden lg:flex flex-col items-end gap-1 relative z-10", horizontal ? "" : "hidden")}>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-tight">St. Thomas Live</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-800/60 rounded text-[8px] border border-blue-700/50">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
            ACTIVE
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10 pt-4 border-t border-blue-800/50">
        {data.daily.time.slice(0, 5).map((time: string, i: number) => {
          const dInfo = getWeatherInfo(data.daily.weather_code[i]);
          const DIcon = dInfo.icon;
          const dayName = new Date(time + "T12:00:00Z").toLocaleDateString(undefined, { weekday: 'short' });
          return (
            <div key={time} className="flex flex-col items-center gap-1.5 bg-blue-800/40 p-2 rounded backdrop-blur-sm">
              <span className="text-blue-200 text-[9px] uppercase font-bold">{i === 0 ? 'Today' : dayName}</span>
              <DIcon className={cn("w-4 h-4 sm:w-5 sm:h-5", dInfo.color)} />
              <div className="flex gap-1.5 text-[10px] sm:text-[11px] font-black">
                <span>{Math.round(data.daily.temperature_2m_max[i])}°</span>
                <span className="text-blue-400">{Math.round(data.daily.temperature_2m_min[i])}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- View Containers (preserving original components' logic) ---

interface AIRecommendation {
  summary: string;
  plots: {
    id: string;
    name: string;
    primaryNeed: string;
    urgency: number;
    recommendation: string;
  }[];
}

const AIAdvisorWrapper = ({ targetPlotId }: { targetPlotId?: string | null }) => {
  const { plots } = React.useContext(AppContext);
  const [data, setData] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      // Filter plots if one is selected
      const plotsToAnalyze = targetPlotId 
        ? plots.filter(p => p.id === targetPlotId)
        : plots.slice(0, 5); // limit analysis 
      
      if (plotsToAnalyze.length === 0) {
        setLoading(false);
        return;
      }
      
      const cachedWeather = sessionStorage.getItem('weatherData');
      const weatherData = cachedWeather ? JSON.parse(cachedWeather) : null;
      
      const res = await getAIRecommendations(MOCK_NUTRIENTS, plotsToAnalyze, weatherData);
      setData(res);
      setLoading(false);
    };
    fetchInsight();
  }, [targetPlotId, plots]);

  const activePlot = targetPlotId ? plots.find(p => p.id === targetPlotId) : null;

  const chartData = activePlot ? [
    { name: 'Nitrogen', level: activePlot.nitrogen, optimal: 60 },
    { name: 'Phosphorus', level: activePlot.phosphorus, optimal: 35 },
    { name: 'Potassium', level: activePlot.potassium, optimal: 70 },
    { name: 'Moisture', level: activePlot.moisture, optimal: 60 }
  ] : MOCK_NUTRIENTS;

  const handleSpeak = async () => {
    if (speaking || !data) return;
    setSpeaking(true);
    const base64Data = await getAIAudio(data.summary);
    
    if (base64Data) {
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // PCM data is 16-bit little-endian
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buffer = audioCtx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          setSpeaking(false);
          audioCtx.close();
        };
        source.start();
      } catch (e) {
        console.error("Playback error:", e);
        setSpeaking(false);
      }
    } else {
      setSpeaking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="stat-card p-6 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-slate-900/50">
        <div className="flex justify-between items-center mb-6 border-b border-emerald-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-3">
            {activePlot && (
              <CropImage crop={activePlot.crop} size="sm" className="shadow-none border-0" />
            )}
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              {activePlot ? `Smart Helper: ${activePlot.name}` : 'Field-Wide Smart Helper'}
            </h3>
          </div>
          {targetPlotId && (
            <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded tracking-widest uppercase">
              Plot Focused
            </span>
          )}
        </div>
        
        <div className="h-64 w-full mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-50 dark:border-slate-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 dark:bg-emerald-900/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECFDF5" />
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 800, fill: '#059669' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(167, 243, 208, 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-2 border border-emerald-200 dark:border-slate-700 shadow-xl rounded text-[10px] font-bold">
                        <div className="text-emerald-800 dark:text-emerald-400 mb-1">{data.name}</div>
                        <div className="text-emerald-600">Level: {data.level}%</div>
                        <div className="text-slate-400 text-[8px]">Optimal: {data.optimal}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="level" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.level >= entry.optimal ? '#059669' : '#F59E0B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!loading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {data.plots.map((p) => (
              <div key={p.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-50 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l" />
                <div>
                  <div className="flex justify-between items-center mb-2 pl-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{p.name} Helper</span>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                      p.urgency > 70 ? "bg-red-100 text-red-600" : (p.urgency > 40 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")
                    )}>
                      Need: {p.primaryNeed}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic pl-2">
                    "{p.recommendation}"
                  </p>
                </div>
                <div className="mt-3 pl-2">
                  <div className="text-[9px] font-black uppercase text-slate-400 mb-1 flex justify-between">
                    <span>Urgency Level</span>
                  </div>
                  <div className="progress-bg h-1.5 opacity-50">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", p.urgency > 70 ? "bg-red-500" : (p.urgency > 40 ? "bg-amber-500" : "bg-emerald-500"))}
                      style={{ width: `${p.urgency}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-lg border-2 border-emerald-600 relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 p-3 opacity-20 rotate-12 group-hover:scale-110 transition-transform">
            <Sprout className="w-16 h-16 text-white" />
          </div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 border border-white/30 backdrop-blur-md">
              <Leaf className="w-6 h-6 text-emerald-100" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-2">
                {activePlot ? `${activePlot.name} Tip` : "General Tip"}
              </p>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-white/10 animate-pulse rounded w-1/2" />
                </div>
              ) : (
                <p className="text-[14px] font-medium leading-relaxed italic text-emerald-50">
                  "{data?.summary}"
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end relative z-10">
            <button
              onClick={handleSpeak}
              disabled={loading || speaking}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-wider transition-all",
                speaking 
                  ? "bg-white text-emerald-800 cursor-default shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 active:scale-95 disabled:opacity-50"
              )}
            >
              {speaking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Listening...
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Hear Recommendation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './lib/firebase';
import { OperationType, handleFirestoreError } from './lib/authError';

// --- Digital Logbook Component ---
const DigitalLogbook = () => {
  const { user, systemLogs } = React.useContext(AppContext);
  const [logs, setLogs] = useState<any[]>(MOCK_LOGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // We fetch real logs, but we append MOCK_LOGS for visual purposes for now 
    // to keep the dashboard looking populated until real automation acts.
    const q = query(
      collection(db, 'logs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs([...liveLogs, ...MOCK_LOGS]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    });
    
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Digital Logbook</h2>
        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded tracking-widest uppercase">Auto-Sync Active</span>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {[...systemLogs, ...logs].map(log => (
            <div key={log.id} className="stat-card border-l-4 border-l-slate-200 hover:border-l-brand-rich">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black uppercase text-slate-400">{log.date || (log.createdAt && new Date(log.createdAt.toDate()).toLocaleDateString())}</span>
                <span className="tag tag-slate">{log.type}</span>
              </div>
              <div className="font-black text-slate-800 text-sm">{log.value}</div>
              <div className="text-[11px] text-slate-500">{log.notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Devices Component ---

const DevicesView = () => {
  const devices = React.useMemo(() => {
    const generatedDevices = Array.from({ length: 6 }).flatMap((_, i) => {
      const p = i + 1;
      return [
        {
          id: `MST-P${p}-A`,
          name: `Soil Moisture Node A`,
          status: "online",
          battery: 80 + (p * 3) % 20,
          signal: "Excellent",
          location: `Plot ${p} (North/High)`,
          type: "Capacitive Volumetric Water Content",
          lastReading: `${(p * 2) % 15 + 1} mins ago`,
          coverage: "Representative for ~0.25 acres",
          commRange: "Up to 3km (LoRa)"
        },
        {
          id: `MST-P${p}-B`,
          name: `Soil Moisture Node B`,
          status: "online",
          battery: 80 + (p * 7) % 20,
          signal: "Excellent",
          location: `Plot ${p} (South/Low)`,
          type: "Capacitive Volumetric Water Content",
          lastReading: `${(p * 3) % 15 + 2} mins ago`,
          coverage: "Representative for ~0.25 acres",
          commRange: "Up to 3km (LoRa)"
        },
        {
          id: `NPK-P${p}-A`,
          name: `Nutrient Sensor Node A`,
          status: "online",
          battery: 70 + (p * 5) % 30,
          signal: "Excellent",
          location: `Plot ${p} (North/High)`,
          type: "Ion-selective NPK",
          lastReading: `${(p * 4) % 15 + 1} mins ago`,
          coverage: "Representative for ~0.25 acres",
          commRange: "Up to 3km (LoRa)"
        },
        {
          id: `NPK-P${p}-B`,
          name: `Nutrient Sensor Node B`,
          status: "online",
          battery: 70 + (p * 11) % 30,
          signal: "Excellent",
          location: `Plot ${p} (South/Low)`,
          type: "Ion-selective NPK",
          lastReading: `${(p * 5) % 15 + 3} mins ago`,
          coverage: "Representative for ~0.25 acres",
          commRange: "Up to 3km (LoRa)"
        }
      ];
    });

    return [
      {
        id: "GW-001",
        name: "Edge Gateway",
        status: "online",
        battery: 100, // Mains powered
        signal: "Excellent",
        location: "Farm House Roof",
        type: "LoRaWAN Base Station & Edge Compute Node",
        lastReading: "processing raw data...",
        coverage: "Entire farm (Aggregation)",
        commRange: "Up to 15km line-of-sight"
      },
      ...generatedDevices
    ];
  }, []);

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            Sensor Network & Edge Compute
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">IoT sensors feed data to an on-site Edge Gateway for local filtering and immediate analysis before interacting with the cloud.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {onlineCount} Online
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {warningCount} Warning
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="stat-card p-5 group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-lg",
                    device.id.startsWith("GW") ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {device.id.startsWith("GW") ? <Wifi className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-emerald-600 transition-colors">{device.name}</h3>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{device.id}</div>
                  </div>
                </div>
                <span className={cn(
                  "tag",
                  device.status === 'online' ? "tag-optimal" : "tag-warning"
                )}>
                  {device.status}
                </span>
              </div>
              
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                <div><strong className="text-slate-700 dark:text-slate-300">Type:</strong> {device.type}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Location:</strong> {device.location}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Coverage:</strong> {device.coverage}</div>
                <div><strong className="text-slate-700 dark:text-slate-300">Comm Range:</strong> {device.commRange}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Activity className="w-3.5 h-3.5" />
                  {device.signal}
                </div>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1">
                <Loader2 className={cn("w-3 h-3", device.status === 'online' ? "animate-spin text-emerald-500" : "text-amber-500")} />
                {device.lastReading}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Compare Component ---

const ComparePlots = () => {
  const { plots } = React.useContext(AppContext);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<number>(7); // days
  
  useEffect(() => {
    if (plots.length >= 2 && selectedIds.length === 0) {
      setSelectedIds([plots[0].id, plots[1].id]);
    }
  }, [plots]);

  const togglePlot = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectedPlots = plots.filter(p => selectedIds.includes(p.id));

  const chartData = [
    { name: 'Moisture (%)', ...Object.fromEntries(selectedPlots.map(p => [p.name, p.moisture])) },
    { name: 'Nitrogen (mg/kg)', ...Object.fromEntries(selectedPlots.map(p => [p.name, p.nitrogen])) },
    { name: 'Phosphorus (mg/kg)', ...Object.fromEntries(selectedPlots.map(p => [p.name, p.phosphorus])) },
    { name: 'Potassium (mg/kg)', ...Object.fromEntries(selectedPlots.map(p => [p.name, p.potassium])) }
  ];

  // Dynamically generate growth history for the selected range
  const generatedHistories = selectedPlots.map(plot => {
    const mainHistory = generateGrowthHistoryRange(plot.plantingDate, plot.growthCycleDays, timeRange);
    let secondaryHistory = null;
    if (plot.cropType === 'mixed' && plot.secondaryGrowthCycleDays) {
      secondaryHistory = generateGrowthHistoryRange(plot.plantingDate, plot.secondaryGrowthCycleDays, timeRange);
    }
    return { mainHistory, secondaryHistory };
  });

  const daysRow = generatedHistories.length > 0 ? generatedHistories[0].mainHistory.map(h => h.day) : [];
  const growthChartData = daysRow.map((day, i) => {
    const dataPoint: any = { day };
    selectedPlots.forEach((plot, plotIndex) => {
      const history = generatedHistories[plotIndex];
      if (history.mainHistory && history.mainHistory[i]) {
        if (plot.cropType === 'mixed' && history.secondaryHistory && history.secondaryHistory[i]) {
          const crops = plot.crop.split(' & ');
          dataPoint[`${plot.name} (${crops[0] || 'Crop 1'})`] = history.mainHistory[i].level;
          dataPoint[`${plot.name} (${crops[1] || 'Crop 2'})`] = history.secondaryHistory[i].level;
        } else {
          dataPoint[plot.name] = history.mainHistory[i].level;
        }
      }
    });
    return dataPoint;
  });

  const COLORS = ['#059669', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6'];

  const timeRanges = [
    { label: '7 Days', value: 7 },
    { label: '1 Month', value: 30 },
    { label: '2 Months', value: 60 },
    { label: '3 Months', value: 90 }
  ];

  return (
    <div className="space-y-6">
      <div className="stat-card p-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Select Plots to Compare</h3>
        <div className="flex flex-wrap gap-2">
          {plots.map(plot => (
            <button
              key={plot.id}
              onClick={() => togglePlot(plot.id)}
              className={cn(
                "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedIds.includes(plot.id) 
                  ? "bg-slate-800 dark:bg-slate-100 border-slate-800 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {plot.name}
            </button>
          ))}
        </div>
      </div>

      {selectedPlots.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="stat-card p-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Nutrient & Moisture Comparison</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 800, color: '#64748b' }} />
                    {selectedPlots.map((p, i) => (
                      <Bar key={p.id} dataKey={p.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stat-card p-6 flex flex-col">
              <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Growth Rate</h3>
                <div className="flex gap-1">
                  {timeRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value)}
                      className={cn(
                        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-colors",
                        timeRange === range.value
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-72 w-full flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthChartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value}%`, 'Growth']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 800, color: '#64748b' }} />
                    {selectedPlots.flatMap((p, i) => {
                      if (p.cropType === 'mixed' && p.secondaryGrowthHistory) {
                        const crops = p.crop.split(' & ');
                        return [
                          <Line key={`${p.id}-1`} name={`${p.name} (${crops[0] || 'Crop 1'})`} type="monotone" dataKey={`${p.name} (${crops[0] || 'Crop 1'})`} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />,
                          <Line key={`${p.id}-2`} name={`${p.name} (${crops[1] || 'Crop 2'})`} type="monotone" dataKey={`${p.name} (${crops[1] || 'Crop 2'})`} stroke={COLORS[(i + 1) % COLORS.length]} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        ];
                      }
                      return [
                        <Line key={p.id} name={p.name} type="monotone" dataKey={p.name} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      ];
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedPlots.map(plot => {
               const growth = calculateGrowthProgress(plot.plantingDate, plot.growthCycleDays);
               return (
                <div key={plot.id} className="stat-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-black text-slate-800">{plot.name}</div>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 italic font-medium uppercase tracking-wider">{plot.crop}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                            plot.cropType === 'mixed' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {plot.cropType === 'mixed' ? 'Mixed' : 'Mono'}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          Planted: {new Date(plot.plantingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      "tag",
                      plot.status === 'optimal' ? "tag-optimal" :
                      plot.status === 'warning' ? "tag-warning" : "tag-critical"
                    )}>{plot.status}</span>
                  </div>
                  
                  <div className="space-y-2 text-[10px] font-bold border-y border-slate-50 dark:border-slate-800/50 py-3 my-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-md px-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Moisture:</span> 
                      <span className={cn(plot.moisture < 40 ? "text-amber-600" : "text-emerald-600")}>{plot.moisture}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nitrogen:</span> 
                      <span className="text-slate-700">{plot.nitrogen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phosphorus:</span> 
                      <span className="text-slate-700">{plot.phosphorus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potassium:</span> 
                      <span className="text-slate-700">{plot.potassium}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-1">
                    <span>Growth (Day {growth.currentDay})</span>
                    <span className="text-slate-600">{growth.percentage}%</span>
                  </div>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${growth.percentage}%` }} />
                  </div>
                </div>
               );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [systemLogs, setSystemLogs] = useState<LogEntry[]>([]);

  const addSystemLog = useCallback((logStr: Omit<LogEntry, 'id'>) => {
    setSystemLogs(prev => [{ ...logStr, id: `sys_log_${Date.now()}` }, ...prev]);
  }, []);

  const [weatherData, setWeatherData] = useState<any | null>(() => {
    const cached = sessionStorage.getItem('weatherData');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=17.8931&longitude=-76.4172&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto");
        const json = await res.json();
        const wd = { current: json.current, daily: json.daily };
        setWeatherData(wd);
        sessionStorage.setItem('weatherData', JSON.stringify(wd));
      } catch (e) {
        console.error("Weather fetch error", e);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        // Initialize plots (only admin gets mock plots for now)
        if (u.email === 'admin@wnmhelper.com' || u.email?.toLowerCase() === 'admin') {
          setPlots(MOCK_PLOTS);
        } else {
          setPlots([]);
        }

        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists() && userDoc.data().photoURL) {
            setProfilePhoto(userDoc.data().photoURL);
          } else {
            setProfilePhoto(null);
          }
        } catch (err) {
          console.error("Failed to load user profile", err);
        }
      } else {
        setPlots([]);
        setProfilePhoto(null);
      }
      setLoadingUser(false);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handlePlotClick = (plotId: string) => {
    setSelectedPlotId(plotId);
    setActiveTab('ai');
  };

  if (loadingUser) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppContext.Provider value={{ darkMode, setDarkMode, profilePhoto, setProfilePhoto, user, logout: handleLogout, plots, weatherData, systemLogs, addSystemLog }}>
      <div className="flex min-h-screen bg-slate-surface text-slate-800 dark:text-slate-200 transition-colors">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            if (tab !== 'ai') setSelectedPlotId(null);
            setActiveTab(tab);
          }} 
        />
        
        <div className="flex-1 flex flex-col relative overflow-x-hidden">
          <Header />
          
          <main className="flex-1 flex p-4 lg:p-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {activeTab === 'home' && <DashboardGrid onPlotClick={handlePlotClick} onLogView={() => setActiveTab('log')} />}
                {activeTab === 'tank' && <TankView onLogView={() => setActiveTab('log')} />}
                {activeTab === 'map' && (
                  <div className="stat-card p-4 sm:p-6 w-full max-w-[50rem] mx-auto flex flex-col h-auto min-h-[600px]">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 sm:mb-6 px-1 flex-shrink-0">Visual Plot Map</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 flex-grow bg-slate-50 dark:bg-slate-900 px-2 py-2 sm:px-4 sm:py-4 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-y-auto">
                      {plots.length > 0 ? plots.map(plot => {
                        const growth = calculateGrowthProgress(plot.plantingDate, plot.growthCycleDays);
                        return (
                          <div 
                            key={plot.id} 
                            onClick={() => handlePlotClick(plot.id)}
                            className={cn(
                              "rounded flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:scale-105 transition-transform",
                              plot.status === 'optimal' ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800" :
                              plot.status === 'warning' ? "bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800" : "bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800"
                            )}>
                            <CropImage crop={plot.crop} className="mb-2" />
                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">{plot.name}</span>
                            <span className="text-[8px] font-bold uppercase text-slate-400">{plot.crop}</span>
                            <span className={cn(
                                "mt-1 text-[7px] font-black uppercase tracking-widest px-1 rounded",
                                plot.cropType === 'mixed' ? "bg-purple-100/50 text-purple-700" : "bg-blue-100/50 text-blue-700"
                            )}>
                              {plot.cropType === 'mixed' ? 'Mixed' : 'Mono'}
                            </span>
                            <span className="mt-1 bg-white/60 dark:bg-slate-800/60 px-1.5 rounded text-[8px] font-black text-slate-600 dark:text-slate-300">{growth.percentage}% Growth</span>
                            <span className="mt-1 text-[8px] text-slate-500 font-bold">Planted: {new Date(plot.plantingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        );
                      }) : (
                        <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                           <span className="text-sm font-bold">No plot data to display on map.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'ai' && <AIAdvisorWrapper targetPlotId={selectedPlotId} />}
                {activeTab === 'compare' && <ComparePlots />}
                {activeTab === 'log' && <DigitalLogbook />}
                {activeTab === 'devices' && <DevicesView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
    </AppContext.Provider>
  );
}
