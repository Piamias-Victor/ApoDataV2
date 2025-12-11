// src/components/molecules/Drawer/Drawer.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    accentColor?: 'orange' | 'blue' | 'purple' | 'red' | 'green' | 'yellow';
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = 'w-[500px]',
    accentColor = 'orange'
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className={`fixed top-0 right-0 h-full ${width} z-50 bg-white/90 backdrop-blur-2xl shadow-2xl flex flex-col border-l border-white/50`}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        {/* Header - Minimalist & Clean */}
                        <div className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                                <div className={`h-1 w-12 rounded-full mt-2 ${accentColor === 'orange' ? 'bg-orange-500' :
                                        accentColor === 'blue' ? 'bg-blue-600' :
                                            accentColor === 'red' ? 'bg-red-600' :
                                                accentColor === 'green' ? 'bg-green-600' :
                                                    accentColor === 'yellow' ? 'bg-yellow-500' :
                                                        'bg-purple-600'
                                    }`} />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
