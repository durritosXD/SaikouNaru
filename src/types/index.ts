export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type CardType = 'kanji' | 'vocab' | 'grammar' | 'custom';

export type ConjugationFormKey = 'root' | 'short' | 'pastPos' | 'pastNeg' | 'teForm' | 'taiForm';

export interface ConjugationForms {
  root: string;
  rootReading?: string;
  short: string;
  shortReading?: string;
  pastPos: string;
  pastPosReading?: string;
  pastNeg: string;
  pastNegReading?: string;
  teForm: string;
  teFormReading?: string;
  taiForm: string;
  taiFormReading?: string;
}

export interface KanjiCard {
  id: string;
  kanji: string;
  rtkNum: number;
  keyword: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  koohii1: string;
  koohii2: string;
  onWords: string;
  kunWords: string;
  strokeGif: string;
  jlpt: JLPTLevel | string;
  type: CardType;
}

export interface VocabCard {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  jlpt: JLPTLevel | string;
  type: 'vocab';
  conjugations?: ConjugationForms;
}

export interface SampleSentence {
  furigana: string; // Furigana-only (pure kana/hiragana)
  english: string;
}

export interface GrammarCard {
  id: string;
  title: string;
  jlpt: JLPTLevel | string;
  type: 'grammar';
  structure: string;
  nuance: string;
  sampleSentences: SampleSentence[];
  conjugations?: ConjugationForms;
}

export type AnyCard = KanjiCard | VocabCard | GrammarCard;

export interface CardDisplayFields {
  showKanji: boolean;
  showKeyword: boolean;
  showMeaning: boolean;
  showKoohii: boolean;
  showReadings: boolean;
  showStrokes: boolean;
  showSampleWords: boolean;
  showAudio: boolean;
}

export interface CardDisplaySettings {
  front: CardDisplayFields;
  back: CardDisplayFields;
  cardTheme: 'dark' | 'glass' | 'cyber' | 'minimal';
}

export interface DeckInstance {
  id: string;
  name: string;
  description: string;
  jlptLevels: string[];
  cardTypes?: CardType[];
  displaySettings: CardDisplaySettings;
  dailyNewLimit: number;
  dailyReviewLimit: number;
  createdDate: number;
  lastStudiedDate?: number;
}

export type SRSPhase = 'new' | 'learning' | 'review' | 'relearning';

export interface SRSRecord {
  cardId: string;
  instanceId: string;
  phase: SRSPhase;
  due: number; // timestamp ms
  interval: number; // in days
  easeFactor: number; // percentage e.g. 250
  repetitions: number;
  lapses: number;
  stepIndex: number; // For learning steps e.g. [1m, 10m]
  lastReviewed: number;
}

export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface ReviewLog {
  id: string;
  cardId: string;
  instanceId: string;
  rating: Rating;
  timestamp: number;
  newInterval: number;
  newEaseFactor: number;
}

export interface UserStats {
  streak: number;
  lastStudyDay: string;
  totalReviews: number;
  correctReviews: number;
}

export interface RevisionItem {
  id: string;
  type: 'vocab' | 'sentence' | 'kanji';
  japanese: string;
  reading: string;
  english: string;
  jlpt?: string;
  notes?: string;
  addedAt: number;
}
