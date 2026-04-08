import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Bin, Reel } from '../types';
import { ReelCard } from './ReelCard';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface BinContainerProps {
  bin: Bin;
  reels: Reel[];
  onReelContextMenu: (e: React.MouseEvent, reel: Reel) => void;
  onEditReel?: (reel: Reel) => void;
  onBinContextMenu: (e: React.MouseEvent, bin: Bin) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onFilterByProperty?: (property: 'wireType' | 'status' | 'reelSize', value: string) => void;
  isEditBinsMode?: boolean;
}

export const BinContainer: React.FC<BinContainerProps> = ({
  bin,
  reels,
  onReelContextMenu,
  onEditReel,
  onBinContextMenu,
  selectedIds,
  onToggleSelect,
  onFilterByProperty,
  isEditBinsMode = false
}) => {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: bin.id,
    data: {
      type: 'bin',
      bin,
    },
    disabled: isEditBinsMode
  });

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: bin.id,
    disabled: !isEditBinsMode
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  const setRefs = (node: HTMLDivElement | null) => {
    setDroppableRef(node);
    setSortableRef(node);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      onContextMenu={(e) => !isEditBinsMode && onBinContextMenu(e, bin)}
      className={cn(
        "flex flex-col min-h-[160px] rounded-xl border-2 transition-all duration-300",
        "bg-white shadow-sm overflow-hidden relative",
        isOver ? "border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]" : "border-gray-100",
        isEditBinsMode ? "cursor-default" : "",
        isDragging ? "opacity-50 scale-95 z-50 shadow-2xl ring-4 ring-amber-500/20" : ""
      )}
    >
      <div
        className="px-4 py-2 flex items-center justify-between border-b"
        style={{ backgroundColor: bin.color + '10', borderColor: bin.color + '30' }}
      >
        <h3 className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
          {isEditBinsMode && (
            <div
              {...attributes}
              {...listeners}
              className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing text-gray-400"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bin.color }} />
          {bin.name}
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {reels.length} {reels.length === 1 ? 'REEL' : 'REELS'}
        </span>
      </div>

      <div className={cn(
        "p-3 gap-2 flex-grow",
        reels.length > 4 ? "grid grid-cols-2" : "flex flex-col"
      )}>
        <SortableContext items={reels.map(r => r.id)} strategy={rectSortingStrategy}>
          {reels.length > 0 ? (
            reels.map(reel => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onContextMenu={onReelContextMenu}
                onEdit={onEditReel}
                isSelected={selectedIds.has(reel.id)}
                onToggleSelect={onToggleSelect}
                onFilterByProperty={onFilterByProperty}
                disabled={isEditBinsMode}
              />
            ))
          ) : (
            <div className="flex-grow flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                EMPTY BIN
              </span>
            </div>
          )}
        </SortableContext>
      </div>

      {isEditBinsMode && (
        <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
      )}
    </div>
  );
};
