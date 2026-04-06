# 📦 Wire Room Racking & Reel Location Tool

**Design Specification (`DESIGN.md`)**

## 1. Purpose & Scope

The **Wire Room Racking Bin Location Tool** provides a **visual, interactive inventory layout** of the wire room, enabling warehouse staff to:

*   Visually configure racking bins and reel rows
*   Assign wire reels to bins or rows
*   Track reel properties (length, unit, size, color, status)
*   Reorganize via drag‑and‑drop
*   Edit items via right‑click context menus
*   Maintain persistent state using IndexedDB
*   Align fully with Wire‑Tools Suite UX, modal system, and data philosophy

This tool is **not a cut log** and **not a transactional system** — it represents **physical location + organization state**.

***

## 2. Conceptual Model (Mental Map)

There are **two parallel spatial systems**:

### A️⃣ Racking Bins (Vertical / Wall Mounted)

*   Named bins (e.g., `A1`, `B3`, `RACK-04`)
*   Each bin can hold **multiple reels**
*   Bins are **visually laid out** in a grid
*   Bins can be:
    *   Renamed
    *   Recolored
    *   Reordered
    *   Removed (with confirmation)

### B️⃣ Reel Rows (Floor / Outside Storage)

*   Represents freestanding or floor racks
*   Default: **6 rows**
*   Each row:
    *   Has a name (e.g., `Row 1 – Large Copper`)
    *   Contains multiple reels
*   Rows can be:
    *   Added / removed
    *   Reordered vertically
    *   Styled independently

> 📌 **Bins and Rows share the same Reel object model**

***

## 3. Data Architecture

### 3.1 Core Entities

#### `Reel`

```js
{
  id: "reel-uuid",
  wireType: "K6A3CU",
  description: "3C #6 CU RW90",
  length: 2150,
  unit: "ft" | "m",
  reelSize: "Large" | "Medium" | "Small" | number,
  color: "#FBBF24",
  notes: "",
  status: "active" | "empty" | "damaged",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

***

#### `Bin`

```js
{
  id: "bin-uuid",
  name: "A1",
  color: "#3B82F6",
  reels: ["reel-uuid", "..."],
  position: { x: 0, y: 0 }
}
```

***

#### `Row`

```js
{
  id: "row-uuid",
  name: "Row 3 – Aluminum",
  reels: ["reel-uuid", "..."],
  order: 2
}
```

***

### 3.2 Root Storage Object

```js
{
  version: "1.0.0",
  unitsDefault: "ft",
  reels: {},
  bins: {},
  rows: {},
  layout: {
    binGrid: { columns: 6 },
    rowCount: 6
  },
  metadata: {
    lastUpdatedBy: "",
    lastUpdatedAt: timestamp
  }
}
```

***

## 4. Persistence Strategy

✅ **IndexedDB first**  
✅ `localStorage` fallback  
✅ Same implementation pattern as Cut Log Tool

*   Object store: `wire-room-layout`
*   Auto-save on:
    *   Drag & drop
    *   Property edit
    *   Add/remove entities
*   Versioned schema (future‑safe)

***

## 5. UI Layout Structure

### 5.1 High-Level Sections

    ┌─────────────────────────────────────┐
    │ Header: Wire Room Layout            │
    ├─────────────────────────────────────┤
    │ Controls Bar                        │
    │ [+ Bin] [+ Reel] [+ Row] [Units]   │
    ├─────────────────────────────────────┤
    │ RACKING BINS (Visual Grid)           │
    │ ┌───┬───┬───┐                       │
    │ │A1 │A2 │A3 │   ← drag reels        │
    │ ├───┼───┼───┤                       │
    │ │B1 │B2 │B3 │                       │
    │ └───┴───┴───┘                       │
    ├─────────────────────────────────────┤
    │ REEL ROWS                           │
    │ ┌──────────── Row 1 ────────────┐ │
    │ ┌──────────── Row 2 ────────────┐ │
    │ ...                               │
    └─────────────────────────────────────┘

***

## 6. Interaction Systems

### 6.1 Drag & Drop

*   Reels can be dragged:
    *   Between bins
    *   Between rows
    *   Bin → Row and Row → Bin
*   Visual ghost + highlight target
*   On drop:
    *   Update parent container
    *   Persist state
    *   Toast confirmation

***

### 6.2 Right‑Click Context Menus

**Custom (no browser menu)**  
Triggered via `contextmenu` event.

#### Reel Context Menu

*   Edit Properties
*   Change Color
*   Change Length / Unit
*   Move To…
*   Remove (confirmation modal)

#### Bin Context Menu

*   Rename
*   Change Color
*   Clear Bin
*   Delete Bin

#### Row Context Menu

*   Rename Row
*   Move Up / Down
*   Delete Row

***

## 7. Modal & Notification System

✅ **Reuses existing custom modal pattern**  
✅ No browser alerts  
✅ Matches screenshots you shared

### Modal Types

*   Edit Reel
*   Add Bin
*   Add Row
*   Confirmation (Remove / Clear)
*   Success / Error

***

## 8. Units & Length Handling

*   Global default unit (ft / m)
*   Reel-level override allowed
*   Conversion is **display-only**
*   Stored length is **unit + value**, not normalized

```js
{ length: 500, unit: "m" }
```

***

## 9. Styling Rules

*   Tailwind utilities only
*   Shared EECOL theme
*   Colors stored per entity (bins/reels)
*   No CSS changes without explicit approval ✅ (suite rule respected)
