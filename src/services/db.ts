import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { KanjiCard, DeckInstance, SRSRecord, ReviewLog, UserStats, CardDisplaySettings, RevisionItem } from '../types';
import kanjiData from '../data/kanji_rtk_database.json';

interface KanjiSenseiDB extends DBSchema {
  cards: {
    key: string;
    value: KanjiCard;
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
const DB_VERSION = 2;

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
  
  // Seed / update cards to sync accurate JLPT level classification
  const count = await db.count('cards');
  if (count === 0 || localStorage.getItem('kanji_jlpt_synced_v2') !== 'true') {
    const tx = db.transaction('cards', 'readwrite');
    for (const card of kanjiData as KanjiCard[]) {
      await tx.store.put(card);
    }
    await tx.done;
    localStorage.setItem('kanji_jlpt_synced_v2', 'true');
    console.log(`Seeded/Synced ${kanjiData.length} cards into IndexedDB.`);
  }

  // Seed default deck instances if none exist
  const instanceCount = await db.count('deckInstances');
  if (instanceCount === 0) {
    const defaultInstances: DeckInstance[] = [
      {
        id: 'instance_n5',
        name: 'JLPT N5 Essentials',
        description: 'Master 194 foundational N5 Kanji with Koohii mnemonics and stroke order.',
        jlptLevels: ['N5'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 15,
        dailyReviewLimit: 100,
        createdDate: Date.now(),
      },
      {
        id: 'instance_n5_n4',
        name: 'N5 & N4 Combined Sprint',
        description: 'Comprehensive study deck for N5 and N4 levels (~540 Kanji).',
        jlptLevels: ['N5', 'N4'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 20,
        dailyReviewLimit: 150,
        createdDate: Date.now(),
      },
      {
        id: 'instance_all_kanji',
        name: 'RTK 3,000 All Levels',
        description: 'Complete RTK 1 & 3 database covering N5 to N1.',
        jlptLevels: ['N5', 'N4', 'N3', 'N2', 'N1'],
        displaySettings: JSON.parse(JSON.stringify(DEFAULT_DISPLAY_SETTINGS)),
        dailyNewLimit: 25,
        dailyReviewLimit: 200,
        createdDate: Date.now(),
      }
    ];

    for (const inst of defaultInstances) {
      await db.put('deckInstances', inst);
    }
  }
}

// Cards API
export async function getAllCards(): Promise<KanjiCard[]> {
  const db = await getDB();
  return db.getAll('cards');
}

export async function getCardsByJLPT(levels: string[]): Promise<KanjiCard[]> {
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
