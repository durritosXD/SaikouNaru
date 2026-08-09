import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { KanjiCard, VocabCard, GrammarCard, AnyCard, DeckInstance, SRSRecord, ReviewLog, UserStats, CardDisplaySettings, RevisionItem } from '../types';
import kanjiData from '../data/kanji_rtk_database.json';
import vocabData from '../data/vocab_database.json';
import grammarData from '../data/grammar_database.json';

interface KanjiSenseiDB extends DBSchema {
  cards: {
    key: string;
    value: AnyCard;
    indexes: { 'by-jlpt': string; 'by-type': string };
  };
  deckInstances: {
    key: string;
    value: DeckInstance;
  };
  srsRecords: {
    key: string; // `${instanceId}_${cardId}`
    value: SRSRecord;
    indexes: { 'by-instance': string; 'by-due': number };
  };
  reviewLogs: {
    key: string;
    value: ReviewLog;
    indexes: { 'by-instance': string; 'by-timestamp': number };
  };
  userStats: {
    key: string;
    value: UserStats;
  };
  revisionList: {
    key: string;
    value: RevisionItem;
    indexes: { 'by-type': string; 'by-added': number };
  };
}

const DB_NAME = 'kanji_sensei_db';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<KanjiSenseiDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KanjiSenseiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cards store
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-jlpt', 'jlpt');
          cardStore.createIndex('by-type', 'type');
        }

        // Deck instances store
        if (!db.objectStoreNames.contains('deckInstances')) {
          db.createObjectStore('deckInstances', { keyPath: 'id' });
        }

        // SRS Records store
        if (!db.objectStoreNames.contains('srsRecords')) {
          const srsStore = db.createObjectStore('srsRecords', { keyPath: ['instanceId', 'cardId'] as any });
          srsStore.createIndex('by-instance', 'instanceId');
          srsStore.createIndex('by-due', 'due');
        }

        // Review logs
        if (!db.objectStoreNames.contains('reviewLogs')) {
          const logStore = db.createObjectStore('reviewLogs', { keyPath: 'id' });
          logStore.createIndex('by-instance', 'instanceId');
          logStore.createIndex('by-timestamp', 'timestamp');
        }

        // User stats
        if (!db.objectStoreNames.contains('userStats')) {
          db.createObjectStore('userStats', { keyPath: 'lastStudyDay' });
        }

        // Revision List store
        if (!db.objectStoreNames.contains('revisionList')) {
          const revStore = db.createObjectStore('revisionList', { keyPath: 'id' });
          revStore.createIndex('by-type', 'type');
          revStore.createIndex('by-added', 'addedAt');
        }
      },
    });
  }
  return dbPromise;
}

export const DEFAULT_DISPLAY_SETTINGS: CardDisplaySettings = {
  front: {
    showKanji: true,
    showKeyword: true,
    showMeaning: false,
    showKoohii: false,
    showReadings: false,
    showStrokes: false,
    showSampleWords: false,
    showAudio: true,
  },
  back: {
    showKanji: true,
    showKeyword: true,
    showMeaning: true,
    showKoohii: true,
    showReadings: true,
    showStrokes: true,
    showSampleWords: true,
    showAudio: true,
  },
  cardTheme: 'dark',
};

