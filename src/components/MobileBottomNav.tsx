import React from 'react';
import { BookOpen, PenTool, Sparkles, BarChart3 } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'study' | 'canvas' | 'explorer' | 'analytics';
  setActiveTab: (tab: 'study' | 'canvas' | 'explorer' | 'analytics') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems: { id: 'study' | 'canvas' | 'explorer' | 'analytics'; label: string; icon: React.ReactNode }[] = [
    { id: 'study', label: 'Study', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'canvas', label: 'Draw', icon: <PenTool className="w-5 h-5" /> },
    { id: 'explorer', label: 'Explorer', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 md:hidden shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className={`transition transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
