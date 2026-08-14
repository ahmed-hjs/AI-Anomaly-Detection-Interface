import React, { useState } from 'react';
import {
  Search, Settings as SettingsIcon, LayoutDashboard, AlertTriangle,
  History as HistoryIcon, Bot, Sparkles
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import RobotSensors from './pages/RobotSensors';
import AIRobot from './pages/AIRobot';
import Alerts from './pages/Alerts';
import HistoryPage from './pages/History';
import Settings from './pages/Settings';
import enovaLogo from './assets/enova-logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'robot', label: 'Robot', icon: Bot },
    { id: 'ai', label: 'AI Robot', icon: Sparkles },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: HistoryIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'robot':
        return <RobotSensors />;
      case 'ai':
        return <AIRobot />;
      case 'alerts':
        return <Alerts />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 p-6 text-white cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img src={enovaLogo} alt="Enova Robotics" className="h-8 w-auto shrink-0 bg-white rounded-md p-1" />
            <span className="font-bold text-lg leading-tight">Robot Anomaly<br/>Platform</span>
          </div>
          
          <nav className="px-4 space-y-1">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 mb-2">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <SettingsIcon size={20} />
            <span className="font-medium">Paramètres</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-white flex items-center justify-between px-8 py-4 border-b border-gray-200 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