export async function initializeDatabase() {
  const db = await getDB();
  
  // Seed / update cards to sync accurate Kanji, Vocab, and Grammar
  if (localStorage.getItem('coto_vocab_grammar_synced_v1') !== 'true') {
    const tx = db.transaction('cards', 'readwrite');
    for (const card of kanjiData as KanjiCard[]) {
      await tx.store.put(card);
    }
    for (const card of vocabData as VocabCard[]) {
      await tx.store.put(card);
    }
    for (const card of grammarData as GrammarCard[]) {
      await tx.store.put(card);
    }
    await tx.done;
    localStorage.setItem('coto_vocab_grammar_synced_v1', 'true');
    console.log(`Seeded/Synced ${kanjiData.length} Kanji, ${vocabData.length} Vocab, ${grammarData.length} Grammar cards into IndexedDB.`);
  }

  // Seed default deck instances ONLY on initial first run
  const instancesInitialized = localStorage.getItem('coto_deck_instances_v2') === 'true';
  const instanceCount = await db.count('deckInstances');
  if (!instancesInitialized || instanceCount === 0) {
    const defaultInstances: DeckInstance[] = [
      {
        id: 'instance_n5',
        name: 'JLPT N5 Essentials (Kanji)',
        description: 'Master 194 foundational N5 Kanji with Koohii mnemonics and stroke order.',
        jlptLevels: ['N5'],
        cardTypes: ['kanji'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 15,
        dailyReviewLimit: 100,
        createdDate: Date.now(),
      },
      {
        id: 'instance_n5_vocab',
        name: 'JLPT N5 Core Vocab',
        description: 'Master 669 foundational N5 vocabulary words with conjugation toggles.',
        jlptLevels: ['N5'],
        cardTypes: ['vocab'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 15,
        dailyReviewLimit: 100,
        createdDate: Date.now(),
      },
      {
        id: 'instance_n5_grammar',
        name: 'JLPT N5 Master Grammar',
        description: 'Master 40 N5 Japanese grammar points with furigana sample sentences & nuances.',
        jlptLevels: ['N5'],
        cardTypes: ['grammar'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 10,
        dailyReviewLimit: 50,
        createdDate: Date.now(),
      },
      {
        id: 'instance_all_vocab',
        name: 'Complete JLPT Vocab (N5-N1)',
        description: 'Comprehensive deck covering 8,398 vocabulary words across all levels.',
        jlptLevels: ['N5', 'N4', 'N3', 'N2', 'N1'],
        cardTypes: ['vocab'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 20,
        dailyReviewLimit: 150,
        createdDate: Date.now(),
      },
      {
        id: 'instance_all_grammar',
        name: 'Complete JLPT Grammar (N5-N1)',
        description: 'Master all 287 JLPT grammar points with nuances & furigana sample sentences.',
        jlptLevels: ['N5', 'N4', 'N3', 'N2', 'N1'],
        cardTypes: ['grammar'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 10,
        dailyReviewLimit: 80,
        createdDate: Date.now(),
      }
    ];

    for (const inst of defaultInstances) {
      await db.put('deckInstances', inst);
    }
    localStorage.setItem('coto_deck_instances_v2', 'true');
  }
}

// Cards API
export async function getAllCards(): Promise<AnyCard[]> {
  const db = await getDB();
  return db.getAll('cards');
}

export async function getAllVocab(): Promise<VocabCard[]> {
  const all = await getAllCards();
  return all.filter(c => c.type === 'vocab') as VocabCard[];
}

export async function getAllGrammar(): Promise<GrammarCard[]> {
  const all = await getAllCards();
  return all.filter(c => c.type === 'grammar') as GrammarCard[];
}

export async function getCardsByJLPT(levels: string[]): Promise<AnyCard[]> {
  const allCards = await getAllCards();
  return allCards.filter(c => levels.includes(c.jlpt));
}

// Deck Instances API
export async function getAllDeckInstances(): Promise<DeckInstance[]> {
  const db = await getDB();
  return db.getAll('deckInstances');
}

export async function saveDeckInstance(instance: DeckInstance): Promise<void> {
  const db = await getDB();
  await db.put('deckInstances', instance);
}

export async function deleteDeckInstance(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('deckInstances', id);
  
  // Clean up SRS records for this instance
  const txSrs = db.transaction('srsRecords', 'readwrite');
  const indexSrs = txSrs.store.index('by-instance');
  let cursorSrs = await indexSrs.openCursor(id);
  while (cursorSrs) {
    await cursorSrs.delete();
    cursorSrs = await cursorSrs.continue();
  }
  await txSrs.done;

  // Clean up Review Logs for this instance
  const txLogs = db.transaction('reviewLogs', 'readwrite');
  const indexLogs = txLogs.store.index('by-instance');
  let cursorLogs = await indexLogs.openCursor(id);
  while (cursorLogs) {
    await cursorLogs.delete();
    cursorLogs = await cursorLogs.continue();
  }
  await txLogs.done;
}

// SRS Records API
export async function getSRSRecord(instanceId: string, cardId: string): Promise<SRSRecord | undefined> {
  const db = await getDB();
  return db.get('srsRecords', [instanceId, cardId] as any);
}

export async function getAllSRSRecordsForInstance(instanceId: string): Promise<SRSRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('srsRecords', 'by-instance', instanceId);
}

export async function saveSRSRecord(record: SRSRecord): Promise<void> {
  const db = await getDB();
  await db.put('srsRecords', record);
}

export async function saveReviewLog(log: ReviewLog): Promise<void> {
  const db = await getDB();
  await db.put('reviewLogs', log);
}

export async function getAllReviewLogs(): Promise<ReviewLog[]> {
  const db = await getDB();
  return db.getAll('reviewLogs');
}

// Revision List API
export async function getRevisionList(): Promise<RevisionItem[]> {
  const db = await getDB();
  return db.getAll('revisionList');
}

export async function saveRevisionItem(item: RevisionItem): Promise<void> {
  const db = await getDB();
  await db.put('revisionList', item);
}

export async function deleteRevisionItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('revisionList', id);
}
