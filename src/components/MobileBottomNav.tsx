import React from 'react';
import { Layers, BookOpen, PenTool, Sparkles, BarChart3 } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'study' | 'canvas' | 'explorer' | 'analytics';
  setActiveTab: (tab: 'home' | 'study' | 'canvas' | 'explorer' | 'analytics') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems: { id: 'home' | 'study' | 'canvas' | 'explorer' | 'analytics'; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Decks', icon: <Layers className="w-5 h-5" /> },
    { id: 'study', label: 'Study', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'canvas', label: 'Draw', icon: <PenTool className="w-5 h-5" /> },
    { id: 'explorer', label: 'Explorer', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-[#262626] px-2 py-1.5 md:hidden shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                isActive
                  ? 'text-white bg-[#1A1A1A] font-bold border border-[#262626]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`transition transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-mono mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
