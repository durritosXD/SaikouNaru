import React from 'react';
import { Layers, Plus, BookOpen, Settings, Flame, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { DeckInstance, KanjiCard, SRSRecord } from '../types';

interface DeckLandingPageProps {
  instances: DeckInstance[];
  cards: KanjiCard[];
  srsRecords: Map<string, SRSRecord>;
  onSelectInstance: (instance: DeckInstance) => void;
  onOpenCreateInstance: () => void;
  onOpenEditInstance: (instance: DeckInstance) => void;
  streak: number;
}

export const DeckLandingPage: React.FC<DeckLandingPageProps> = ({
  instances,
  cards,
  srsRecords,
  onSelectInstance,
  onOpenCreateInstance,
  onOpenEditInstance,
  streak,
}) => {
  const now = Date.now();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Spaced Repetition & Kanji Studio
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-jp font-extrabold text-white tracking-tight">
            SaikouNaru <span className="text-indigo-400">最高成</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Select a study deck instance below to begin your daily SRS flashcard session, or create a custom instance tailored to your target JLPT levels.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl text-xs font-bold">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streak} Day Study Streak</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-2xl text-xs font-bold">
              <BookOpen className="w-4 h-4" />
              <span>3,000 Kanji Library Loaded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Instance Tiles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Your Study Decks
          </h2>
          <button
            onClick={onOpenCreateInstance}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            Create Instance
          </button>
        </div>

        {/* Deck Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {instances.map((inst) => {
            const instanceCards = cards.filter((c) => inst.jlptLevels.includes(c.jlpt));
            
            // Calculate due & new counts
            let dueCount = 0;
            let masteredCount = 0;

            for (const c of instanceCards) {
              const rec = srsRecords.get(c.id);
              if (rec) {
                if (rec.due <= now) dueCount++;
                if (rec.phase === 'review' && rec.interval >= 14) masteredCount++;
              }
            }

            const totalCount = instanceCards.length;
            const progressPct = totalCount ? Math.round((masteredCount / totalCount) * 100) : 0;

            return (
              <div
                key={inst.id}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Level Badges & Configure */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {inst.jlptLevels.map((lvl) => (
                        <span
                          key={lvl}
                          className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        >
                          {lvl}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditInstance(inst);
                      }}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                      title="Configure Deck Instance"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {inst.description}
                  </p>

                  {/* Stats Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                      🟢 {dueCount} Reviews Due
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                      🔵 {inst.dailyNewLimit} New/Day
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-gray-400 font-semibold">
                      {totalCount} Total Kanji
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-gray-400">Mastery Progress</span>
                      <span className="text-indigo-400">{masteredCount} / {totalCount} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Study Now Button */}
                <button
                  onClick={() => onSelectInstance(inst)}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <BookOpen className="w-4 h-4" />
                  Study Flashcards Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
            );
          })}

          {/* Create New Instance Tile */}
          <div
            onClick={onOpenCreateInstance}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-3xl p-8 cursor-pointer transition flex flex-col items-center justify-center text-center group min-h-[320px]"
          >
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition mb-3">
              <Plus className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-lg text-white">Create Custom Instance</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Combine specific JLPT levels (N5, N4, N3...), customize card fields, and set custom daily limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
