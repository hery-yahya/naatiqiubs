/**
 * Penyimpanan riwayat audio di browser memakai IndexedDB.
 *
 * Dulu riwayat disimpan di localStorage (± 5 MB) yang cepat penuh oleh audio,
 * sehingga riwayat hilang diam-diam. IndexedDB menampung jauh lebih banyak.
 */

import type { HistoryItem } from '../components/HistoryList';

const DB_NAME = 'naatiq';
const DB_VERSION = 1;
const STORE = 'history';
const LEGACY_KEY = 'gemini_arabic_tts_history';

/** Jumlah maksimal audio yang disimpan; yang paling lama otomatis dihapus. */
export const MAX_HISTORY_ITEMS = 30;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getAllSorted(db: IDBDatabase): Promise<HistoryItem[]> {
  const tx = db.transaction(STORE, 'readonly');
  const items = await requestToPromise(tx.objectStore(STORE).getAll() as IDBRequest<HistoryItem[]>);
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

async function prune(db: IDBDatabase): Promise<void> {
  const items = await getAllSorted(db);
  const extra = items.slice(MAX_HISTORY_ITEMS);
  if (extra.length === 0) return;
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  extra.forEach((item) => store.delete(item.id));
  await txDone(tx);
}

/** Pindahkan riwayat lama dari localStorage (sekali saja). */
async function migrateLegacy(db: IDBDatabase): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const legacy = JSON.parse(raw);
    if (Array.isArray(legacy) && legacy.length > 0) {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      legacy.forEach((item: HistoryItem) => {
        if (item && item.id && item.audioBase64) store.put(item);
      });
      await txDone(tx);
    }
  } catch {
    // data lama rusak; abaikan
  }
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // abaikan
  }
}

/** Muat semua riwayat, terbaru di atas. */
export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const db = await openDb();
    await migrateLegacy(db);
    await prune(db);
    return await getAllSorted(db);
  } catch (err) {
    console.warn('Riwayat tidak bisa dimuat:', err);
    return [];
  }
}

/** Simpan satu audio baru ke riwayat. */
export async function addHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    await txDone(tx);
    await prune(db);
  } catch (err) {
    console.warn('Audio tidak bisa disimpan ke riwayat:', err);
  }
}

/** Hapus semua riwayat. */
export async function clearHistoryStore(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await txDone(tx);
  } catch (err) {
    console.warn('Riwayat tidak bisa dihapus:', err);
  }
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // abaikan
  }
}
