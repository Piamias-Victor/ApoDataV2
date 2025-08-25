// src/components/organisms/DateDrawer/DateDrawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DateDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

/**
 * DateDrawer Component - Drawer pour filtres date
 * 
 * Drawer 400px fixe, animation slide depuis la droite
 * Contenu blanc vide pour le moment
 */
export const DateDrawer: React.FC<DateDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  useEffect(() => {
    // Pour le moment, pas de filtres actifs
    onCountChange(0);
  }, [onCountChange]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <motion.div
        className={`
          fixed top-0 right-0 h-full w-[400px] z-50
          bg-white shadow-strong border-l border-gray-200
          flex flex-col
        `}
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Filtres Date
          </h3>
          <motion.button
            onClick={onClose}
            className="
              p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition-colors duration-200
            "
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm">Contenu des filtres date</p>
              <p className="text-xs mt-1">À implémenter</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};