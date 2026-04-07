import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Settings, Trash2, Edit3, Move, Info, CheckCircle2, AlertCircle, Save, XCircle, Undo2, Redo2, Search, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Reel, Bin, Row, WireRoomData, Unit, ReelStatus, ReelSize, HistoryState } from '../types';
import { INITIAL_DATA, loadLayout, saveLayout } from '../lib/storage';
import { BinContainer } from './BinContainer';
import { RowContainer } from './RowContainer';
import { ReelCard } from './ReelCard';
import { ContextMenu } from './ContextMenu';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

export const WireRoomLayout: React.FC = () => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: INITIAL_DATA,
    future: []
  });
  const data = history.present;
  const setData = (newData: WireRoomData | ((prev: WireRoomData) => WireRoomData)) => {
    setHistory(prev => {
      const nextPresent = typeof newData === 'function' ? newData(prev.present) : newData;
      return {
        past: [...prev.past, prev.present].slice(-20), // Keep last 20 states
        present: nextPresent,
        future: []
      };
    });
  };

  const undo = () => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = prev.past.slice(0, prev.past.length - 1);
      const newPresent = prev.past[prev.past.length - 1];
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future]
      };
    });
  };

  const redo = () => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = prev.future.slice(1);
      const newPresent = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture
      };
    });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'reel' | 'bin' | 'row' | 'batch'; targetId: string } | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReelStatus | 'all'>('all');
  const [sizeFilter, setSizeFilter] = useState<ReelSize | 'all'>('all');

  // Modals
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<Partial<Reel> | null>(null);
  const [editingBin, setEditingBin] = useState<Partial<Bin> | null>(null);
  const [editingRow, setEditingRow] = useState<Partial<Row> | null>(null);
  const [batchEdit, setBatchEdit] = useState<{ status?: ReelStatus; color?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'reel' | 'bin' | 'row' | 'batch'; id: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const init = async () => {
      const saved = await loadLayout();
      if (saved) setHistory({ past: [], present: saved, future: [] });
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  useEffect(() => {
    if (!isLoading) {
      saveLayout(data);
    }
  }, [data, isLoading]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const reelId = active.id as string;
    setActiveReel(data.reels[reelId]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveReel(null);

    if (!over) return;

    const reelId = active.id as string;
    const overId = over.id as string;

    // Find current parent
    let sourceId = '';
    let sourceType: 'bin' | 'row' | null = null;

    for (const binId in data.bins) {
      if (data.bins[binId].reels.includes(reelId)) {
        sourceId = binId;
        sourceType = 'bin';
        break;
      }
    }
    if (!sourceId) {
      for (const rowId in data.rows) {
        if (data.rows[rowId].reels.includes(reelId)) {
          sourceId = rowId;
          sourceType = 'row';
          break;
        }
      }
    }

    // Determine target
    let targetId = overId;
    let targetType: 'bin' | 'row' | null = null;

    if (data.bins[overId]) targetType = 'bin';
    else if (data.rows[overId]) targetType = 'row';
    else {
      // If dropped over another reel, find its parent
      for (const binId in data.bins) {
        if (data.bins[binId].reels.includes(overId)) {
          targetId = binId;
          targetType = 'bin';
          break;
        }
      }
      if (!targetType) {
        for (const rowId in data.rows) {
          if (data.rows[rowId].reels.includes(overId)) {
            targetId = rowId;
            targetType = 'row';
            break;
          }
        }
      }
    }

    if (!targetType || (sourceId === targetId)) return;

    // Move reel
    const newData = { ...data };
    
    // Remove from source
    if (sourceType === 'bin') {
      newData.bins[sourceId].reels = newData.bins[sourceId].reels.filter(id => id !== reelId);
    } else if (sourceType === 'row') {
      newData.rows[sourceId].reels = newData.rows[sourceId].reels.filter(id => id !== reelId);
    }

    // Add to target
    if (targetType === 'bin') {
      newData.bins[targetId].reels = [...newData.bins[targetId].reels, reelId];
    } else if (targetType === 'row') {
      newData.rows[targetId].reels = [...newData.rows[targetId].reels, reelId];
    }

    newData.metadata.lastUpdatedAt = Date.now();
    setData(newData);
    addToast(`Moved reel to ${targetType === 'bin' ? newData.bins[targetId].name : newData.rows[targetId].name}`);
  };

  const handleToggleSelect = (id: string, shiftKey: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredReels = useCallback((reelIds: string[]) => {
    return reelIds
      .map(id => data.reels[id])
      .filter(Boolean)
      .filter(reel => {
        const matchesSearch = searchQuery === '' || 
          reel.wireType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reel.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reel.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || reel.status === statusFilter;
        const matchesSize = sizeFilter === 'all' || reel.reelSize === sizeFilter;

        return matchesSearch && matchesStatus && matchesSize;
      });
  }, [data.reels, searchQuery, statusFilter, sizeFilter]);

  const handleBatchOperation = (operation: 'status' | 'color' | 'move', value: any) => {
    const newData = { ...data };
    selectedIds.forEach(id => {
      if (newData.reels[id]) {
        if (operation === 'status') newData.reels[id].status = value;
        if (operation === 'color') newData.reels[id].color = value;
      }
    });

    if (operation === 'move') {
      const targetId = value.id;
      const targetType = value.type;

      // Remove from all containers
      Object.values(newData.bins).forEach((b: Bin) => b.reels = b.reels.filter(rid => !selectedIds.has(rid)));
      Object.values(newData.rows).forEach((r: Row) => r.reels = r.reels.filter(rid => !selectedIds.has(rid)));

      // Add to target
      if (targetType === 'bin') {
        newData.bins[targetId].reels = [...newData.bins[targetId].reels, ...Array.from(selectedIds)];
      } else {
        newData.rows[targetId].reels = [...newData.rows[targetId].reels, ...Array.from(selectedIds)];
      }
    }

    newData.metadata.lastUpdatedAt = Date.now();
    setData(newData);
    setSelectedIds(new Set());
    addToast(`Batch ${operation} updated for ${selectedIds.size} reels`);
  };

  const handleFilterByProperty = (property: 'wireType' | 'status' | 'reelSize', value: string) => {
    if (property === 'wireType') {
      setSearchQuery(value);
    } else if (property === 'status') {
      setStatusFilter(value as any);
    } else if (property === 'reelSize') {
      setSizeFilter(value as any);
    }
    addToast(`Filtered by ${property}: ${value}`);
  };

  const handleReelContextMenu = (e: React.MouseEvent, reel: Reel) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'reel', targetId: reel.id });
  };

  const handleBinContextMenu = (e: React.MouseEvent, bin: Bin) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'bin', targetId: bin.id });
  };

  const handleRowContextMenu = (e: React.MouseEvent, row: Row) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'row', targetId: row.id });
  };

  // CRUD Operations
  const saveReel = (reel: Partial<Reel>) => {
    const id = reel.id || uuidv4();
    const isNew = !reel.id;
    const now = Date.now();
    
    const fullReel: Reel = {
      id,
      wireType: reel.wireType || 'UNKNOWN',
      description: reel.description || '',
      length: reel.length || 0,
      unit: reel.unit || data.unitsDefault,
      reelSize: reel.reelSize || 'Medium',
      color: reel.color || '#3B82F6',
      notes: reel.notes || '',
      status: reel.status || 'active',
      createdAt: reel.createdAt || now,
      updatedAt: now,
    };

    const newData = { ...data };
    newData.reels[id] = fullReel;

    if (isNew) {
      // Add to first row by default if new
      const firstRowId = Object.keys(data.rows)[0];
      if (firstRowId) {
        newData.rows[firstRowId].reels.push(id);
      }
    }

    newData.metadata.lastUpdatedAt = now;
    setData(newData);
    setIsReelModalOpen(false);
    setEditingReel(null);
    addToast(isNew ? "Reel added successfully" : "Reel updated successfully");
  };

  const deleteEntity = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    const newData = { ...data };

    if (type === 'reel') {
      delete newData.reels[id];
      // Remove from bins/rows
      Object.values(newData.bins).forEach((b: Bin) => b.reels = b.reels.filter(rid => rid !== id));
      Object.values(newData.rows).forEach((r: Row) => r.reels = r.reels.filter(rid => rid !== id));
    } else if (type === 'batch') {
      selectedIds.forEach(rid => {
        delete newData.reels[rid];
        Object.values(newData.bins).forEach((b: Bin) => b.reels = b.reels.filter(id => id !== rid));
        Object.values(newData.rows).forEach((r: Row) => r.reels = r.reels.filter(id => id !== rid));
      });
      setSelectedIds(new Set());
    } else if (type === 'bin') {
      const bin = newData.bins[id] as Bin;
      // Move reels to first row
      const firstRowId = Object.keys(newData.rows)[0];
      if (firstRowId) {
        (newData.rows[firstRowId] as Row).reels.push(...bin.reels);
      }
      delete newData.bins[id];
    } else if (type === 'row') {
      const row = newData.rows[id] as Row;
      // Move reels to first bin if exists, else first row
      const firstBinId = Object.keys(newData.bins)[0];
      const otherRowId = Object.keys(newData.rows).find(rid => rid !== id);
      if (firstBinId) {
        (newData.bins[firstBinId] as Bin).reels.push(...row.reels);
      } else if (otherRowId) {
        (newData.rows[otherRowId] as Row).reels.push(...row.reels);
      }
      delete newData.rows[id];
    }

    newData.metadata.lastUpdatedAt = Date.now();
    setData(newData);
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} removed`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Wire Room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase italic">
                Wire Room <span className="text-blue-600">Layout</span>
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Visual Inventory & Racking System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reels by ID, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={history.past.length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={redo}
                disabled={history.future.length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingReel({}); setIsReelModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-100 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              ADD REEL
            </button>
            <button
              onClick={() => { setEditingBin({}); setIsBinModalOpen(true); }}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              ADD BIN
            </button>
            <button
              onClick={() => { setEditingRow({}); setIsRowModalOpen(true); }}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              ADD ROW
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2" />
            <button
              onClick={() => {
                const newUnit = data.unitsDefault === 'ft' ? 'm' : 'ft';
                setData({ ...data, unitsDefault: newUnit });
                addToast(`Default unit changed to ${newUnit}`);
              }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm transition-all uppercase tracking-wider"
            >
              UNIT: {data.unitsDefault}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col gap-12">
        {/* Batch Operations Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-gray-800"
            >
              <div className="flex items-center gap-3 pr-6 border-r border-gray-700">
                <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {selectedIds.size}
                </span>
                <span className="text-sm font-bold uppercase tracking-wider">Reels Selected</span>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsBatchModalOpen(true)}
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  <Edit3 className="w-4 h-4" />
                  Batch Edit
                </button>
                <button 
                  onClick={() => {
                    setDeleteTarget({ type: 'batch', id: 'batch' });
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove All
                </button>
                <button 
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  <XCircle className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filters:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="empty">Empty</option>
            <option value="damaged">Damaged</option>
          </select>
          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sizes</option>
            <option value="Large">Large</option>
            <option value="Medium">Medium</option>
            <option value="Small">Small</option>
          </select>

          {(statusFilter !== 'all' || sizeFilter !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSizeFilter('all');
                setSearchQuery('');
                addToast('Filters cleared');
              }}
              className="ml-auto flex items-center gap-2 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest transition-colors"
            >
              <XCircle className="w-3 h-3" />
              Clear All Filters
            </button>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Racking Bins Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="text-blue-600 w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight italic">
                  Racking Bins <span className="text-gray-400 font-medium not-italic ml-2 text-sm">Wall Mounted</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Info className="w-3 h-3" />
                Right-click to edit bins or reels
              </div>
            </div>

            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${data.layout.binGrid.columns}, minmax(0, 1fr))` }}
            >
              {(Object.values(data.bins) as Bin[]).map(bin => (
                <BinContainer
                  key={bin.id}
                  bin={bin}
                  reels={filteredReels(bin.reels)}
                  onReelContextMenu={handleReelContextMenu}
                  onBinContextMenu={handleBinContextMenu}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onFilterByProperty={handleFilterByProperty}
                />
              ))}
            </div>
          </section>

          {/* Reel Rows */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Move className="text-amber-600 w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight italic">
                  Reel Rows <span className="text-gray-400 font-medium not-italic ml-2 text-sm">Floor Storage</span>
                </h2>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {(Object.values(data.rows) as Row[])
                .sort((a, b) => a.order - b.order)
                .map(row => (
                  <RowContainer
                    key={row.id}
                    row={row}
                    reels={filteredReels(row.reels)}
                    onReelContextMenu={handleReelContextMenu}
                    onRowContextMenu={handleRowContextMenu}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onFilterByProperty={handleFilterByProperty}
                  />
                ))}
            </div>
          </section>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeReel ? (
              <div className="w-[240px] rotate-3 scale-105 shadow-2xl">
                <ReelCard reel={activeReel} onContextMenu={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Context Menus */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.type === 'reel' ? (
              selectedIds.has(contextMenu.targetId) && selectedIds.size > 1 ? [
                { label: `Edit ${selectedIds.size} Reels`, icon: <Edit3 />, onClick: () => setIsBatchModalOpen(true) },
                { label: `Remove ${selectedIds.size} Reels`, icon: <Trash2 />, variant: 'danger', onClick: () => { setDeleteTarget({ type: 'batch', id: 'batch' }); setIsDeleteModalOpen(true); } },
                { label: 'Clear Selection', icon: <XCircle />, onClick: () => setSelectedIds(new Set()) },
              ] : [
                { label: 'Edit Reel', icon: <Edit3 />, onClick: () => { setEditingReel(data.reels[contextMenu.targetId]); setIsReelModalOpen(true); } },
                { label: 'Duplicate', icon: <Plus />, onClick: () => { 
                  const reel = data.reels[contextMenu.targetId];
                  saveReel({ ...reel, id: undefined, createdAt: undefined });
                }},
                { label: 'Remove Reel', icon: <Trash2 />, variant: 'danger', onClick: () => { setDeleteTarget({ type: 'reel', id: contextMenu.targetId }); setIsDeleteModalOpen(true); } },
              ]
            ) : contextMenu.type === 'bin' ? [
              { label: 'Edit Bin', icon: <Edit3 />, onClick: () => { setEditingBin(data.bins[contextMenu.targetId]); setIsBinModalOpen(true); } },
              { label: 'Clear Bin', icon: <XCircle />, onClick: () => {
                const newData = { ...data };
                const bin = newData.bins[contextMenu.targetId];
                const firstRowId = Object.keys(data.rows)[0];
                if (firstRowId) {
                  newData.rows[firstRowId].reels.push(...bin.reels);
                  bin.reels = [];
                  setData(newData);
                  addToast("Bin cleared, reels moved to floor");
                }
              }},
              { label: 'Delete Bin', icon: <Trash2 />, variant: 'danger', onClick: () => { setDeleteTarget({ type: 'bin', id: contextMenu.targetId }); setIsDeleteModalOpen(true); } },
            ] : [
              { label: 'Edit Row', icon: <Edit3 />, onClick: () => { setEditingRow(data.rows[contextMenu.targetId]); setIsRowModalOpen(true); } },
              { label: 'Delete Row', icon: <Trash2 />, variant: 'danger', onClick: () => { setDeleteTarget({ type: 'row', id: contextMenu.targetId }); setIsDeleteModalOpen(true); } },
            ]
          }
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={isReelModalOpen}
        onClose={() => setIsReelModalOpen(false)}
        title={editingReel?.id ? "Edit Wire Reel" : "Add New Wire Reel"}
        footer={
          <>
            <button onClick={() => setIsReelModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">CANCEL</button>
            <button onClick={() => saveReel(editingReel || {})} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center gap-2">
              <Save className="w-4 h-4" />
              SAVE REEL
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wire Type / ID</label>
            <input
              type="text"
              value={editingReel?.wireType || ''}
              onChange={e => setEditingReel({ ...editingReel, wireType: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. K6A3CU"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</label>
            <input
              type="text"
              value={editingReel?.description || ''}
              onChange={e => setEditingReel({ ...editingReel, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. 3C #6 CU RW90"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Length</label>
            <input
              type="number"
              value={editingReel?.length || ''}
              onChange={e => setEditingReel({ ...editingReel, length: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unit</label>
            <select
              value={editingReel?.unit || data.unitsDefault}
              onChange={e => setEditingReel({ ...editingReel, unit: e.target.value as Unit })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="ft">Feet (ft)</option>
              <option value="m">Meters (m)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
            <select
              value={editingReel?.status || 'active'}
              onChange={e => setEditingReel({ ...editingReel, status: e.target.value as ReelStatus })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="active">Active</option>
              <option value="empty">Empty</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Color Theme</label>
            <input
              type="color"
              value={editingReel?.color || '#3B82F6'}
              onChange={e => setEditingReel({ ...editingReel, color: e.target.value })}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={`Batch Edit (${selectedIds.size} Reels)`}
        footer={
          <>
            <button onClick={() => setIsBatchModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">CANCEL</button>
            <button
              onClick={() => {
                if (batchEdit.status) handleBatchOperation('status', batchEdit.status);
                if (batchEdit.color) handleBatchOperation('color', batchEdit.color);
                setIsBatchModalOpen(false);
                setBatchEdit({});
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              APPLY CHANGES
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
            <Info className="text-blue-600 w-5 h-5" />
            <p className="text-xs font-medium text-blue-800">
              Changes will be applied to all {selectedIds.size} selected reels. Leave fields empty to keep current values.
            </p>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Update Status</label>
            <select
              value={batchEdit.status || ''}
              onChange={e => setBatchEdit({ ...batchEdit, status: e.target.value as ReelStatus })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">No Change</option>
              <option value="active">Active</option>
              <option value="empty">Empty</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Update Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={batchEdit.color || '#3B82F6'}
                onChange={e => setBatchEdit({ ...batchEdit, color: e.target.value })}
                className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {batchEdit.color || 'No Change'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Move to Location</label>
            <select
              onChange={e => {
                const [type, id] = e.target.value.split(':');
                if (type && id) handleBatchOperation('move', { type, id });
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Select Target...</option>
              <optgroup label="Racking Bins">
                {(Object.values(data.bins) as Bin[]).map(bin => (
                  <option key={bin.id} value={`bin:${bin.id}`}>{bin.name}</option>
                ))}
              </optgroup>
              <optgroup label="Reel Rows">
                {(Object.values(data.rows) as Row[]).map(row => (
                  <option key={row.id} value={`row:${row.id}`}>{row.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBinModalOpen}
        onClose={() => setIsBinModalOpen(false)}
        title={editingBin?.id ? "Edit Racking Bin" : "Add New Racking Bin"}
        footer={
          <>
            <button onClick={() => setIsBinModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">CANCEL</button>
            <button
              onClick={() => {
                const id = editingBin?.id || uuidv4();
                const newData = { ...data };
                newData.bins[id] = {
                  id,
                  name: editingBin?.name || 'New Bin',
                  color: editingBin?.color || '#3B82F6',
                  reels: editingBin?.reels || [],
                  position: editingBin?.position || { x: 0, y: 0 }
                } as Bin;
                setData(newData);
                setIsBinModalOpen(false);
                addToast("Bin saved");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              SAVE BIN
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bin Name</label>
            <input
              type="text"
              value={editingBin?.name || ''}
              onChange={e => setEditingBin({ ...editingBin, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. C4"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bin Color</label>
            <input
              type="color"
              value={editingBin?.color || '#3B82F6'}
              onChange={e => setEditingBin({ ...editingBin, color: e.target.value })}
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRowModalOpen}
        onClose={() => setIsRowModalOpen(false)}
        title={editingRow?.id ? "Edit Reel Row" : "Add New Reel Row"}
        footer={
          <>
            <button onClick={() => setIsRowModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">CANCEL</button>
            <button
              onClick={() => {
                const id = editingRow?.id || uuidv4();
                const newData = { ...data };
                newData.rows[id] = {
                  id,
                  name: editingRow?.name || 'New Row',
                  reels: editingRow?.reels || [],
                  order: editingRow?.order ?? Object.keys(data.rows).length
                } as Row;
                setData(newData);
                setIsRowModalOpen(false);
                addToast("Row saved");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              SAVE ROW
            </button>
          </>
        }
      >
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Row Name</label>
          <input
            type="text"
            value={editingRow?.name || ''}
            onChange={e => setEditingRow({ ...editingRow, name: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g. Row 7 – Special Projects"
          />
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Removal"
        variant="danger"
        footer={
          <>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 font-bold text-gray-500 hover:text-gray-700">CANCEL</button>
            <button onClick={deleteEntity} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-red-100">
              REMOVE PERMANENTLY
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-600 w-8 h-8" />
          </div>
          <p className="text-gray-600 font-medium">
            Are you sure you want to remove this {deleteTarget?.type}? This action cannot be undone.
            {deleteTarget?.type !== 'reel' && " Any reels inside will be moved to the floor storage."}
          </p>
        </div>
      </Modal>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[3000] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm border",
                toast.type === 'success' ? "bg-white text-green-700 border-green-100" : "bg-white text-red-700 border-red-100"
              )}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-12 border-t border-gray-100 mt-12">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            Made With ❤️ By Lucas and Cline 🤖
          </div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            EECOL Wire Tools 2026 - Enterprise Edition
          </div>
        </div>
      </footer>
    </div>
  );
};
