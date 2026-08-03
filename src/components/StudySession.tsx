import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { KanjiCard, DeckInstance, SRSRecord, Rating } from '../types';
import { calculateNextSRS, getPreviewIntervals, createInitialSRSRecord } from '../services/srsAlgorithm';
import { saveSRSRecord, saveReviewLog } from '../services/db';

interface StudySessionProps {
  cards: KanjiCard[];
  activeInstance: DeckInstance;
  srsRecords: Map<string, SRSRecord>;
  onOpenCustomizer: () => void;
  onRefreshRecords: () => void;
  onExitSession?: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  cards,
  activeInstance,
  srsRecords,
  onOpenCustomizer,
  onRefreshRecords,
  onExitSession,
}) => {
  const [queue, setQueue] = useState<KanjiCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeStoryTab, setActiveStoryTab] = useState<'story1' | 'story2'>('story1');

  // Initialize queue once when activeInstance changes or cards load
  useEffect(() => {
    const instanceCards = cards.filter(c => activeInstance.jlptLevels.includes(c.jlpt));
    const now = Date.now();

    const dueCards: KanjiCard[] = [];
    const activeLearningCards: KanjiCard[] = [];
    const unstartedCards: KanjiCard[] = [];
    let startedNewCount = 0;

    for (const card of instanceCards) {
      const rec = srsRecords.get(card.id);
      if (rec) {
        if (rec.phase === 'learning' || rec.phase === 'relearning') {
          activeLearningCards.push(card);
        } else if (rec.due <= now) {
          dueCards.push(card);
        }
        if (rec.repetitions <= 1) {
          startedNewCount++;
        }
      } else {
        unstartedCards.push(card);
      }
    }

    // Limit brand new cards to the remaining daily quota
    const remainingNewQuota = Math.max(0, activeInstance.dailyNewLimit - startedNewCount);
    const selectedNewCards = unstartedCards.slice(0, remainingNewQuota);

    // Initial session queue combining review due cards, active learning cards, and fresh new cards
    const initialQueue = [...dueCards, ...activeLearningCards, ...selectedNewCards];

    setQueue(initialQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, activeInstance.id]);

  const currentCard = queue[currentIndex];
  const currentSRS = currentCard
    ? srsRecords.get(currentCard.id) || createInitialSRSRecord(currentCard.id, activeInstance.id)
    : null;

  const previewIntervals = currentSRS ? getPreviewIntervals(currentSRS) : null;

  // Speak Japanese Kanji / Reading
  const playAudio = useCallback(() => {
    if (!currentCard || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak = currentCard.kanji;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [currentCard]);

  // Handle rating submission
  const handleRating = async (rating: Rating) => {
    if (!currentCard || !currentSRS) return;

    const { record: nextRecord } = calculateNextSRS(currentSRS, rating);

    await saveSRSRecord(nextRecord);
    await saveReviewLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: currentCard.id,
      instanceId: activeInstance.id,
      rating,
      timestamp: Date.now(),
      newInterval: nextRecord.interval,
      newEaseFactor: nextRecord.easeFactor,
    });

    setIsFlipped(false);

    // If card is still in learning phase or failed (Again), re-queue it at the end of current session queue!
    if (nextRecord.phase === 'learning' || nextRecord.phase === 'relearning') {
      setQueue(prevQueue => [...prevQueue, currentCard]);
    }

    if (currentIndex + 1 >= queue.length && nextRecord.phase !== 'learning' && nextRecord.phase !== 'relearning') {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setCurrentIndex(prev => prev + 1);
    onRefreshRecords();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
      if (e.key.toLowerCase() === 's') {
        playAudio();
      }
      if (e.key === 'Escape' && onExitSession) {
        onExitSession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isFlipped, playAudio, onExitSession]);

  const displaySettings = activeInstance.displaySettings;
  const frontVis = displaySettings.front;
  const backVis = displaySettings.back;

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Session Completed!</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-md">
          All due reviews and daily new card limits mastered for{' '}
          <span className="text-indigo-400 font-semibold">{activeInstance.name}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-6 py-3 bg-white text-black font-bold rounded-2xl text-xs transition hover:bg-gray-200 flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Review Queue Again
          </button>
          {onExitSession && (
            <button
              onClick={onExitSession}
              className="px-6 py-3 bg-[#1A1A1A] text-white font-bold rounded-2xl text-xs transition border border-[#262626] hover:bg-[#262626]"
            >
              Return to Decks
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentFaceSettings = isFlipped ? backVis : frontVis;
  const totalPoolCount = cards.filter(c => activeInstance.jlptLevels.includes(c.jlpt)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* 1. Top Compact Control Bar (Zero-Scroll Header) */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-2">
          {onExitSession && (
            <button
              onClick={onExitSession}
              className="p-2 rounded-xl bg-[#121212] hover:bg-[#262626] border border-[#262626] text-gray-400 hover:text-white transition"
              title="Exit Session (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="px-3 py-1 bg-[#121212] border border-[#262626] text-white font-mono font-bold text-xs rounded-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse" />
            {currentIndex + 1} / {queue.length}
          </span>
          <span className="hidden sm:inline-block text-[11px] text-gray-400 bg-[#121212] px-2.5 py-1 rounded-xl border border-[#262626]">
            Pool: <strong className="text-white">{totalPoolCount}</strong> ({activeInstance.jlptLevels.join(', ')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playAudio}
            className="p-2 bg-[#121212] hover:bg-[#262626] border border-[#262626] rounded-xl text-indigo-400 transition"
            title="Audio (S)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#121212] hover:bg-[#262626] border border-[#262626] rounded-xl text-xs font-medium text-gray-300 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Card Display</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Flashcard Viewport (Dynamic Flex Container - 0 Vertical Scroll) */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex-1 my-2 bg-[#121212] border border-[#262626] hover:border-[#404040] rounded-3xl p-4 sm:p-8 flex flex-col justify-between cursor-pointer transition shadow-2xl overflow-hidden relative"
      >
        {/* Card Header Indicator */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 shrink-0">
          <span className="font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
          </span>
          <span>JLPT {currentCard.jlpt} • RTK #{currentCard.rtkNum}</span>
        </div>

        {/* Card Center Content */}
        <div className="my-auto py-2 flex flex-col items-center text-center space-y-4 max-h-full overflow-y-auto">
          {/* Kanji Glyphs (Standard Exam Noto Sans JP Font) */}
          {currentFaceSettings.showKanji && (
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-jp font-bold text-white tracking-widest leading-none drop-shadow-md">
              {currentCard.kanji}
            </h1>
          )}

          {/* Keyword / Meaning */}
          {currentFaceSettings.showKeyword && (
            <div className="text-xl sm:text-2xl font-bold text-indigo-300 tracking-wide">
              {currentCard.keyword}
            </div>
          )}

          {currentFaceSettings.showMeaning && currentCard.meaning !== currentCard.keyword && (
            <div className="text-xs sm:text-sm text-gray-300 max-w-md">
              {currentCard.meaning}
            </div>
          )}

          {/* Onyomi / Kunyomi Readings */}
          {currentFaceSettings.showReadings && (currentCard.onyomi || currentCard.kunyomi) && (
            <div className="flex flex-wrap justify-center gap-4 py-2 border-y border-[#262626] w-full max-w-md">
              {currentCard.onyomi && (
                <div className="text-center">
                  <span className="text-[9px] font-mono uppercase text-indigo-400 block font-bold">
                    Onyomi (音)
                  </span>
                  <span className="text-sm sm:text-base font-medium text-white">{currentCard.onyomi}</span>
                </div>
              )}
              {currentCard.kunyomi && (
                <div className="text-center">
                  <span className="text-[9px] font-mono uppercase text-emerald-400 block font-bold">
                    Kunyomi (訓)
                  </span>
                  <span className="text-sm sm:text-base font-medium text-white">{currentCard.kunyomi}</span>
                </div>
              )}
            </div>
          )}

          {/* Stroke GIF Animation */}
          {currentFaceSettings.showStrokes && currentCard.strokeGif && (
            <div className="p-2 bg-[#1A1A1A] border border-[#262626] rounded-2xl flex flex-col items-center">
              <img
                src={`/strokes/${currentCard.strokeGif}`}
                alt={`${currentCard.kanji} stroke order`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain invert brightness-200"
                onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
              />
            </div>
          )}

          {/* Koohii Stories */}
          {currentFaceSettings.showKoohii && (currentCard.koohii1 || currentCard.koohii2) && (
            <div className="w-full max-w-lg text-left bg-[#1A1A1A] border border-[#262626] rounded-2xl p-3 sm:p-4 text-xs text-gray-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Koohii Story
                </span>
                <div className="flex gap-1">
                  {currentCard.koohii1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStoryTab('story1');
                      }}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        activeStoryTab === 'story1' ? 'bg-indigo-600 text-white' : 'bg-[#262626] text-gray-400'
                      }`}
                    >
                      Story 1
                    </button>
                  )}
                  {currentCard.koohii2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStoryTab('story2');
                      }}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        activeStoryTab === 'story2' ? 'bg-indigo-600 text-white' : 'bg-[#262626] text-gray-400'
                      }`}
                    >
                      Story 2
                    </button>
                  )}
                </div>
              </div>
              <div
                className="leading-relaxed font-sans max-h-24 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: activeStoryTab === 'story1' ? currentCard.koohii1 : currentCard.koohii2 || currentCard.koohii1,
                }}
              />
            </div>
          )}
        </div>

        {/* Flip Hint */}
        <div className="text-center pt-2 border-t border-[#262626] text-[11px] text-gray-500 shrink-0">
          {!isFlipped ? (
            <span className="text-indigo-400 font-semibold flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Tap card or press [Space] to reveal answer
            </span>
          ) : (
            <span>Rate your recall below (Shortcuts: 1, 2, 3, 4)</span>
          )}
        </div>
      </div>

      {/* 3. Bottom Rating Bar (Tactile, 0 Scroll) */}
      <div className="shrink-0 pt-1">
        {isFlipped && previewIntervals ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto animate-fade-in">
            <button
              onClick={() => handleRating(1)}
              className="py-3 px-2 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-red-500/30"
            >
              <span className="text-xs sm:text-sm">Again [1]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[1]}</span>
            </button>

            <button
              onClick={() => handleRating(2)}
              className="py-3 px-2 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-amber-500/30"
            >
              <span className="text-xs sm:text-sm">Hard [2]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[2]}</span>
            </button>

            <button
              onClick={() => handleRating(3)}
              className="py-3 px-2 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-emerald-500/30"
            >
              <span className="text-xs sm:text-sm">Good [3]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[3]}</span>
            </button>

            <button
              onClick={() => handleRating(4)}
              className="py-3 px-2 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-indigo-500/30"
            >
              <span className="text-xs sm:text-sm">Easy [4]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[4]}</span>
            </button>
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-gray-500">
            Tap card to show answer & rating options
          </div>
        )}
      </div>
    </div>
  );
};
