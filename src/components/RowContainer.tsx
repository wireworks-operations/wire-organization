import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Row, Reel } from '../types';
import { ReelCard } from './ReelCard';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface RowContainerProps {
  row: Row;
  reels: Reel[];
  onReelContextMenu: (e: React.MouseEvent, reel: Reel) => void;
  onEditReel?: (reel: Reel) => void;
  onRowContextMenu: (e: React.MouseEvent, row: Row) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onFilterByProperty?: (property: 'wireType' | 'status' | 'reelSize', value: string) => void;
  isEditBinsMode?: boolean;
}

export const RowContainer: React.FC<RowContainerProps> = ({
  row,
  reels,
  onReelContextMenu,
  onEditReel,
  onRowContextMenu,
  selectedIds,
  onToggleSelect,
  onFilterByProperty,
  isEditBinsMode = false
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: row.id,
    data: {
      type: 'row',
      row,
    },
    disabled: isEditBinsMode
  });

  return (
    <div
      ref={setNodeRef}
      onContextMenu={(e) => !isEditBinsMode && onRowContextMenu(e, row)}
      className={cn(
        "flex flex-col min-h-[120px] rounded-xl border-2 transition-all duration-300",
        "bg-white shadow-sm overflow-hidden",
        isOver ? "border-amber-500 ring-4 ring-amber-500/10 scale-[1.01]" : "border-gray-100",
        isEditBinsMode ? "opacity-80" : ""
      )}
    >
      <div className="px-4 py-2 flex items-center justify-between border-b bg-gray-50/50">
        <h3 className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {row.name}
        </h3>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {reels.length} {reels.length === 1 ? 'REEL' : 'REELS'}
        </span>
      </div>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 flex-grow">
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
          <div className="col-span-full flex-grow flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg py-4">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              EMPTY ROW
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
