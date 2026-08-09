import React from 'react';
import { BarChart3, Flame, Trophy, Layers, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { KanjiCard, DeckInstance, SRSRecord, ReviewLog } from '../types';

interface AnalyticsViewProps {
  cards: KanjiCard[];
  activeInstance: DeckInstance;
  srsRecords: Map<string, SRSRecord>;
  reviewLogs: ReviewLog[];
  streak: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  cards,
  activeInstance,
  srsRecords,
  reviewLogs,
  streak,
}) => {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Calculate JLPT progress
  const levelStats = levels.map((lvl) => {
    const totalLevelCards = cards.filter((c) => c.jlpt === lvl);
    const mastered = totalLevelCards.filter((c) => {
      const rec = srsRecords.get(c.id);
      return rec && rec.phase === 'review' && rec.interval >= 14;
    });
    const learning = totalLevelCards.filter((c) => {
      const rec = srsRecords.get(c.id);
      return rec && (rec.phase === 'learning' || (rec.phase === 'review' && rec.interval < 14));
    });

    return {
      level: lvl,
      total: totalLevelCards.length,
      mastered: mastered.length,
      learning: learning.length,
      percentage: totalLevelCards.length
        ? Math.round((mastered.length / totalLevelCards.length) * 100)
        : 0,
    };
  });

  // Calculate total reviews & accuracy
  const totalReviewsCount = reviewLogs.length;
  const correctReviews = reviewLogs.filter((l) => l.rating >= 3).length;
  const accuracy = totalReviewsCount
    ? Math.round((correctReviews / totalReviewsCount) * 100)
    : 100;

  // 30-day activity heatmap grid simulation
  const today = new Date();
  const daysGrid = Array.from({ length: 28 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (27 - i));
    const dateStr = date.toISOString().split('T')[0];
    const reviewsOnDay = reviewLogs.filter((l) => {
      const logDate = new Date(l.timestamp).toISOString().split('T')[0];
      return logDate === dateStr;
    }).length;

    let intensity = 'bg-slate-800/40';
    if (reviewsOnDay > 0) intensity = 'bg-indigo-900/60 border border-indigo-500/40';
    if (reviewsOnDay > 10) intensity = 'bg-indigo-700 border border-indigo-400';
    if (reviewsOnDay > 25) intensity = 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30';

    return { dateStr, count: reviewsOnDay, intensity };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-theme-text flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          SRS Analytics & JLPT Mastery
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Detailed metrics for <span className="text-indigo-400 font-semibold">{activeInstance.name}</span> and overall Japanese progress.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-theme-text">{streak} Days</span>
            <span className="text-xs text-gray-400 block font-medium">Active Daily Streak</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-theme-text">{totalReviewsCount}</span>
            <span className="text-xs text-gray-400 block font-medium">Total Reviews Passed</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-theme-text">{accuracy}%</span>
            <span className="text-xs text-gray-400 block font-medium">Recall Retention Accuracy</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-theme-text">{srsRecords.size}</span>
            <span className="text-xs text-gray-400 block font-medium">Cards in SRS Queue</span>
          </div>
        </div>
      </div>

      {/* JLPT Progress Bars */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
          JLPT Mastery Breakdown
        </h3>

        <div className="space-y-5">
          {levelStats.map((st) => (
            <div key={st.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-theme-text flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    JLPT {st.level}
                  </span>
                  <span>{st.mastered} Mastered / {st.total} Kanji</span>
                </span>
                <span className="font-extrabold text-indigo-400">{st.percentage}%</span>
              </div>

              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500"
                  style={{ width: `${st.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 28-Day Study Heatmap Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          4-Week Activity Heatmap
        </h3>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {daysGrid.map((day) => (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.count} reviews`}
              className={`h-10 rounded-xl flex items-center justify-center text-[10px] font-bold text-theme-text/80 transition transform hover:scale-110 ${day.intensity}`}
            >
              {day.count > 0 ? day.count : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
