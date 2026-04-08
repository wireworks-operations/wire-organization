import { openDB, IDBPDatabase } from 'idb';
import { WireRoomData, Reel, Bin, Row } from '../types';

const DB_NAME = 'wire-room-layout-db';
const VERSION = 2;

const STORES = {
  REELS: 'reels',
  BINS: 'bins',
  ROWS: 'rows',
  CONFIG: 'config',
  LEGACY: 'layout-store'
} as const;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db, oldVersion) {
      // Create legacy store if it doesn't exist (e.g. fresh install of v2)
      if (!db.objectStoreNames.contains(STORES.LEGACY)) {
        db.createObjectStore(STORES.LEGACY);
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORES.REELS)) {
          db.createObjectStore(STORES.REELS);
        }
        if (!db.objectStoreNames.contains(STORES.BINS)) {
          db.createObjectStore(STORES.BINS);
        }
        if (!db.objectStoreNames.contains(STORES.ROWS)) {
          db.createObjectStore(STORES.ROWS);
        }
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG);
        }
      }
    },
  });
}

export async function saveLayout(data: WireRoomData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORES.REELS, STORES.BINS, STORES.ROWS, STORES.CONFIG], 'readwrite');

  // Clear existing data to maintain sync with the data object
  await Promise.all([
    tx.objectStore(STORES.REELS).clear(),
    tx.objectStore(STORES.BINS).clear(),
    tx.objectStore(STORES.ROWS).clear(),
    tx.objectStore(STORES.CONFIG).clear(),
  ]);

  // Save collections
  const promises: Promise<any>[] = [];

  Object.values(data.reels).forEach(reel => {
    promises.push(tx.objectStore(STORES.REELS).put(reel, reel.id));
  });

  Object.values(data.bins).forEach(bin => {
    promises.push(tx.objectStore(STORES.BINS).put(bin, bin.id));
  });

  Object.values(data.rows).forEach(row => {
    promises.push(tx.objectStore(STORES.ROWS).put(row, row.id));
  });

  // Save config/metadata
  const config = {
    version: data.version,
    unitsDefault: data.unitsDefault,
    layout: data.layout,
    metadata: data.metadata
  };
  promises.push(tx.objectStore(STORES.CONFIG).put(config, 'global-config'));

  await Promise.all(promises);
  await tx.done;
}

export async function loadLayout(): Promise<WireRoomData | null> {
  const db = await getDB();

  // 1. Migration Check
  const legacyData = await db.get(STORES.LEGACY, 'current-layout');
  if (legacyData) {
    console.log('Migrating legacy layout data to structured stores...');
    await saveLayout(legacyData);

    // Clear legacy data after successful migration
    const tx = db.transaction(STORES.LEGACY, 'readwrite');
    await tx.objectStore(STORES.LEGACY).delete('current-layout');
    await tx.done;

    return legacyData;
  }

  // 2. Load from new stores
  const tx = db.transaction([STORES.REELS, STORES.BINS, STORES.ROWS, STORES.CONFIG], 'readonly');

  const [reelsArray, binsArray, rowsArray, config] = await Promise.all([
    tx.objectStore(STORES.REELS).getAll() as Promise<Reel[]>,
    tx.objectStore(STORES.BINS).getAll() as Promise<Bin[]>,
    tx.objectStore(STORES.ROWS).getAll() as Promise<Row[]>,
    tx.objectStore(STORES.CONFIG).get('global-config')
  ]);

  // If no config exists, it's a fresh database (or everything was empty)
  if (!config && reelsArray.length === 0 && binsArray.length === 0 && rowsArray.length === 0) {
    return null;
  }

  // Reconstruct the Record structures
  const reels: Record<string, Reel> = {};
  reelsArray.forEach(r => reels[r.id] = r);

  const bins: Record<string, Bin> = {};
  binsArray.forEach(b => bins[b.id] = b);

  const rows: Record<string, Row> = {};
  rowsArray.forEach(r => rows[r.id] = r);

  return {
    version: config?.version || INITIAL_DATA.version,
    unitsDefault: config?.unitsDefault || INITIAL_DATA.unitsDefault,
    layout: config?.layout || INITIAL_DATA.layout,
    metadata: config?.metadata || INITIAL_DATA.metadata,
    reels,
    bins,
    rows
  };
}

export const INITIAL_DATA: WireRoomData = {
  version: "1.0.0",
  unitsDefault: "ft",
  reels: {},
  bins: {
    'bin-1': { id: 'bin-1', name: 'A1', color: '#3B82F6', reels: [], position: { x: 0, y: 0 }, order: 0 },
    'bin-2': { id: 'bin-2', name: 'A2', color: '#3B82F6', reels: [], position: { x: 1, y: 0 }, order: 1 },
    'bin-3': { id: 'bin-3', name: 'A3', color: '#3B82F6', reels: [], position: { x: 2, y: 0 }, order: 2 },
    'bin-4': { id: 'bin-4', name: 'A4', color: '#3B82F6', reels: [], position: { x: 3, y: 0 }, order: 3 },
    'bin-5': { id: 'bin-5', name: 'A5', color: '#3B82F6', reels: [], position: { x: 4, y: 0 }, order: 4 },
    'bin-6': { id: 'bin-6', name: 'A6', color: '#3B82F6', reels: [], position: { x: 5, y: 0 }, order: 5 },
    'bin-7': { id: 'bin-7', name: 'B1', color: '#10B981', reels: [], position: { x: 0, y: 1 }, order: 6 },
    'bin-8': { id: 'bin-8', name: 'B2', color: '#10B981', reels: [], position: { x: 1, y: 1 }, order: 7 },
    'bin-9': { id: 'bin-9', name: 'B3', color: '#10B981', reels: [], position: { x: 2, y: 1 }, order: 8 },
    'bin-10': { id: 'bin-10', name: 'B4', color: '#10B981', reels: [], position: { x: 3, y: 1 }, order: 9 },
    'bin-11': { id: 'bin-11', name: 'B5', color: '#10B981', reels: [], position: { x: 4, y: 1 }, order: 10 },
    'bin-12': { id: 'bin-12', name: 'B6', color: '#10B981', reels: [], position: { x: 5, y: 1 }, order: 11 },
  },
  rows: {
    'row-1': { id: 'row-1', name: 'Row 1 – Large Copper', reels: [], order: 0 },
    'row-2': { id: 'row-2', name: 'Row 2 – Aluminum', reels: [], order: 1 },
    'row-3': { id: 'row-3', name: 'Row 3 – Control Cable', reels: [], order: 2 },
    'row-4': { id: 'row-4', name: 'Row 4 – Misc', reels: [], order: 3 },
    'row-5': { id: 'row-5', name: 'Row 5 – Floor Stock', reels: [], order: 4 },
    'row-6': { id: 'row-6', name: 'Row 6 – Outside Storage', reels: [], order: 5 },
  },
  layout: {
    binGrid: { columns: 6 },
    rowCount: 6
  },
  metadata: {
    lastUpdatedBy: "System",
    lastUpdatedAt: Date.now()
  }
};
