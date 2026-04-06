export type Unit = "ft" | "m";
export type ReelStatus = "active" | "empty" | "damaged";
export type ReelSize = "Large" | "Medium" | "Small" | number;

export interface Reel {
  id: string;
  wireType: string;
  description: string;
  length: number;
  unit: Unit;
  reelSize: ReelSize;
  color: string;
  notes: string;
  status: ReelStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Bin {
  id: string;
  name: string;
  color: string;
  reels: string[]; // Array of Reel IDs
  position: { x: number; y: number };
}

export interface Row {
  id: string;
  name: string;
  reels: string[]; // Array of Reel IDs
  order: number;
}

export interface LayoutConfig {
  binGrid: { columns: number };
  rowCount: number;
}

export interface WireRoomData {
  version: string;
  unitsDefault: Unit;
  reels: Record<string, Reel>;
  bins: Record<string, Bin>;
  rows: Record<string, Row>;
  layout: LayoutConfig;
  metadata: {
    lastUpdatedBy: string;
    lastUpdatedAt: number;
  };
}

export interface HistoryState {
  past: WireRoomData[];
  present: WireRoomData;
  future: WireRoomData[];
}
