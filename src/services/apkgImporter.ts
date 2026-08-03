import JSZip from 'jszip';
import { getDB } from './db';
import { KanjiCard } from '../types';

export interface ImportResult {
  success: boolean;
  count: number;
  message: string;
}

export async function importJsonDeck(jsonText: string): Promise<ImportResult> {
  try {
    const rawData = JSON.parse(jsonText);
    if (!Array.isArray(rawData)) {
      return { success: false, count: 0, message: 'JSON root must be an array of cards.' };
    }

    const db = await getDB();
    const tx = db.transaction('cards', 'readwrite');
    let importedCount = 0;

    for (const item of rawData) {
      if (!item.kanji && !item.keyword && !item.front) continue;

      const card: KanjiCard = {
        id: item.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        kanji: item.kanji || item.front || '?',
        rtkNum: item.rtkNum || 9999,
        keyword: item.keyword || item.meaning || '',
        meaning: item.meaning || item.keyword || '',
        onyomi: item.onyomi || '',
        kunyomi: item.kunyomi || '',
        koohii1: item.koohii1 || item.mnemonic || '',
        koohii2: item.koohii2 || '',
        onWords: item.onWords || '',
        kunWords: item.kunWords || '',
        strokeGif: item.strokeGif || `${item.kanji || 'card'}.gif`,
        jlpt: item.jlpt || 'N5',
        type: item.type || 'custom',
      };

      await tx.store.put(card);
      importedCount++;
    }

    await tx.done;
    return {
      success: true,
      count: importedCount,
      message: `Successfully imported ${importedCount} cards from JSON.`,
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err.message || 'Failed to parse JSON deck.' };
  }
}

export async function importApkgFile(file: File): Promise<ImportResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    const colFile = zip.file('collection.anki2') || zip.file('collection.anki21');
    if (!colFile) {
      return { success: false, count: 0, message: 'Invalid .apkg file (collection database missing).' };
    }

    // Load sql.js
    const initSqlJs = (window as any).initSqlJs;
    let SQL: any;
    if (initSqlJs) {
      SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
    } else {
      return { success: false, count: 0, message: 'SQL.js engine not initialized.' };
    }

    const arrayBuffer = await colFile.async('arraybuffer');
    const uInt8Array = new Uint8Array(arrayBuffer);
    const db = new SQL.Database(uInt8Array);

    const res = db.exec('SELECT id, flds FROM notes');
    if (!res || res.length === 0) {
      return { success: false, count: 0, message: 'No notes found in .apkg file.' };
    }

    const rows = res[0].values;
    const dbConn = await getDB();
    const tx = dbConn.transaction('cards', 'readwrite');
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const flds = (rows[i][1] as string).split('\x1f');
      const kanji = flds[0] || 'Custom';
      const keyword = flds[2] || flds[1] || 'Card';

      const card: KanjiCard = {
        id: `apkg_${Date.now()}_${i}`,
        kanji: kanji.replace(/<[^>]*>/g, ''),
        rtkNum: 9000 + i,
        keyword: keyword.replace(/<[^>]*>/g, ''),
        meaning: (flds[3] || keyword).replace(/<[^>]*>/g, ''),
        onyomi: flds[4] || '',
        kunyomi: flds[5] || '',
        koohii1: flds[6] || '',
        koohii2: flds[7] || '',
        onWords: flds[8] || '',
        kunWords: flds[9] || '',
        strokeGif: `${kanji}.gif`,
        jlpt: 'Custom',
        type: 'custom',
      };

      await tx.store.put(card);
      imported++;
    }

    await tx.done;
    return {
      success: true,
      count: imported,
      message: `Successfully imported ${imported} custom cards from Anki .apkg file!`,
    };
  } catch (err: any) {
    return { success: false, count: 0, message: err.message || 'Error processing .apkg file.' };
  }
}
