import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, variant = 'default' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className={cn(
              "px-6 py-4 flex items-center justify-between border-b",
              variant === 'danger' ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
            )}>
              <h2 className={cn(
                "text-lg font-bold tracking-tight",
                variant === 'danger' ? "text-red-700" : "text-gray-900"
              )}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {children}
            </div>

            {footer && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
