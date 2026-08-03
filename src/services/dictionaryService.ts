import kanjiData from '../data/kanji_rtk_database.json';
import { KanjiCard } from '../types';

export interface DictionaryEntry {
  id: string;
  japanese: string;  // e.g. 犬
  hiragana: string;  // e.g. いぬ
  romaji: string;    // e.g. inu
  reading: string;   // Kana reading
  english: string;   // English definition
  pos?: string[];
  jlpt?: string;
  type: 'kanji' | 'vocab';
  sampleWords?: string[];
}

export interface SentenceBreakdownResult {
  originalText: string;
  japaneseKanji: string;
  japaneseHiragana: string; // Pure Hiragana / Katakana output (no raw Kanji)
  tokens: DictionaryEntry[];
}

// Convert KanjiCard dataset into JMdict-style dictionary entries with Hiragana & Romaji
const kanjiDictList: DictionaryEntry[] = (kanjiData as KanjiCard[]).map((c) => {
  const reading = c.kunyomi || c.onyomi || c.keyword;
  const hiragana = c.kunyomi || c.onyomi || c.kanji;
  return {
    id: c.id,
    japanese: c.kanji,
    hiragana,
    romaji: c.keyword.toLowerCase(),
    reading,
    english: c.meaning || c.keyword,
    pos: ['Kanji'],
    jlpt: c.jlpt,
    type: 'kanji',
    sampleWords: [c.onWords, c.kunWords].filter(Boolean),
  };
});

