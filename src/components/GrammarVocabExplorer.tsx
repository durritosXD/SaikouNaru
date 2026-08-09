import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Sparkles,
  Volume2,
  Filter,
  Layers,
  ChevronRight,
  X,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { AnyCard, VocabCard, GrammarCard, JLPTLevel, ConjugationFormKey } from '../types';
import { CONJUGATION_LABELS, getFormValue } from '../services/conjugation';

interface GrammarVocabExplorerProps {
  cards: AnyCard[];
}

const ALL_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const GrammarVocabExplorer: React.FC<GrammarVocabExplorerProps> = ({ cards }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vocab' | 'grammar'>('all');
  const [selectedLevels, setSelectedLevels] = useState<JLPTLevel[]>(['N5', 'N4', 'N3', 'N2', 'N1']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<AnyCard | null>(null);
  const [activeForm, setActiveForm] = useState<ConjugationFormKey>('root');

  // Filter items
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (card.type === 'kanji') return false; // Filter out kanji since user already has kanji explorer

      // Category filter
      if (selectedCategory === 'vocab' && card.type !== 'vocab') return false;
      if (selectedCategory === 'grammar' && card.type !== 'grammar') return false;

      // Level filter (Study vs Omit)
      if (!selectedLevels.includes(card.jlpt as JLPTLevel)) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      if (card.type === 'vocab') {
        const v = card as VocabCard;
        return (
          v.kanji.toLowerCase().includes(query) ||
          v.reading.toLowerCase().includes(query) ||
          v.meaning.toLowerCase().includes(query)
        );
      } else if (card.type === 'grammar') {
        const g = card as GrammarCard;
        return (
          g.title.toLowerCase().includes(query) ||
          g.structure.toLowerCase().includes(query) ||
          g.nuance.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [cards, selectedCategory, selectedLevels, searchQuery]);

  const toggleLevel = (lvl: JLPTLevel) => {
    if (selectedLevels.includes(lvl)) {
      if (selectedLevels.length === 1) return; // keep at least 1 level
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  const playAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-theme-border mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-theme-primary border border-indigo-500/30 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Coto JLPT Grammar & Vocab
            </span>
            <span className="text-xs text-theme-textMuted font-mono font-semibold">
              8,398 Vocab • 287 Grammar
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-theme-text tracking-tight">
            Grammar & Vocab Explorer
          </h1>
          <p className="text-sm text-theme-textMuted mt-1">
            Filter by JLPT level (study or omit), inspect grammar nuances & furigana-only sample sentences, and test dynamic conjugations.
          </p>
        </div>

        {/* Level Selector / Omitter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 bg-theme-card p-2 rounded-2xl border border-theme-border">
          <span className="text-[10px] font-mono uppercase text-theme-textMuted font-bold px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-theme-primary" /> Levels:
          </span>
          {ALL_LEVELS.map((lvl) => {
            const isSelected = selectedLevels.includes(lvl);
            return (
              <button
                key={lvl}
                onClick={() => toggleLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-white text-black shadow'
                    : 'bg-theme-surface text-theme-textMuted border border-theme-border hover:text-theme-text'
                }`}
                title={isSelected ? `Studying ${lvl} (Click to omit)` : `Omitted ${lvl} (Click to study)`}
              >
                {lvl}
                {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-theme-card p-1.5 rounded-2xl border border-theme-border w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text'
            }`}
          >
            All Items ({filteredCards.length})
          </button>
          <button
            onClick={() => setSelectedCategory('vocab')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'vocab'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text'
            }`}
          >
            Vocabulary Only
          </button>
          <button
            onClick={() => setSelectedCategory('grammar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'grammar'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text'
            }`}
          >
            Grammar Points
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-theme-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reading, kanji, meaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-card border border-theme-border focus:border-indigo-500 text-theme-text placeholder-gray-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-textMuted hover:text-theme-text text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Item Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCards.slice(0, 100).map((card) => {
          const isVocab = card.type === 'vocab';
          const vocab = card as VocabCard;
          const grammar = card as GrammarCard;

          return (
            <div
              key={card.id}
              onClick={() => {
                setSelectedCard(card);
                setActiveForm('root');
              }}
              className="bg-theme-card border border-theme-border hover:border-indigo-500/50 p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition hover:scale-[1.01] group relative"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                      isVocab
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/20 text-theme-primary border border-amber-500/30'
                    }`}
                  >
                    {isVocab ? 'VOCAB' : 'GRAMMAR'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-theme-textMuted bg-theme-surface px-2 py-0.5 rounded border border-theme-border">
                    JLPT {card.jlpt}
                  </span>
                </div>

                {isVocab ? (
                  <div>
                    <h3 className="text-2xl font-bold font-jp text-theme-text group-hover:text-indigo-300 transition">
                      {vocab.kanji || vocab.reading}
                    </h3>
                    {vocab.kanji && (
                      <p className="text-xs font-jp text-theme-textMuted mt-0.5">{vocab.reading}</p>
                    )}
                    <p className="text-xs text-theme-text mt-2 line-clamp-2">{vocab.meaning}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold font-jp text-amber-300 group-hover:text-amber-200 transition">
                      {grammar.title}
                    </h3>
                    <p className="text-xs font-mono text-theme-textMuted mt-1 line-clamp-1">
                      {grammar.structure}
                    </p>
                    <p className="text-xs text-theme-text mt-2 line-clamp-2">{grammar.nuance}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-[11px] text-theme-textMuted group-hover:text-theme-text transition">
                <span>View detail & conjugations</span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-primary" />
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length > 100 && (
        <div className="mt-8 text-center text-xs text-theme-textMuted font-mono">
          Showing 100 of {filteredCards.length} items. Use search to narrow down results.
        </div>
      )}

      {/* Detail Modal with Backside Conjugation Toggles & Furigana Sentences */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-theme-card border border-theme-border rounded-3xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-theme-surface text-theme-textMuted hover:text-theme-text border border-theme-border"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase ${
                  selectedCard.type === 'vocab'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/20 text-theme-primary border border-amber-500/30'
                }`}
              >
                {selectedCard.type === 'vocab' ? 'VOCABULARY' : 'GRAMMAR POINT'}
              </span>
              <span className="text-xs font-mono font-bold text-theme-textMuted bg-theme-surface px-2.5 py-1 rounded-xl border border-theme-border">
                JLPT {selectedCard.jlpt}
              </span>
            </div>

            {/* Main Word / Grammar Display */}
            {selectedCard.type === 'vocab' ? (
              (() => {
                const vocab = selectedCard as VocabCard;
                const activeFormVal = getFormValue(
                  vocab.conjugations,
                  vocab.kanji || vocab.reading,
                  vocab.reading,
                  activeForm
                );

                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-4xl font-extrabold font-jp text-theme-text">
                        {activeFormVal.text}
                      </h2>
                      <button
                        onClick={() => playAudio(activeFormVal.text)}
                        className="p-3 bg-theme-surface border border-theme-border rounded-2xl text-theme-primary hover:text-theme-text transition"
                        title="Listen Japanese Speech"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {activeFormVal.reading && activeFormVal.reading !== activeFormVal.text && (
                      <p className="text-sm font-jp text-indigo-300 mt-1">
                        Reading: {activeFormVal.reading}
                      </p>
                    )}

                    <div className="mt-4 p-4 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[10px] font-mono uppercase font-bold text-theme-textMuted block mb-1">
                        English Meaning
                      </span>
                      <p className="text-base text-theme-text font-medium">{vocab.meaning}</p>
                    </div>

                    {/* Backside Conjugation Toggles Selector */}
                    {vocab.conjugations && Object.keys(vocab.conjugations).length > 0 && (
                      <div className="mt-6">
                        <label className="text-xs font-mono uppercase text-theme-primary font-bold block mb-2">
                          Backside Form Toggles (Conjugation)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(CONJUGATION_LABELS) as ConjugationFormKey[]).map((key) => {
                            const conf = CONJUGATION_LABELS[key];
                            const isSelected = activeForm === key;
                            return (
                              <button
                                key={key}
                                onClick={() => setActiveForm(key)}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                                  isSelected
                                    ? 'bg-theme-primary text-white border-theme-primary shadow-lg'
                                    : 'bg-theme-card text-theme-textMuted border-theme-border hover:text-theme-text hover:bg-theme-surface'
                                }`}
                              >
                                <span>{conf.label}</span>
                                <span className="text-[9px] opacity-75 font-jp">{conf.jp}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              (() => {
                const grammar = selectedCard as GrammarCard;
                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-extrabold font-jp text-amber-300">
                        {grammar.title}
                      </h2>
                      <button
                        onClick={() => playAudio(grammar.title)}
                        className="p-3 bg-theme-surface border border-theme-border rounded-2xl text-theme-primary hover:text-theme-text transition"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Structure / Attachment */}
                    <div className="mt-4 p-3 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[10px] font-mono uppercase text-theme-primary font-bold block mb-1">
                        Connection Rule / Structure
                      </span>
                      <code className="text-xs font-mono text-theme-text">{grammar.structure}</code>
                    </div>

                    {/* Nuances Explanation */}
                    <div className="mt-4 p-4 bg-theme-surface border border-theme-border rounded-2xl">
                      <span className="text-[10px] font-mono uppercase text-theme-primary font-bold block mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Grammar Nuances & Usage Context
                      </span>
                      <p className="text-xs text-theme-text leading-relaxed">{grammar.nuance}</p>
                    </div>

                    {/* Sample Sentences in Furigana-Only (Pure Kana) */}
                    <div className="mt-4">
                      <span className="text-xs font-mono uppercase text-theme-primary font-bold block mb-2">
                        Sample Sentences (Furigana Only)
                      </span>
                      <div className="space-y-3">
                        {grammar.sampleSentences.map((sample, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg.black/40 bg-theme-card border border-theme-border rounded-2xl flex items-start justify-between gap-3"
                          >
                            <div>
                              <p className="text-sm font-jp font-medium text-emerald-300 tracking-wide">
                                {sample.furigana}
                              </p>
                              <p className="text-xs text-theme-textMuted mt-1">{sample.english}</p>
                            </div>
                            <button
                              onClick={() => playAudio(sample.furigana)}
                              className="p-2 bg-theme-surface border border-theme-border rounded-xl text-theme-textMuted hover:text-theme-text shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};
