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
  Settings,
  Moon,
  Heart
} from 'lucide-react';
import { DeckInstance } from '../types';

interface NavbarProps {
  activeTab: 'home' | 'study' | 'canvas' | 'explorer' | 'grammarVocab' | 'analytics' | 'dictionary';
  setActiveTab: (tab: 'home' | 'study' | 'canvas' | 'explorer' | 'grammarVocab' | 'analytics' | 'dictionary') => void;
  instances: DeckInstance[];
  activeInstance: DeckInstance | null;
  onSelectInstance: (instance: DeckInstance) => void;
  onOpenCreateInstance: () => void;
  onOpenEditInstance: () => void;
  onOpenImport: () => void;
  streak: number;
  theme: 'dark' | 'pink';
  setTheme: (theme: 'dark' | 'pink') => void;
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
  theme,
  setTheme,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-theme-bg/90 backdrop-blur-xl border-b border-theme-border px-4 lg:px-8 py-3 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo - Nothing OS Style */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-theme-card border border-theme-border flex items-center justify-center text-theme-text font-jp font-bold text-lg group-hover:border-theme-borderLight transition relative">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-primary absolute top-1.5 right-1.5" />
            成
          </div>
          <div>
            <span className="font-extrabold text-lg text-theme-text font-mono tracking-tight">
              SaikouNaru <span className="text-xs font-normal text-theme-textMuted font-jp">最高成</span>
            </span>
            <span className="ml-2 text-[9px] uppercase font-mono font-bold tracking-widest px-1.5 py-0.5 rounded bg-theme-surface text-theme-textMuted border border-theme-border">
              SRS PWA
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Nothing OS Monochrome Pill */}
        <nav className="hidden md:flex items-center gap-1 bg-theme-card p-1 rounded-2xl border border-theme-border">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'home'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Decks
          </button>
          <button
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'study'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Study
          </button>
          <button
            onClick={() => setActiveTab('grammarVocab')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'grammarVocab'
                ? 'bg-white text-black font-bold shadow'
                : 'text-indigo-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Grammar & Vocab
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'dictionary'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FF0033]" />
            JMdict & Revision
          </button>
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'canvas'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Draw
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'explorer'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Kanji
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs transition ${
              activeTab === 'analytics'
                ? 'bg-white text-black font-bold shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        </nav>

        {/* Instance Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#121212] border border-[#262626] text-amber-400 rounded-xl text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{streak}<span className="hidden sm:inline"> Day Streak</span></span>
          </div>

          {/* Deck Instance Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121212] hover:bg-[#1A1A1A] border border-[#262626] rounded-xl text-xs font-medium text-white transition"
            >
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <span className="max-w-[90px] sm:max-w-[130px] truncate font-semibold text-[11px] sm:text-xs">
                {activeInstance ? activeInstance.name : 'Select Instance'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-[85vw] sm:w-64 max-w-xs bg-[#121212] border border-[#262626] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                <div className="px-3 py-2 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
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
                          ? 'bg-white text-black font-bold'
                          : 'text-gray-300 hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <span className="truncate">{inst.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262626] text-gray-300">
                        {inst.jlptLevels.join(', ')}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-[#262626] space-y-1">
                  {activeInstance && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenEditInstance();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-[#1A1A1A] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      Configure Current Instance
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenCreateInstance();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-[#1A1A1A] flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF0033]" />
                    Create New Instance
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom APKG / JSON Import */}
          <button
            onClick={onOpenImport}
            className="p-2 rounded-xl bg-theme-card hover:bg-theme-surface border border-theme-border text-theme-textMuted hover:text-theme-text transition"
            title="Import custom .apkg or .json deck"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'pink' : 'dark')}
            className="p-2 rounded-xl bg-theme-card hover:bg-theme-surface border border-theme-border text-theme-textMuted hover:text-theme-text transition ml-1"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Heart className="w-4 h-4 text-pink-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