// Comprehensive Hiragana / Katakana Vocabulary Index
const commonVocabIndex: DictionaryEntry[] = [
  // Animals
  { id: 'v_dog', japanese: '犬', hiragana: 'いぬ', romaji: 'inu', reading: 'いぬ', english: 'dog', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_cat', japanese: '猫', hiragana: 'ねこ', romaji: 'neko', reading: 'ねこ', english: 'cat', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_bird', japanese: '鳥', hiragana: 'とり', romaji: 'tori', reading: 'とり', english: 'bird', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_fish', japanese: '魚', hiragana: 'さかな', romaji: 'sakana', reading: 'さかな', english: 'fish', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_horse', japanese: '馬', hiragana: 'うま', romaji: 'uma', reading: 'うま', english: 'horse', pos: ['noun'], jlpt: 'N4', type: 'vocab' },
  { id: 'v_cow', japanese: '牛', hiragana: 'うし', romaji: 'ushi', reading: 'うし', english: 'cow; cattle', pos: ['noun'], jlpt: 'N4', type: 'vocab' },
  
  // Pronouns & People
  { id: 'v_i', japanese: '私', hiragana: 'わたし', romaji: 'watashi', reading: 'わたし', english: 'I; me', pos: ['pronoun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_you', japanese: 'あなた', hiragana: 'あなた', romaji: 'anata', reading: 'あなた', english: 'you', pos: ['pronoun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_friend', japanese: '友達', hiragana: 'ともだち', romaji: 'tomodachi', reading: 'ともだち', english: 'friend', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_person', japanese: '人', hiragana: 'ひと', romaji: 'hito', reading: 'ひと', english: 'person', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  
  // Verbs
  { id: 'v_eat', japanese: '食べる', hiragana: 'たべる', romaji: 'taberu', reading: 'たべる', english: 'to eat', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_drink', japanese: '飲む', hiragana: 'のむ', romaji: 'nomu', reading: 'のむ', english: 'to drink', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_go', japanese: '行く', hiragana: 'いく', romaji: 'iku', reading: 'いく', english: 'to go', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_come', japanese: '来る', hiragana: 'くる', romaji: 'kuru', reading: 'くる', english: 'to come', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_see', japanese: '見る', hiragana: 'みる', romaji: 'miru', reading: 'みる', english: 'to see; to watch', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_listen', japanese: '聞く', hiragana: 'きく', romaji: 'kiku', reading: 'きく', english: 'to listen; to hear', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_read', japanese: '読む', hiragana: 'よむ', romaji: 'yomu', reading: 'よむ', english: 'to read', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_write', japanese: '書く', hiragana: 'かく', romaji: 'kaku', reading: 'かく', english: 'to write', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_speak', japanese: '話す', hiragana: 'はなす', romaji: 'hanasu', reading: 'はなす', english: 'to speak; to talk', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_study', japanese: '勉強する', hiragana: 'べんきょうする', romaji: 'benkyou suru', reading: 'べんきょうする', english: 'to study', pos: ['verb'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_love', japanese: '愛する', hiragana: 'あいする', romaji: 'aisuru', reading: 'あいする', english: 'to love', pos: ['verb'], jlpt: 'N4', type: 'vocab' },
  { id: 'v_like', japanese: '好き', hiragana: 'すき', romaji: 'suki', reading: 'すき', english: 'like; fond of', pos: ['adjective'], jlpt: 'N5', type: 'vocab' },

  // Nouns & Places
  { id: 'v_school', japanese: '学校', hiragana: 'がっこう', romaji: 'gakkou', reading: 'がっこう', english: 'school', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_language', japanese: '日本語', hiragana: 'にほんご', romaji: 'nihongo', reading: 'にほんご', english: 'Japanese language', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_book', japanese: '本', hiragana: 'ほん', romaji: 'hon', reading: 'ほん', english: 'book', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_water', japanese: '水', hiragana: 'みず', romaji: 'mizu', reading: 'みず', english: 'water', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_food', japanese: '食べ物', hiragana: 'たべもの', romaji: 'tabemono', reading: 'たべもの', english: 'food', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_house', japanese: '家', hiragana: 'うち', romaji: 'uchi', reading: 'うち', english: 'house; home', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_car', japanese: '車', hiragana: 'くるま', romaji: 'kuruma', reading: 'くるま', english: 'car', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_sun', japanese: '日', hiragana: 'ひ', romaji: 'hi', reading: 'ひ', english: 'sun; day', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_moon', japanese: '月', hiragana: 'つき', romaji: 'tsuki', reading: 'つき', english: 'moon; month', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
  { id: 'v_today', japanese: '今日', hiragana: 'きょう', romaji: 'kyou', reading: 'きょう', english: 'today', pos: ['noun'], jlpt: 'N5', type: 'vocab' },
];

/**
 * Search JMdict & Kanji Database for Japanese / English query
 */
export function searchDictionary(query: string): DictionaryEntry[] {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();

  const matchedVocab = commonVocabIndex.filter(
    (v) =>
      v.english.toLowerCase().includes(q) ||
      v.hiragana.toLowerCase().includes(q) ||
      v.romaji.toLowerCase().includes(q) ||
      v.japanese.includes(q)
  );

  const matchedKanji = kanjiDictList.filter(
    (k) =>
      k.english.toLowerCase().includes(q) ||
      k.hiragana.toLowerCase().includes(q) ||
      k.romaji.toLowerCase().includes(q) ||
      k.japanese.includes(q)
  );

  return [...matchedVocab, ...matchedKanji].slice(0, 50);
}

/**
 * Converts Japanese text containing Kanji into pure Hiragana
 */
export function convertKanjiToHiragana(text: string): string {
  let hiraganaText = text;

  // Replace common Kanji words with their pure Hiragana equivalents
  for (const item of commonVocabIndex) {
    if (item.japanese !== item.hiragana) {
      hiraganaText = hiraganaText.split(item.japanese).join(item.hiragana);
    }
  }

  // Replace individual Kanji chars using RTK dataset readings
  for (const c of kanjiData as KanjiCard[]) {
    if (c.kunyomi) {
      hiraganaText = hiraganaText.split(c.kanji).join(c.kunyomi);
    } else if (c.onyomi) {
      hiraganaText = hiraganaText.split(c.kanji).join(c.onyomi);
    }
  }

  return hiraganaText;
}

/**
 * English to Japanese Sentence Translation & Pure Hiragana Breakdown
 */
export async function translateAndBreakdownSentence(sentence: string): Promise<SentenceBreakdownResult> {
  const cleanInput = sentence.trim();
  if (!cleanInput) {
    return { originalText: '', japaneseKanji: '', japaneseHiragana: '', tokens: [] };
  }

  let japaneseText = cleanInput;
  const isEnglish = /[a-zA-Z]/.test(cleanInput);

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
      japaneseText = cleanInput;
    }
  }

  // Generate pure Hiragana version of the translated sentence (no raw Kanji)
  const pureHiragana = convertKanjiToHiragana(japaneseText);

  // Tokenize sentence into Hiragana vocabulary items
  const tokens: DictionaryEntry[] = [];
  const words = cleanInput.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[.,!?:;"]/g, '');
    if (!word) continue;

    const match = searchDictionary(word)[0];
    if (match) {
      tokens.push(match);
    } else {
      tokens.push({
        id: `token_${Date.now()}_${i}`,
        japanese: isEnglish ? word : word,
        hiragana: word,
        romaji: word,
        reading: word,
        english: word,
        type: 'vocab',
      });
    }
  }

  return {
    originalText: cleanInput,
    japaneseKanji: japaneseText,
    japaneseHiragana: pureHiragana,
    tokens,
  };
}
