import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Languages,
  Plus,
  Check,
  Trash2,
  Bookmark,
  Sparkles,
  Volume2,
  Layers,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { RevisionItem } from '../types';
import {
  searchDictionary,
  translateAndBreakdownSentence,
  DictionaryEntry,
  SentenceBreakdownResult
} from '../services/dictionaryService';
import { getRevisionList, saveRevisionItem, deleteRevisionItem } from '../services/db';

export const DictionaryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'translate' | 'revision'>('search');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DictionaryEntry[]>([]);

  // Translate State
  const [sentenceInput, setSentenceInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<SentenceBreakdownResult | null>(null);
  const [showKanjiSubtitle, setShowKanjiSubtitle] = useState(false);

  // Revision List State
  const [revisionList, setRevisionList] = useState<RevisionItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [revisionFilter, setRevisionFilter] = useState<'all' | 'vocab' | 'sentence' | 'kanji'>('all');
  const [revisionQuery, setRevisionQuery] = useState('');

  // Load Revision List from IndexedDB
  const loadRevisionList = async () => {
    const list = await getRevisionList();
    setRevisionList(list);
    setSavedIds(new Set(list.map((item) => item.japanese)));
  };

  useEffect(() => {
    loadRevisionList();
  }, []);

  // Live dictionary search (Only queries when user types something)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
    } else {
      setSearchResults(searchDictionary(searchQuery));
    }
  }, [searchQuery]);

  // Handle sentence translation
  const handleTranslate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sentenceInput.trim()) return;

    setIsTranslating(true);
    const result = await translateAndBreakdownSentence(sentenceInput);
    setTranslationResult(result);
    setIsTranslating(false);
  };

  // Add Item to Revision List
  const handleAddToList = async (
    japanese: string,
    reading: string,
    english: string,
    type: 'vocab' | 'sentence' | 'kanji',
    jlpt?: string
  ) => {
    const newItem: RevisionItem = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      japanese,
      reading,
      english,
      jlpt,
      addedAt: Date.now(),
    };

    await saveRevisionItem(newItem);
    await loadRevisionList();
  };

  // Remove Item from Revision List
  const handleRemoveFromList = async (id: string) => {
    await deleteRevisionItem(id);
    await loadRevisionList();
  };

  // Speech synthesis for Japanese audio
  const playAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Filtered Revision List
  const filteredRevisionList = revisionList.filter((item) => {
    const matchesFilter = revisionFilter === 'all' || item.type === revisionFilter;
    const matchesSearch =
      !revisionQuery.trim() ||
      item.japanese.toLowerCase().includes(revisionQuery.toLowerCase()) ||
      item.reading.toLowerCase().includes(revisionQuery.toLowerCase()) ||
      item.english.toLowerCase().includes(revisionQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Nothing OS Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-card p-2 rounded-3xl border border-theme-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold transition ${
              activeTab === 'search'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text hover:bg-theme-surface'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Hiragana/Kana Lookup
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold transition ${
              activeTab === 'translate'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text hover:bg-theme-surface'
            }`}
          >
            <Languages className="w-4 h-4" />
            Translator (Pure Hiragana)
          </button>

          <button
            onClick={() => setActiveTab('revision')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold transition ${
              activeTab === 'revision'
                ? 'bg-white text-black shadow'
                : 'text-theme-textMuted hover:text-theme-text hover:bg-theme-surface'
            }`}
          >
            <Bookmark className="w-4 h-4 text-theme-primary" />
            Revision List ({revisionList.length})
          </button>
        </div>

        <div className="px-3 py-1 bg-theme-surface border border-theme-border rounded-xl text-[11px] font-mono text-theme-textMuted">
          Hiragana Priority Mode
        </div>
      </div>

      {/* 1. Hiragana / Kana Word Lookup View */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-4 text-theme-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search English word (e.g. 'dog'), Romaji ('inu'), or Hiragana ('いぬ')..."
              className="w-full pl-12 pr-4 py-3.5 bg-theme-card border border-theme-border focus:border-white rounded-2xl text-theme-text placeholder-gray-500 font-mono text-sm focus:outline-none transition shadow-xl"
            />
          </div>

          {/* Dictionary Results Grid - Hiragana First */}
          {searchResults.length === 0 ? (
            <div className="bg-theme-card border border-theme-border rounded-3xl p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-theme-textMuted mx-auto" />
              <h3 className="text-xl font-mono font-bold text-theme-text">Search Japanese Dictionary</h3>
              <p className="text-xs text-theme-textMuted max-w-sm mx-auto font-mono">
                Type an English word (e.g., "dog", "school", "eat"), Romaji ("inu"), or Hiragana ("いぬ") above to look up definitions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((entry) => {
                const isSaved = savedIds.has(entry.hiragana || entry.japanese);
                return (
                  <div
                    key={entry.id}
                    className="bg-theme-card hover:bg-[#181818] border border-theme-border hover:border-theme-borderLight rounded-3xl p-5 shadow-xl transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 font-mono">
                          {entry.jlpt && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-theme-surface text-theme-text border border-theme-border">
                              {entry.jlpt}
                            </span>
                          )}
                          {entry.japanese !== entry.hiragana && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-theme-surface text-theme-textMuted border border-theme-border">
                              Kanji: {entry.japanese}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => playAudio(entry.hiragana || entry.japanese)}
                          className="p-1.5 rounded-xl bg-theme-surface hover:bg-theme-border text-theme-textMuted hover:text-theme-text transition"
                          title="Listen Audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Primary Heading: Pure HIRAGANA + Romaji */}
                      <div className="space-y-1">
                        <h3 className="text-3xl font-jp font-bold text-theme-text tracking-wide">
                          {entry.hiragana || entry.reading}
                        </h3>
                        <p className="text-xs font-mono text-theme-primary">{entry.romaji}</p>
                      </div>

                      {/* English Definition */}
                      <p className="text-xs text-theme-text mt-3 leading-relaxed">
                        {entry.english}
                      </p>

                      {/* Sample Words */}
                      {entry.sampleWords && entry.sampleWords.length > 0 && (
                        <div className="mt-3 text-[11px] text-theme-textMuted border-t border-theme-border pt-2 space-y-1">
                          {entry.sampleWords.map((sample, idx) => (
                            <div key={idx} dangerouslySetInnerHTML={{ __html: sample }} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add to Revision List Button */}
                    <button
                      onClick={() =>
                        handleAddToList(
                          entry.hiragana || entry.japanese,
                          entry.romaji,
                          entry.english,
                          entry.type,
                          entry.jlpt
                        )
                      }
                      disabled={isSaved}
                      className={`mt-5 w-full py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition ${
                        isSaved
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-theme-primary cursor-default'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-4 h-4" /> Saved in Revision List
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-theme-primary" /> Add to Revision List
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Pure Hiragana Translator & Sentence Breakdown View */}
      {activeTab === 'translate' && (
        <div className="space-y-6">
          <form onSubmit={handleTranslate} className="space-y-4">
            <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl space-y-4">
              <label className="block text-xs font-mono uppercase tracking-wider text-theme-text font-bold">
                Paste English or Japanese Sentence
              </label>
              <textarea
                rows={3}
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                placeholder="Paste sentence, e.g.: 'I love dogs' or 'I study Japanese at school'..."
                className="w-full p-4 bg-theme-surface border border-theme-border focus:border-white rounded-2xl text-theme-text placeholder-gray-500 text-sm focus:outline-none transition resize-none font-mono"
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-theme-textMuted font-mono">
                  Translates sentence into **pure Hiragana / Katakana (no raw Kanji)**.
                </p>
                <button
                  type="submit"
                  disabled={isTranslating || !sentenceInput.trim()}
                  className="px-6 py-3 bg-white text-black hover:bg-gray-200 font-bold rounded-2xl text-xs font-mono transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4" /> Translate to Hiragana
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Translation Result & Hiragana Vocabulary Breakdown */}
          {translationResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Pure Hiragana Translation Box */}
              <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-theme-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-theme-primary" /> Pure Hiragana Translation (No Kanji)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowKanjiSubtitle(!showKanjiSubtitle)}
                      className="px-3 py-1.5 bg-theme-surface hover:bg-theme-border border border-theme-border text-theme-text text-xs font-mono rounded-xl flex items-center gap-1.5 transition"
                    >
                      {showKanjiSubtitle ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showKanjiSubtitle ? 'Hide Kanji' : 'Show Kanji Subtitle'}
                    </button>
                    <button
                      onClick={() =>
                        handleAddToList(
                          translationResult.japaneseHiragana,
                          translationResult.originalText,
                          `Sentence: "${translationResult.originalText}"`,
                          'sentence'
                        )
                      }
                      className="px-3.5 py-1.5 bg-white text-black hover:bg-gray-200 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-theme-primary" /> Add Sentence to List
                    </button>
                  </div>
                </div>

                {/* Main Heading: Pure HIRAGANA Translation */}
                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-jp font-bold text-theme-text tracking-wider">
                      {translationResult.japaneseHiragana}
                    </h2>
                    {showKanjiSubtitle && (
                      <p className="text-xs font-jp text-theme-textMuted mt-1">
                        Kanji version: {translationResult.japaneseKanji}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => playAudio(translationResult.japaneseHiragana)}
                    className="p-2.5 rounded-xl bg-theme-surface hover:bg-theme-border text-theme-primary transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hiragana Vocabulary Breakdown Tokens */}
              <div className="space-y-3">
                <h3 className="text-lg font-mono font-bold text-theme-text flex items-center gap-2">
                  <Layers className="w-5 h-5 text-theme-primary" />
                  Hiragana Vocabulary Breakdown ({translationResult.tokens.length} words)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {translationResult.tokens.map((token, idx) => {
                    const wordText = token.hiragana || token.reading || token.japanese;
                    const isSaved = savedIds.has(wordText);
                    return (
                      <div
                        key={idx}
                        className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-jp font-bold text-theme-text">
                              {wordText}
                            </span>
                            <button
                              onClick={() => playAudio(wordText)}
                              className="p-1 rounded bg-theme-surface text-theme-textMuted hover:text-theme-text"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs font-mono text-theme-primary mt-1">{token.romaji}</p>
                          <p className="text-xs text-theme-text mt-2">{token.english}</p>
                        </div>

                        <button
                          onClick={() =>
                            handleAddToList(
                              wordText,
                              token.romaji,
                              token.english,
                              'vocab',
                              token.jlpt
                            )
                          }
                          disabled={isSaved}
                          className={`mt-4 w-full py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition ${
                            isSaved
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-theme-primary cursor-default'
                              : 'bg-theme-surface border border-theme-border text-theme-text hover:bg-theme-border'
                          }`}
                        >
                          {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-theme-primary" />}
                          {isSaved ? 'Saved' : 'Add Vocab to List'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Revision List View */}
      {activeTab === 'revision' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-theme-card p-4 rounded-3xl border border-theme-border">
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {(['all', 'vocab', 'sentence', 'kanji'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRevisionFilter(filter)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold uppercase transition ${
                    revisionFilter === filter
                      ? 'bg-white text-black'
                      : 'bg-theme-surface text-theme-textMuted hover:text-theme-text border border-theme-border'
                  }`}
                >
                  {filter} ({revisionList.filter((i) => filter === 'all' || i.type === filter).length})
                </button>
              ))}
            </div>

            <input
              type="text"
              value={revisionQuery}
              onChange={(e) => setRevisionQuery(e.target.value)}
              placeholder="Filter saved items..."
              className="px-4 py-2 bg-theme-surface border border-theme-border rounded-xl text-theme-text text-xs font-mono focus:outline-none"
            />
          </div>

          {/* Revision Items Grid */}
          {filteredRevisionList.length === 0 ? (
            <div className="bg-theme-card border border-theme-border rounded-3xl p-12 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-theme-textMuted mx-auto" />
              <h3 className="text-xl font-mono font-bold text-theme-text">No Saved Revision Items</h3>
              <p className="text-xs text-theme-textMuted max-w-sm mx-auto">
                Search Hiragana words or translate sentences to save vocabulary into your revision list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRevisionList.map((item) => (
                <div
                  key={item.id}
                  className="bg-theme-card hover:bg-[#181818] border border-theme-border hover:border-theme-borderLight rounded-3xl p-5 shadow-xl transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-theme-textMuted mb-2">
                      <span className="px-2 py-0.5 rounded bg-theme-surface border border-theme-border font-mono uppercase font-bold text-[10px]">
                        {item.type}
                      </span>
                      <span className="font-mono text-[10px] text-theme-textMuted">
                        {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-2xl font-jp font-bold text-theme-text">{item.japanese}</h4>
                    <p className="text-xs font-mono text-theme-primary mt-0.5">{item.reading}</p>
                    <p className="text-xs text-theme-text mt-2 leading-relaxed">{item.english}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between">
                    <button
                      onClick={() => playAudio(item.japanese)}
                      className="p-1.5 rounded-xl bg-theme-surface text-theme-textMuted hover:text-theme-text transition"
                      title="Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRemoveFromList(item.id)}
                      className="p-1.5 rounded-xl text-theme-textMuted hover:text-red-400 hover:bg-red-950/30 transition"
                      title="Remove from Revision List"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
