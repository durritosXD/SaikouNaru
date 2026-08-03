import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  PenTool,
  BarChart3,
  Upload,
  Plus,
  ChevronDown,
  Flame,
  Sparkles,
  Settings
} from 'lucide-react';
import { DeckInstance } from '../types';

interface NavbarProps {
  activeTab: 'study' | 'canvas' | 'explorer' | 'analytics';
  setActiveTab: (tab: 'study' | 'canvas' | 'explorer' | 'analytics') => void;
  instances: DeckInstance[];
  activeInstance: DeckInstance | null;
  onSelectInstance: (instance: DeckInstance) => void;
  onOpenCreateInstance: () => void;
  onOpenEditInstance: () => void;
  onOpenImport: () => void;
  streak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  instances,
  activeInstance,
  onSelectInstance,
  onOpenCreateInstance,
  onOpenEditInstance,
  onOpenImport,
  streak,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-jp font-extrabold text-lg shadow-lg shadow-indigo-500/20">
            成
          </div>
          <div>
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400">
              SaikouNaru <span className="text-xs font-normal text-indigo-400">最高成</span>
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SRS PWA
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'study'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Study Flashcards
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'canvas'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Stroke Drawing
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'explorer'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Kanji Explorer
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </nav>

        {/* Instance Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{streak}<span className="hidden sm:inline"> Day Streak</span></span>
          </div>

          {/* Deck Instance Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-white transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="max-w-[90px] sm:max-w-[130px] truncate font-semibold text-[11px] sm:text-xs">
                {activeInstance ? activeInstance.name : 'Select Instance'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-[85vw] sm:w-64 max-w-xs bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Active Deck Instance
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {instances.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => {
                        onSelectInstance(inst);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                        activeInstance?.id === inst.id
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'text-gray-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{inst.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-gray-400">
                        {inst.jlptLevels.join(', ')}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                  {activeInstance && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenEditInstance();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      Configure Current Instance
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenCreateInstance();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-indigo-400 hover:bg-indigo-950/40 flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Instance
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom APKG / JSON Import */}
          <button
            onClick={onOpenImport}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-gray-300 hover:text-white transition"
            title="Import custom .apkg or .json deck"
          >
            <Upload className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
