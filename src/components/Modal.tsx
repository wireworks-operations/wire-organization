import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
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
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border-[3px]",
              variant === 'danger' ? "border-[#FF1744]" : "border-[#FFD700]"
            )}
          >
            {/* Header Icon */}
            <div className="flex justify-center mt-8">
              {variant === 'danger' ? (
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                  <AlertCircle className="w-8 h-8 text-[#FF1744]" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-[#2962FF] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <span className="text-white text-3xl font-black italic">E</span>
                </div>
              )}
            </div>

            <div className="px-8 pt-6 pb-2 text-center">
              <h2 className={cn(
                "text-2xl font-black tracking-tight uppercase italic",
                variant === 'danger' ? "text-gray-900" : "text-[#1A237E]"
              )}>
                {title}
              </h2>
            </div>

            <div className="px-10 py-6 max-h-[60vh] overflow-y-auto">
              {children}
            </div>

            {footer && (
              <div className="px-10 pb-10 flex items-center justify-center gap-4">
                {footer}
              </div>
            )}

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
