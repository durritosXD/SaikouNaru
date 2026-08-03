import React from 'react';
import { Layers, Plus, BookOpen, Settings, Flame, Sparkles, ArrowRight } from 'lucide-react';
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
      {/* Nothing OS Minimal Hero Banner */}
      <div className="relative overflow-hidden bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] border border-[#262626] rounded-xl text-white text-xs font-mono font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse" />
            Spaced Repetition & Kanji Studio
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-jp font-extrabold text-white tracking-tight">
            SaikouNaru <span className="text-gray-400 font-normal">最高成</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Select a study deck instance to launch your zero-scroll SRS flashcard session, or configure a custom JLPT deck.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1A1A] border border-[#262626] text-amber-400 rounded-xl text-xs font-mono font-bold">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1A1A] border border-[#262626] text-gray-300 rounded-xl text-xs font-mono font-bold">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>3,000 Kanji Library Loaded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Instance Tiles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2 font-mono">
            <Layers className="w-6 h-6 text-indigo-400" />
            Study Decks
          </h2>
          <button
            onClick={onOpenCreateInstance}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-xl text-xs transition hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            Create Instance
          </button>
        </div>

        {/* Deck Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {instances.map((inst) => {
            const instanceCards = cards.filter((c) => inst.jlptLevels.includes(c.jlpt));
            
            let greenReviewCount = 0;
            let redLearnCount = 0;
            let unstartedCount = 0;
            let startedNewCount = 0;
            let masteredCount = 0;

            for (const c of instanceCards) {
              const rec = srsRecords.get(c.id);
              if (rec) {
                if (rec.phase === 'learning' || rec.phase === 'relearning') {
                  redLearnCount++;
                } else if (rec.phase === 'review' && rec.due <= now) {
                  greenReviewCount++;
                }
                if (rec.phase === 'review' && rec.interval >= 14) {
                  masteredCount++;
                }
                if (rec.repetitions <= 1) {
                  startedNewCount++;
                }
              } else {
                unstartedCount++;
              }
            }

            const blueNewCount = Math.min(unstartedCount, Math.max(0, inst.dailyNewLimit - startedNewCount));
            const totalCount = instanceCards.length;
            const progressPct = totalCount ? Math.round((masteredCount / totalCount) * 100) : 0;

            return (
              <div
                key={inst.id}
                className="group relative bg-[#121212] hover:bg-[#181818] border border-[#262626] hover:border-[#404040] rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Level Badges & Configure */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {inst.jlptLevels.map((lvl) => (
                        <span
                          key={lvl}
                          className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-[#1A1A1A] text-white border border-[#262626]"
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
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-[#262626] rounded-xl transition"
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

                  {/* Anki 3-Color Badge Counters: Blue = New, Red = Learn, Green = Review */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30" title="New Cards">
                      🔵 {blueNewCount} New
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30" title="Learning Cards">
                      🔴 {redLearnCount} Learn
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Review Cards">
                      🟢 {greenReviewCount} Review
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-gray-400">Mastery Progress</span>
                      <span className="text-white font-bold">{masteredCount} / {totalCount} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#000000] rounded-full overflow-hidden border border-[#262626]">
                      <div
                        className="bg-white h-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Study Now Button */}
                <button
                  onClick={() => onSelectInstance(inst)}
                  className="mt-6 w-full py-3 bg-white text-black hover:bg-gray-200 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <BookOpen className="w-4 h-4" />
                  Launch Study Session
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
            );
          })}

          {/* Create New Instance Tile */}
          <div
            onClick={onOpenCreateInstance}
            className="border-2 border-dashed border-[#262626] hover:border-white bg-[#0A0A0A] hover:bg-[#121212] rounded-3xl p-8 cursor-pointer transition flex flex-col items-center justify-center text-center group min-h-[320px]"
          >
            <div className="p-4 bg-[#1A1A1A] border border-[#262626] rounded-2xl text-white group-hover:scale-110 transition mb-3">
              <Plus className="w-8 h-8 text-[#FF0033]" />
            </div>
            <h4 className="font-bold text-lg text-white font-mono">Create Custom Instance</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Combine specific JLPT levels, customize card fields, and set daily limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
