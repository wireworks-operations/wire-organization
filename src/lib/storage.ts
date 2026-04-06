import { openDB, IDBPDatabase } from 'idb';
import { WireRoomData } from '../types';

const DB_NAME = 'wire-room-layout-db';
const STORE_NAME = 'layout-store';
const VERSION = 1;

export async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveLayout(data: WireRoomData): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, data, 'current-layout');
}

export async function loadLayout(): Promise<WireRoomData | null> {
  const db = await getDB();
  return db.get(STORE_NAME, 'current-layout');
}

export const INITIAL_DATA: WireRoomData = {
  version: "1.0.0",
  unitsDefault: "ft",
  reels: {},
  bins: {
    'bin-1': { id: 'bin-1', name: 'A1', color: '#3B82F6', reels: [], position: { x: 0, y: 0 } },
    'bin-2': { id: 'bin-2', name: 'A2', color: '#3B82F6', reels: [], position: { x: 1, y: 0 } },
    'bin-3': { id: 'bin-3', name: 'A3', color: '#3B82F6', reels: [], position: { x: 2, y: 0 } },
    'bin-4': { id: 'bin-4', name: 'A4', color: '#3B82F6', reels: [], position: { x: 3, y: 0 } },
    'bin-5': { id: 'bin-5', name: 'A5', color: '#3B82F6', reels: [], position: { x: 4, y: 0 } },
    'bin-6': { id: 'bin-6', name: 'A6', color: '#3B82F6', reels: [], position: { x: 5, y: 0 } },
    'bin-7': { id: 'bin-7', name: 'B1', color: '#10B981', reels: [], position: { x: 0, y: 1 } },
    'bin-8': { id: 'bin-8', name: 'B2', color: '#10B981', reels: [], position: { x: 1, y: 1 } },
    'bin-9': { id: 'bin-9', name: 'B3', color: '#10B981', reels: [], position: { x: 2, y: 1 } },
    'bin-10': { id: 'bin-10', name: 'B4', color: '#10B981', reels: [], position: { x: 3, y: 1 } },
    'bin-11': { id: 'bin-11', name: 'B5', color: '#10B981', reels: [], position: { x: 4, y: 1 } },
    'bin-12': { id: 'bin-12', name: 'B6', color: '#10B981', reels: [], position: { x: 5, y: 1 } },
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

