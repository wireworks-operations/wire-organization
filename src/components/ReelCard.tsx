import React from 'react';
import { motion } from 'motion/react';
import { Reel } from '../types';
import { cn } from '../lib/utils';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Filter, Edit3 } from 'lucide-react';

interface ReelCardProps {
  reel: Reel;
  onContextMenu: (e: React.MouseEvent, reel: Reel) => void;
  onEdit?: (reel: Reel) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string, shiftKey: boolean) => void;
  onFilterByProperty?: (property: 'wireType' | 'status' | 'reelSize', value: string) => void;
  disabled?: boolean;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  onContextMenu,
  onEdit,
  isSelected,
  onToggleSelect,
  onFilterByProperty,
  disabled = false
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: reel.id,
    data: {
      type: 'reel',
      reel,
    },
    disabled
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : undefined,
  };

  const handleToggleSelect = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(reel.id, e.shiftKey);
    }
  };

  const handleFilterClick = (e: React.MouseEvent, prop: 'wireType' | 'status' | 'reelSize', val: string) => {
    if (onFilterByProperty) {
      e.stopPropagation();
      onFilterByProperty(prop, val);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    if (onEdit) {
      e.stopPropagation();
      onEdit(reel);
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      onContextMenu={(e) => !disabled && onContextMenu(e, reel)}
      onClick={handleToggleSelect}
      className={cn(
        "group relative p-3 rounded-lg border-2 shadow-sm",
        !disabled ? "cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200" : "cursor-default opacity-80",
        isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100",
        isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : ""
      )}
      style={{
        ...style,
        backgroundColor: reel.color + '20', // 12% opacity
        borderColor: isSelected ? undefined : reel.color,
      }}
      whileHover={!disabled ? { y: -2 } : undefined}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm z-10">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {/* Edit Button */}
      {!disabled && (
        <button
          onClick={handleEditClick}
          className="absolute -top-2 -left-2 w-7 h-7 bg-white border-2 border-gray-100 text-gray-400 rounded-full flex items-center justify-center shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 hover:border-blue-100"
          title="Edit Reel"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => handleFilterClick(e, 'wireType', reel.wireType)}
            className="text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            title="Filter by this wire type"
          >
            {reel.wireType}
            <Filter className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <span className="text-[10px] font-mono text-gray-400">#{reel.id.slice(0, 4)}</span>
        </div>
        
        <span className="text-sm font-medium text-gray-900 truncate">
          {reel.description}
        </span>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-mono font-semibold text-gray-700">
            {reel.length} {reel.unit}
          </span>
          <button
            onClick={(e) => handleFilterClick(e, 'status', reel.status)}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase transition-all hover:ring-2 hover:ring-offset-1",
              reel.status === 'active' ? "bg-green-100 text-green-700 hover:ring-green-200" :
              reel.status === 'damaged' ? "bg-red-100 text-red-700 hover:ring-red-200" : "bg-gray-100 text-gray-700 hover:ring-gray-200"
            )}
            title="Filter by this status"
          >
            {reel.status}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
