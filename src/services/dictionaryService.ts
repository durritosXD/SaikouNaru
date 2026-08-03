import kanjiData from '../data/kanji_rtk_database.json';
import { KanjiCard, RevisionItem } from '../types';

export interface DictionaryEntry {
  id: string;
  japanese: string;
  reading: string;
  english: string;
  pos?: string[];
  jlpt?: string;
  type: 'kanji' | 'vocab';
  sampleWords?: string[];
}

export interface SentenceBreakdownResult {
  originalText: string;
  japaneseTranslation: string;
  tokens: DictionaryEntry[];
}

// Convert KanjiCard dataset into JMdict-style dictionary entries
const kanjiDictList: DictionaryEntry[] = (kanjiData as KanjiCard[]).map((c) => ({
  id: c.id,
  japanese: c.kanji,
  reading: [c.onyomi, c.kunyomi].filter(Boolean).join(' / ') || c.keyword,
  english: c.meaning || c.keyword,
  pos: ['Kanji'],
  jlpt: c.jlpt,
  type: 'kanji',
  sampleWords: [c.onWords, c.kunWords].filter(Boolean),
}));

// Common Japanese-English Vocabulary Index for fast offline lookup
const commonVocabIndex: DictionaryEntry[] = [
  { id: 'v_1', japanese: '私', reading: 'わたし', english: 'I; me', pos: ['pronoun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_2', japanese: '食べる', reading: 'たべる', english: 'to eat', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_3', japanese: '飲む', reading: 'のむ', english: 'to drink', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_4', japanese: '学校', reading: 'がっこう', english: 'school', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_5', japanese: '友達', reading: 'ともだち', english: 'friend', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_6', japanese: '日本語', reading: 'にほんご', english: 'Japanese language', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_7', japanese: '本', reading: 'ほん', english: 'book', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_8', japanese: '行く', reading: 'いく', english: 'to go', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_9', japanese: '見る', reading: 'みる', english: 'to see; to watch', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_10', japanese: '面白い', reading: 'おもしろい', english: 'interesting; funny', pos: ['adjective'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_11', japanese: '愛する', reading: 'あいする', english: 'to love', pos: ['verb'], jlpt: 'N4', type: 'vocab' },
  { id: 'v_12', japanese: '時間', reading: 'じかん', english: 'time; hour', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_13', japanese: '勉強', reading: 'べんきょう', english: 'study', pos: ['noun', 'verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_14', japanese: '家族', reading: 'かぞく', english: 'family', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_15', japanese: '旅行', reading: 'りょこう', english: 'travel; trip', pos: ['noun', 'verb'], jlpt: 'N4', type: 'vocab' },
];

/**
 * Search JMdict & Kanji Database for Japanese / English query
 */
export function searchDictionary(query: string): DictionaryEntry[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  const matchedKanji = kanjiDictList.filter(
    (k) =>
      k.japanese.includes(q) ||
      k.reading.toLowerCase().includes(q) ||
      k.english.toLowerCase().includes(q)
  );

  const matchedVocab = commonVocabIndex.filter(
    (v) =>
      v.japanese.includes(q) ||
      v.reading.toLowerCase().includes(q) ||
      v.english.toLowerCase().includes(q)
  );

  return [...matchedVocab, ...matchedKanji].slice(0, 50);
}

/**
 * English to Japanese Sentence Translation & Vocabulary Breakdown
 */
export async function translateAndBreakdownSentence(sentence: string): Promise<SentenceBreakdownResult> {
  const cleanInput = sentence.trim();
  if (!cleanInput) {
    return { originalText: '', japaneseTranslation: '', tokens: [] };
  }

  let japaneseText = cleanInput;
  const isEnglish = /[a-zA-Z]/.test(cleanInput);

  // Free Open Translation API with fallback
  if (isEnglish) {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanInput)}&langpair=en|ja`
      );
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        japaneseText = data.responseData.translatedText;
      }
    } catch {
      // Fallback if network offline
      japaneseText = cleanInput;
    }
  }

  // Tokenize Japanese sentence into vocabulary items
  const tokens: DictionaryEntry[] = [];
  const words = cleanInput.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,!?:;"]/g, '');
    if (!word) continue;

    // Look up word in dictionary
    const match = searchDictionary(word)[0];
    if (match) {
      tokens.push(match);
    } else {
      tokens.push({
        id: `token_${Date.now()}_${i}`,
        japanese: isEnglish ? word : word,
        reading: word,
        english: word,
        type: 'vocab',
      });
    }
  }

  // Also include Kanji found directly in the translated Japanese text
  for (const char of japaneseText) {
    if (/[\u4e00-\u9faf]/.test(char)) {
      const kanjiMatch = kanjiDictList.find((k) => k.japanese === char);
      if (kanjiMatch && !tokens.some((t) => t.japanese === char)) {
        tokens.push(kanjiMatch);
      }
    }
  }

  return {
    originalText: cleanInput,
    japaneseTranslation: japaneseText,
    tokens,
  };
}
