import React from 'react';
import { useDroppable } from '@dnd-kit/core';
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
}

export const BinContainer: React.FC<BinContainerProps> = ({ bin, reels, onReelContextMenu, onEditReel, onBinContextMenu, selectedIds, onToggleSelect, onFilterByProperty }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: bin.id,
    data: {
      type: 'bin',
      bin,
    },
  });

  return (
    <div
      ref={setNodeRef}
      onContextMenu={(e) => onBinContextMenu(e, bin)}
      className={cn(
        "flex flex-col min-h-[160px] rounded-xl border-2 transition-all duration-300",
        "bg-white shadow-sm overflow-hidden",
        isOver ? "border-blue-500 ring-4 ring-blue-500/10 scale-[1.02]" : "border-gray-100"
      )}
    >
      <div
        className="px-4 py-2 flex items-center justify-between border-b"
        style={{ backgroundColor: bin.color + '10', borderColor: bin.color + '30' }}
      >
        <h3 className="font-bold text-gray-800 tracking-tight flex items-center gap-2">
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
            />
          ))
        ) : (
          <div className="flex-grow flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
              EMPTY BIN
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
