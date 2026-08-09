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
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnyCard, KanjiCard, VocabCard, GrammarCard, DeckInstance, SRSRecord, Rating, ConjugationFormKey } from '../types';
import { calculateNextSRS, getPreviewIntervals, createInitialSRSRecord } from '../services/srsAlgorithm';
import { saveSRSRecord, saveReviewLog } from '../services/db';
import { CONJUGATION_LABELS, getFormValue } from '../services/conjugation';

interface StudySessionProps {
  cards: AnyCard[];
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
  const [queue, setQueue] = useState<AnyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeStoryTab, setActiveStoryTab] = useState<'story1' | 'story2'>('story1');
  const [activeForm, setActiveForm] = useState<ConjugationFormKey>('root');

  // Initialize queue once when activeInstance changes or cards load
  useEffect(() => {
    const instanceCards = cards.filter(c => {
      // Level check
      const levelMatch = activeInstance.jlptLevels.includes(c.jlpt);
      if (!levelMatch) return false;

      // Type check if cardTypes specified
      if (activeInstance.cardTypes && activeInstance.cardTypes.length > 0) {
        return activeInstance.cardTypes.includes(c.type);
      }
      return true;
    });

    const now = Date.now();

    const dueCards: AnyCard[] = [];
    const activeLearningCards: AnyCard[] = [];
    const unstartedCards: AnyCard[] = [];
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
    setActiveForm('root');
  }, [cards, activeInstance.id]);

  const currentCard = queue[currentIndex];
  const currentSRS = currentCard
    ? srsRecords.get(currentCard.id) || createInitialSRSRecord(currentCard.id, activeInstance.id)
    : null;

  const previewIntervals = currentSRS ? getPreviewIntervals(currentSRS) : null;

  // Speak Japanese audio
  const playAudio = useCallback(() => {
    if (!currentCard || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    let textToSpeak = '';
    if (currentCard.type === 'kanji') {
      textToSpeak = (currentCard as KanjiCard).kanji;
    } else if (currentCard.type === 'vocab') {
      const v = currentCard as VocabCard;
      const formVal = getFormValue(v.conjugations, v.kanji || v.reading, v.reading, activeForm);
      textToSpeak = formVal.text;
    } else if (currentCard.type === 'grammar') {
      textToSpeak = (currentCard as GrammarCard).title;
    }
    if (textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentCard, activeForm]);

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
    setActiveForm('root');

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
      <div className="fixed inset-0 z-50 bg-theme-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-theme-primary mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-theme-text">Session Completed!</h2>
        <p className="text-sm text-theme-textMuted mt-2 max-w-md">
          All due reviews and daily new card limits mastered for{' '}
          <span className="text-theme-primary font-semibold">{activeInstance.name}</span>.
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
              className="px-6 py-3 bg-theme-surface text-theme-text font-bold rounded-2xl text-xs transition border border-theme-border hover:bg-theme-border"
            >
              Return to Decks
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate current Anki 3-color queue counts (Blue: New, Red: Learning, Green: Review)
  const remainingQueue = queue.slice(currentIndex);
  let blueNewCount = 0;
  let redLearnCount = 0;
  let greenReviewCount = 0;

  for (const card of remainingQueue) {
    const rec = srsRecords.get(card.id);
    if (!rec || rec.phase === 'new') {
      blueNewCount++;
    } else if (rec.phase === 'learning' || rec.phase === 'relearning') {
      redLearnCount++;
    } else if (rec.phase === 'review') {
      greenReviewCount++;
    }
  }

  const currentFaceSettings = isFlipped ? backVis : frontVis;
  const totalPoolCount = cards.filter(c => activeInstance.jlptLevels.includes(c.jlpt)).length;

  return (
    <div className="fixed inset-0 z-50 bg-theme-bg text-theme-text flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* 1. Top Control Bar with Anki 3-Color Counters */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-theme-border shrink-0">
        <div className="flex items-center gap-2">
          {onExitSession && (
            <button
              onClick={onExitSession}
              className="p-2 rounded-xl bg-theme-card hover:bg-theme-border border border-theme-border text-theme-textMuted hover:text-theme-text transition"
              title="Exit Session (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Anki 3-Color Badges */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl" title="New Cards">
              🔵 {blueNewCount}
            </span>
            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl" title="Learning Cards">
              🔴 {redLearnCount}
            </span>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-theme-primary border border-emerald-500/30 rounded-xl" title="Review Cards">
              🟢 {greenReviewCount}
            </span>
          </div>

          <span className="hidden md:inline-block text-[11px] text-theme-textMuted bg-theme-card px-2.5 py-1 rounded-xl border border-theme-border">
            Pool: <strong className="text-theme-text">{totalPoolCount}</strong> ({activeInstance.jlptLevels.join(', ')})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playAudio}
            className="p-2 bg-theme-card hover:bg-theme-border border border-theme-border rounded-xl text-theme-primary transition"
            title="Audio (S)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-2 bg-theme-card hover:bg-theme-border border border-theme-border rounded-xl text-xs font-medium text-theme-text transition"
          >
            <Sliders className="w-3.5 h-3.5 text-theme-primary" />
            <span className="hidden sm:inline">Card Display</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Flashcard Viewport */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="flex-1 my-2 bg-theme-card border border-theme-border hover:border-theme-borderLight rounded-3xl p-4 sm:p-8 flex flex-col justify-between cursor-pointer transition shadow-2xl overflow-hidden relative"
      >
        {/* Card Header Indicator */}
        <div className="flex items-center justify-between text-[11px] text-theme-textMuted shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-wider text-theme-primary font-bold flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {isFlipped ? 'Answer (Back)' : 'Question (Front)'}
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono text-[9px] uppercase">
              {currentCard.type}
            </span>
          </div>
          <span>JLPT {currentCard.jlpt}</span>
        </div>

        {/* Card Center Content Renderer */}
        <div className="my-auto py-2 flex flex-col items-center text-center space-y-4 max-h-full overflow-y-auto w-full max-w-2xl mx-auto">
          {/* A. KANJI CARD */}
          {currentCard.type === 'kanji' && (() => {
            const kanjiCard = currentCard as KanjiCard;
            return (
              <>
                {currentFaceSettings.showKanji && (
                  <h1 className="text-6xl sm:text-7xl md:text-8xl font-jp font-bold text-theme-text tracking-widest leading-none drop-shadow-md">
                    {kanjiCard.kanji}
                  </h1>
                )}
                {currentFaceSettings.showKeyword && (
                  <div className="text-xl sm:text-2xl font-bold text-indigo-300 tracking-wide">
                    {kanjiCard.keyword}
                  </div>
                )}
                {currentFaceSettings.showMeaning && kanjiCard.meaning !== kanjiCard.keyword && (
                  <div className="text-xs sm:text-sm text-theme-text max-w-md">
                    {kanjiCard.meaning}
                  </div>
                )}
                {currentFaceSettings.showReadings && (kanjiCard.onyomi || kanjiCard.kunyomi) && (
                  <div className="flex flex-wrap justify-center gap-4 py-2 border-y border-theme-border w-full max-w-md">
                    {kanjiCard.onyomi && (
                      <div className="text-center">
                        <span className="text-[9px] font-mono uppercase text-theme-primary block font-bold">Onyomi (音)</span>
                        <span className="text-sm sm:text-base font-medium text-theme-text">{kanjiCard.onyomi}</span>
                      </div>
                    )}
                    {kanjiCard.kunyomi && (
                      <div className="text-center">
                        <span className="text-[9px] font-mono uppercase text-theme-primary block font-bold">Kunyomi (訓)</span>
                        <span className="text-sm sm:text-base font-medium text-theme-text">{kanjiCard.kunyomi}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {/* B. VOCAB CARD */}
          {currentCard.type === 'vocab' && (() => {
            const vocabCard = currentCard as VocabCard;
            const activeFormVal = getFormValue(
              vocabCard.conjugations,
              vocabCard.kanji || vocabCard.reading,
              vocabCard.reading,
              activeForm
            );

            return (
              <>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-jp font-bold text-theme-text tracking-widest leading-none drop-shadow-md">
                  {activeFormVal.text}
                </h1>

                {activeFormVal.reading && activeFormVal.reading !== activeFormVal.text && (
                  <p className="text-base sm:text-lg font-jp text-indigo-300 font-medium">
                    {activeFormVal.reading}
                  </p>
                )}

                {isFlipped && (
                  <div className="w-full max-w-md space-y-4 animate-fade-in">
                    <div className="p-3 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[9px] font-mono uppercase font-bold text-theme-textMuted block mb-1">
                        English Meaning
                      </span>
                      <p className="text-sm sm:text-base text-theme-text font-medium">
                        {vocabCard.meaning}
                      </p>
                    </div>

                    {/* Backside Conjugation Toggles (past +ve, past -ve, Te form, Tai form, Shortform, root form) */}
                    <div onClick={(e) => e.stopPropagation()} className="pt-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-theme-primary block mb-2">
                        Backside Form Toggles (Conjugations)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(Object.keys(CONJUGATION_LABELS) as ConjugationFormKey[]).map((key) => {
                          const conf = CONJUGATION_LABELS[key];
                          const isSelected = activeForm === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveForm(key)}
                              className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-theme-primary text-white border-theme-primary shadow'
                                  : 'bg-theme-card text-theme-textMuted border-theme-border hover:text-theme-text hover:bg-theme-border'
                              }`}
                            >
                              <span>{conf.label}</span>
                              <span className="text-[8px] opacity-75 font-jp">{conf.jp}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* C. GRAMMAR CARD */}
          {currentCard.type === 'grammar' && (() => {
            const grammarCard = currentCard as GrammarCard;
            return (
              <>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-jp font-extrabold text-amber-300 tracking-wide leading-tight drop-shadow-md">
                  {grammarCard.title}
                </h1>

                {!isFlipped ? (
                  <p className="text-sm font-mono text-theme-textMuted bg-theme-surface px-4 py-2 rounded-2xl border border-theme-border">
                    Connection: {grammarCard.structure}
                  </p>
                ) : (
                  <div className="w-full max-w-md space-y-3 text-left animate-fade-in">
                    {/* Structure & Connection */}
                    <div className="p-3 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[9px] font-mono uppercase text-theme-primary font-bold block mb-1">
                        Structure / Connection Rule
                      </span>
                      <code className="text-xs font-mono text-theme-text">{grammarCard.structure}</code>
                    </div>

                    {/* Nuances Explanation */}
                    <div className="p-3 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[9px] font-mono uppercase text-theme-primary font-bold block mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Nuances & Usage Context
                      </span>
                      <p className="text-xs text-theme-text leading-relaxed">{grammarCard.nuance}</p>
                    </div>

                    {/* Furigana-Only Sample Sentences */}
                    <div className="p-3 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[9px] font-mono uppercase text-theme-primary font-bold block mb-2">
                        Sample Sentences (Furigana Only)
                      </span>
                      <div className="space-y-2">
                        {grammarCard.sampleSentences.map((sample, idx) => (
                          <div key={idx} className="p-2 bg-theme-card rounded-xl border border-theme-border">
                            <p className="text-xs font-jp font-medium text-emerald-300">
                              {sample.furigana}
                            </p>
                            <p className="text-[11px] text-theme-textMuted mt-0.5">{sample.english}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Backside Conjugation Toggles */}
                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-theme-primary block mb-1.5">
                        Backside Form Toggles (Conjugations)
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(Object.keys(CONJUGATION_LABELS) as ConjugationFormKey[]).map((key) => {
                          const conf = CONJUGATION_LABELS[key];
                          const isSelected = activeForm === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setActiveForm(key)}
                              className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-theme-primary text-white border-theme-primary shadow'
                                  : 'bg-theme-card text-theme-textMuted border-theme-border hover:text-theme-text hover:bg-theme-border'
                              }`}
                            >
                              <span>{conf.label}</span>
                              <span className="text-[8px] opacity-75 font-jp">{conf.jp}</span>
                            </button>
                          );
                        })}
                      </div>
                      {grammarCard.conjugations && (
                        <div className="mt-1 text-center text-[10px] font-jp text-indigo-300 p-1.5 bg-theme-surface rounded-xl border border-theme-border">
                          Form Rule: {grammarCard.conjugations[activeForm]}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Flip Hint */}
        <div className="text-center pt-2 border-t border-theme-border text-[11px] text-theme-textMuted shrink-0">
          {!isFlipped ? (
            <span className="text-theme-primary font-semibold flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Tap card or press [Space] to reveal answer & backside conjugations
            </span>
          ) : (
            <span>Rate your recall below (Shortcuts: 1, 2, 3, 4)</span>
          )}
        </div>
      </div>

      {/* 3. Bottom Rating Bar */}
      <div className="shrink-0 pt-1">
        {isFlipped && previewIntervals ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto animate-fade-in">
            <button
              onClick={() => handleRating(1)}
              className="py-3 px-2 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-theme-text rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-red-500/30"
            >
              <span className="text-xs sm:text-sm">Again [1]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[1]}</span>
            </button>

            <button
              onClick={() => handleRating(2)}
              className="py-3 px-2 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-theme-text rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-amber-500/30"
            >
              <span className="text-xs sm:text-sm">Hard [2]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[2]}</span>
            </button>

            <button
              onClick={() => handleRating(3)}
              className="py-3 px-2 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-theme-text rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-emerald-500/30"
            >
              <span className="text-xs sm:text-sm">Good [3]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[3]}</span>
            </button>

            <button
              onClick={() => handleRating(4)}
              className="py-3 px-2 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-theme-text rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg transition active:scale-95 border border-indigo-500/30"
            >
              <span className="text-xs sm:text-sm">Easy [4]</span>
              <span className="text-[10px] font-mono opacity-90">{previewIntervals[4]}</span>
            </button>
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-theme-textMuted">
            Tap card to show answer & rating options
          </div>
        )}
      </div>
    </div>
  );
};
