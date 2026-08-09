import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, Volume2, X, BookOpen, Layers } from 'lucide-react';
import { KanjiCard } from '../types';

interface KanjiExplorerProps {
  cards: KanjiCard[];
}

export const KanjiExplorer: React.FC<KanjiExplorerProps> = ({ cards }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJlpt, setSelectedJlpt] = useState<string>('ALL');
  const [selectedCard, setSelectedCard] = useState<KanjiCard | null>(null);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesJlpt = selectedJlpt === 'ALL' || card.jlpt === selectedJlpt;
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        card.kanji.includes(q) ||
        card.keyword.toLowerCase().includes(q) ||
        card.meaning.toLowerCase().includes(q) ||
        card.onyomi.toLowerCase().includes(q) ||
        card.kunyomi.toLowerCase().includes(q) ||
        card.rtkNum.toString().includes(q);

      return matchesJlpt && matchesSearch;
    });
  }, [cards, searchTerm, selectedJlpt]);

  const playAudio = (kanji: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(kanji);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const jlptTabs = ['ALL', 'N5', 'N4', 'N3', 'N2', 'N1'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-theme-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            3,000 Kanji & Koohii Explorer
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Search keywords, meanings, readings, or RTK numbers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Kanji, keyword, reading, RTK #..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-theme-text placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-theme-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* JLPT Level Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {jlptTabs.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedJlpt(lvl)}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
              selectedJlpt === lvl
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-theme-text shadow-md'
                : 'bg-slate-900 border border-slate-800 text-gray-400 hover:text-theme-text hover:bg-slate-800'
            }`}
          >
            {lvl === 'ALL' ? 'All Kanji (3,000)' : lvl}
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-auto">
          Showing {filteredCards.length} kanji
        </span>
      </div>

      {/* Kanji Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredCards.slice(0, 120).map((card) => (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className="group bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 cursor-pointer transition transform hover:-translate-y-1 flex flex-col items-center justify-between text-center relative overflow-hidden"
          >
            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-indigo-500/20">
              {card.jlpt}
            </span>
            <span className="text-4xl font-jp font-bold text-theme-text group-hover:scale-110 transition my-2">
              {card.kanji}
            </span>
            <span className="text-xs font-semibold text-indigo-300 truncate w-full">
              {card.keyword}
            </span>
            <span className="text-[10px] text-gray-500 mt-1">RTK #{card.rtkNum}</span>
          </div>
        ))}
      </div>

      {filteredCards.length > 120 && (
        <p className="text-center text-xs text-gray-500 mt-6">
          Showing first 120 matches. Refine your search to see specific Kanji.
        </p>
      )}

      {/* Detailed Modal for Selected Kanji */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-theme-text hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <h1 className="text-7xl font-jp font-bold text-theme-text">{selectedCard.kanji}</h1>
              <div>
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg">
                  JLPT {selectedCard.jlpt} • RTK #{selectedCard.rtkNum}
                </span>
                <h2 className="text-2xl font-extrabold text-indigo-300 mt-1">
                  {selectedCard.keyword}
                </h2>
                <p className="text-xs text-gray-400">{selectedCard.meaning}</p>
                <button
                  onClick={() => playAudio(selectedCard.kanji)}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen Pronunciation
                </button>
              </div>
            </div>

            {/* Readings */}
            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Onyomi (音読み)
                </span>
                <span className="text-sm font-semibold text-gray-200">
                  {selectedCard.onyomi || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                  Kunyomi (訓読み)
                </span>
                <span className="text-sm font-semibold text-gray-200">
                  {selectedCard.kunyomi || 'N/A'}
                </span>
              </div>
            </div>

            {/* Stroke GIF */}
            {selectedCard.strokeGif && (
              <div className="mt-4 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Stroke Animation
                </span>
                <img
                  src={`/strokes/${selectedCard.strokeGif}`}
                  alt={selectedCard.kanji}
                  className="w-24 h-24 object-contain invert brightness-200"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              </div>
            )}

            {/* Koohii Stories */}
            {(selectedCard.koohii1 || selectedCard.koohii2) && (
              <div className="mt-4 p-4 bg-slate-950/80 border border-indigo-500/20 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  Koohii Mnemonics
                </span>
                {selectedCard.koohii1 && (
                  <div
                    className="text-xs text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedCard.koohii1 }}
                  />
                )}
                {selectedCard.koohii2 && (
                  <div
                    className="text-xs text-gray-400 leading-relaxed border-t border-slate-800 pt-2"
                    dangerouslySetInnerHTML={{ __html: selectedCard.koohii2 }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
