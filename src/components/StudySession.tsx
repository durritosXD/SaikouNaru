import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  RotateCw,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Flame,
  Layers,
  BookOpen
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
}

export const StudySession: React.FC<StudySessionProps> = ({
  cards,
  activeInstance,
  srsRecords,
  onOpenCustomizer,
  onRefreshRecords,
}) => {
  const [queue, setQueue] = useState<KanjiCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeStoryTab, setActiveStoryTab] = useState<'story1' | 'story2'>('story1');

  // Filter cards by JLPT levels of active instance
  useEffect(() => {
    const instanceCards = cards.filter(c => activeInstance.jlptLevels.includes(c.jlpt));
    
    // Sort / Filter due cards & new cards according to SRS schedule
    const now = Date.now();
    const dueCards: KanjiCard[] = [];
    const newCards: KanjiCard[] = [];

    for (const card of instanceCards) {
      const rec = srsRecords.get(card.id);
      if (rec) {
        if (rec.due <= now) {
          dueCards.push(card);
        }
      } else {
        newCards.push(card);
      }
    }

    // Limit new cards to activeInstance.dailyNewLimit
    const selectedNew = newCards.slice(0, activeInstance.dailyNewLimit);
    const combinedQueue = [...dueCards, ...selectedNew];

    setQueue(combinedQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards, activeInstance, srsRecords]);

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

    // Save record to DB
    await saveSRSRecord(nextRecord);

    // Save review log
    await saveReviewLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: currentCard.id,
      instanceId: activeInstance.id,
      rating,
      timestamp: Date.now(),
      newInterval: nextRecord.interval,
      newEaseFactor: nextRecord.easeFactor,
    });

    setCompletedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex + 1 >= queue.length) {
      // Trigger celebrate confetti
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard, isFlipped, playAudio]);

  const displaySettings = activeInstance.displaySettings;
  const frontVis = displaySettings.front;
  const backVis = displaySettings.back;

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white">Daily Queue Mastered!</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-md">
          You have finished all due reviews and new card limits for{' '}
          <span className="text-indigo-400 font-semibold">{activeInstance.name}</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setCompletedCount(0);
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Review Again
          </button>
          <button
            onClick={onOpenCustomizer}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm transition border border-slate-700 flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            Adjust Deck Settings
          </button>
        </div>
      </div>
    );
  }

  const currentFaceSettings = isFlipped ? backVis : frontVis;

  const totalPoolCount = cards.filter(c => activeInstance.jlptLevels.includes(c.jlpt)).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Progress & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-extrabold text-xs rounded-xl">
            Today's Queue: {currentIndex + 1} / {queue.length}
          </span>
          <span className="text-xs text-gray-400 font-medium bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            Total Pool: <strong className="text-white">{totalPoolCount} Kanji</strong> ({activeInstance.jlptLevels.join(', ')})
          </span>
          <span className="text-xs text-gray-400 font-medium">
            JLPT {currentCard.jlpt} • RTK #{currentCard.rtkNum}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Button */}
          <button
            onClick={playAudio}
            className="p-2.5 bg-slate-800/80 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-indigo-400 transition"
            title="Pronounce Japanese (Shortcut: S)"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Quick Customization Drawer Trigger */}
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            Customize Display
          </button>
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer relative min-h-[420px] bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-300 flex flex-col justify-between"
      >
        {/* Top Card Badge */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
            {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
          </span>
          <span className="text-[11px] text-gray-500 italic">Click card or press [Space] to flip</span>
        </div>

        {/* Card Face Content */}
        <div className="my-auto py-6 flex flex-col items-center text-center space-y-6">
          {/* Kanji Display */}
          {currentFaceSettings.showKanji && (
            <div className="relative group">
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-jp font-extrabold text-white tracking-widest leading-none drop-shadow-2xl">
                {currentCard.kanji}
              </h1>
            </div>
          )}

          {/* Keyword / Meaning */}
          {currentFaceSettings.showKeyword && (
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-300 tracking-wide">
              {currentCard.keyword}
            </div>
          )}

          {currentFaceSettings.showMeaning && currentCard.meaning !== currentCard.keyword && (
            <div className="text-sm text-gray-300 max-w-lg">
              {currentCard.meaning}
            </div>
          )}

          {/* Onyomi / Kunyomi Readings */}
          {currentFaceSettings.showReadings && (currentCard.onyomi || currentCard.kunyomi) && (
            <div className="flex flex-wrap justify-center gap-4 py-2 border-y border-slate-800/80 w-full max-w-md">
              {currentCard.onyomi && (
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-0.5">
                    Onyomi (音読み)
                  </span>
                  <span className="text-base font-semibold text-gray-200">{currentCard.onyomi}</span>
                </div>
              )}
              {currentCard.kunyomi && (
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-0.5">
                    Kunyomi (訓読み)
                  </span>
                  <span className="text-base font-semibold text-gray-200">{currentCard.kunyomi}</span>
                </div>
              )}
            </div>
          )}

          {/* Stroke GIF Animation */}
          {currentFaceSettings.showStrokes && currentCard.strokeGif && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Stroke Order GIF
              </span>
              <img
                src={`/strokes/${currentCard.strokeGif}`}
                alt={`${currentCard.kanji} stroke order`}
                className="w-24 h-24 object-contain invert brightness-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Koohii Stories */}
          {currentFaceSettings.showKoohii && (currentCard.koohii1 || currentCard.koohii2) && (
            <div className="w-full max-w-xl text-left bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Koohii Mnemonic Story
                </span>
                <div className="flex gap-1">
                  {currentCard.koohii1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStoryTab('story1');
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        activeStoryTab === 'story1'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-gray-400'
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
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        activeStoryTab === 'story2'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-gray-400'
                      }`}
                    >
                      Story 2
                    </button>
                  )}
                </div>
              </div>
              <div
                className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{
                  __html: activeStoryTab === 'story1' ? currentCard.koohii1 : currentCard.koohii2 || currentCard.koohii1,
                }}
              />
            </div>
          )}

          {/* Sample Vocabulary Words */}
          {currentFaceSettings.showSampleWords && (currentCard.onWords || currentCard.kunWords) && (
            <div className="w-full max-w-xl text-left bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-xs text-gray-300 space-y-2">
              <span className="font-bold text-gray-400 uppercase tracking-wider block">
                Sample Vocabulary
              </span>
              {currentCard.onWords && (
                <div dangerouslySetInnerHTML={{ __html: currentCard.onWords }} />
              )}
              {currentCard.kunWords && (
                <div dangerouslySetInnerHTML={{ __html: currentCard.kunWords }} />
              )}
            </div>
          )}
        </div>

        {/* Flip Prompt Hint */}
        <div className="text-center pt-4 border-t border-slate-800/80 text-xs text-gray-500">
          {!isFlipped ? (
            <span className="text-indigo-400 font-semibold flex items-center justify-center gap-1">
              <Eye className="w-4 h-4" /> Click to reveal answer
            </span>
          ) : (
            <span>Select your recall rating below (Shortcuts: 1, 2, 3, 4)</span>
          )}
        </div>
      </div>

      {/* SRS Rating Buttons Bar */}
      {isFlipped && previewIntervals && (
        <div className="mt-6 grid grid-cols-4 gap-3 animate-fade-in">
          <button
            onClick={() => handleRating(1)}
            className="py-3 sm:py-4 px-2 bg-gradient-to-b from-red-600/90 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/30 flex flex-col items-center justify-center gap-1 transition transform hover:scale-105 active:scale-95 border border-red-400/30"
          >
            <span className="text-sm">Again [1]</span>
            <span className="text-[11px] font-normal opacity-90">{previewIntervals[1]}</span>
          </button>

          <button
            onClick={() => handleRating(2)}
            className="py-3 sm:py-4 px-2 bg-gradient-to-b from-amber-600/90 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-600/30 flex flex-col items-center justify-center gap-1 transition transform hover:scale-105 active:scale-95 border border-amber-400/30"
          >
            <span className="text-sm">Hard [2]</span>
            <span className="text-[11px] font-normal opacity-90">{previewIntervals[2]}</span>
          </button>

          <button
            onClick={() => handleRating(3)}
            className="py-3 sm:py-4 px-2 bg-gradient-to-b from-emerald-600/90 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center gap-1 transition transform hover:scale-105 active:scale-95 border border-emerald-400/30"
          >
            <span className="text-sm">Good [3]</span>
            <span className="text-[11px] font-normal opacity-90">{previewIntervals[3]}</span>
          </button>

          <button
            onClick={() => handleRating(4)}
            className="py-3 sm:py-4 px-2 bg-gradient-to-b from-indigo-600/90 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 flex flex-col items-center justify-center gap-1 transition transform hover:scale-105 active:scale-95 border border-indigo-400/30"
          >
            <span className="text-sm">Easy [4]</span>
            <span className="text-[11px] font-normal opacity-90">{previewIntervals[4]}</span>
          </button>
        </div>
      )}
    </div>
  );
};
