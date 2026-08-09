import React, { useState } from 'react';
import { Layers, Plus, BookOpen, Settings, Flame, Sparkles, ArrowRight, Trash2, AlertTriangle, X } from 'lucide-react';
import { DeckInstance, AnyCard, SRSRecord } from '../types';

interface DeckLandingPageProps {
  instances: DeckInstance[];
  cards: AnyCard[];
  srsRecords: Map<string, SRSRecord>;
  onSelectInstance: (instance: DeckInstance) => void;
  onOpenCreateInstance: () => void;
  onOpenEditInstance: (instance: DeckInstance) => void;
  onDeleteInstance: (id: string) => void;
  streak: number;
  theme?: 'dark' | 'pink';
}

const FloatingHearts = () => {
  // Generate random hearts across the screen
  const hearts = Array.from({ length: 15 }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 10 + Math.random() * 15;
    const size = 10 + Math.random() * 30;
    const opacity = 0.1 + Math.random() * 0.3;
    
    return (
      <svg 
        key={i}
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-pink-400 absolute animate-float pointer-events-none"
        style={{
          left: `${left}%`,
          bottom: '-50px',
          width: `${size}px`,
          height: `${size}px`,
          opacity: opacity,
          animation: `float ${duration}s ease-in infinite ${delay}s`
        }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    );
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts}
    </div>
  );
};


export const DeckLandingPage: React.FC<DeckLandingPageProps> = ({
  instances,
  cards,
  srsRecords,
  onSelectInstance,
  onOpenCreateInstance,
  onOpenEditInstance,
  onDeleteInstance,
  streak,
  theme,
}) => {
  const now = Date.now();
  const [deletingInstance, setDeletingInstance] = useState<DeckInstance | null>(null);

  const confirmDelete = () => {
    if (!deletingInstance) return;
    onDeleteInstance(deletingInstance.id);
    setDeletingInstance(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in space-y-8 relative">
      {theme === 'pink' && <FloatingHearts />}
      
      {/* Nothing OS Minimal Hero Banner */}
      <div className="relative overflow-hidden bg-theme-card border border-theme-border rounded-3xl p-6 sm:p-10 shadow-2xl transition-colors duration-300">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-theme-surface border border-theme-border rounded-xl text-theme-text text-xs font-mono font-bold uppercase tracking-wider transition-colors duration-300">
            <span className="w-2 h-2 rounded-full bg-theme-primary animate-pulse" />
            Japanese Kanji, Vocab & Grammar Studio
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-jp font-extrabold text-theme-text tracking-tight transition-colors duration-300">
            SaikouNaru <span className="text-theme-textMuted font-normal">最高成</span>
          </h1>
          <p className="text-xs sm:text-sm text-theme-textMuted leading-relaxed transition-colors duration-300">
            Select a study deck instance to launch your zero-scroll SRS session, explore N5–N1 vocabulary & grammar, or configure custom study goals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-theme-surface border border-theme-border text-amber-400 rounded-xl text-xs font-mono font-bold transition-colors duration-300">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-theme-surface border border-theme-border text-indigo-300 rounded-xl text-xs font-mono font-bold transition-colors duration-300">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>3,000 Kanji • 8,398 Vocab • 287 Grammar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Instance Tiles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-theme-text flex items-center gap-2 font-mono">
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
                className="group relative bg-theme-card hover:bg-theme-surface border border-theme-border hover:border-theme-borderLight rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Level Badges & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {inst.jlptLevels.map((lvl) => (
                        <span
                          key={lvl}
                          className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-theme-surface text-theme-text border border-theme-border transition-colors duration-300"
                        >
                          {lvl}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditInstance(inst);
                        }}
                        className="p-1.5 text-gray-400 hover:text-theme-text hover:bg-theme-border rounded-xl transition"
                        title="Configure Deck Instance"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      {instances.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingInstance(inst);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition"
                          title="Delete Deck Instance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-theme-text group-hover:text-theme-primary transition">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-theme-textMuted mt-1 line-clamp-2 leading-relaxed">
                    {inst.description}
                  </p>

                  {/* Anki 3-Color Badge Counters */}
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
                      <span className="text-theme-text font-bold">{masteredCount} / {totalCount} ({progressPct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#000000] rounded-full overflow-hidden border border-theme-border">
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
            className="border-2 border-dashed border-theme-border hover:border-theme-text bg-theme-bg hover:bg-theme-card rounded-3xl p-8 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center group min-h-[320px]"
          >
            <div className="p-4 bg-theme-surface border border-theme-border rounded-2xl text-theme-text group-hover:scale-110 transition mb-3">
              <Plus className="w-8 h-8 text-theme-primary" />
            </div>
            <h4 className="font-bold text-lg text-theme-text font-mono transition-colors duration-300">Create Custom Instance</h4>
            <p className="text-xs text-theme-textMuted mt-1 max-w-xs transition-colors duration-300">
              Combine specific JLPT levels, customize card fields, and set daily limits.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-theme-card border border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                <AlertTriangle className="w-5 h-5" />
                Delete Deck Instance?
              </div>
              <button
                onClick={() => setDeletingInstance(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-theme-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-theme-text">"{deletingInstance.name}"</strong>?
              This will permanently delete all stored SRS review progress, schedules, and stats for this deck from your browser storage.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingInstance(null)}
                className="px-4 py-2 bg-theme-surface hover:bg-theme-border border border-theme-border text-theme-text text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-theme-text text-xs font-bold rounded-xl shadow-lg shadow-red-600/30"
              >
                Delete Deck & Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
