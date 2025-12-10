// src/components/organisms/FilterPanel/components/shared/PinnedSelectionList.tsx
import React from 'react';
import { Check, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PinnedItem {
    id: string;
    name: string;
}

interface PinnedSelectionListProps {
    items: PinnedItem[];
    onRemove: (id: string) => void;
    icon: LucideIcon;
    colorTheme?: 'purple' | 'blue';
    title?: string;
}

export const PinnedSelectionList: React.FC<PinnedSelectionListProps> = ({
    items,
    onRemove,
    icon: Icon,
    colorTheme = 'blue',
    title = "Déjà sélectionné(s)"
}) => {
    if (items.length === 0) return null;

    // Theme configuration
    const theme = {
        purple: {
            check: 'text-purple-500',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            iconBg: 'bg-white',
            iconText: 'text-purple-600',
            iconBorder: 'border-purple-100',
            text: 'text-purple-900',
            removeText: 'text-purple-400',
        },
        blue: {
            check: 'text-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconBg: 'bg-white',
            iconText: 'text-blue-600',
            iconBorder: 'border-blue-100',
            text: 'text-blue-900',
            removeText: 'text-blue-400',
        }
    }[colorTheme];

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Check className={`w-3 h-3 ${theme.check}`} />
                {title}
            </h3>
            <AnimatePresence mode="popLayout">
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`group relative p-3 rounded-lg border ${theme.border} ${theme.bg} flex items-center justify-between shadow-sm`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded-md ${theme.iconBg} ${theme.iconText} flex items-center justify-center shrink-0 border ${theme.iconBorder}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-bold ${theme.text} truncate`}>{item.name}</span>
                        </div>
                        <button
                            onClick={() => onRemove(item.id)}
                            className={`p-1.5 hover:bg-white ${theme.removeText} hover:text-red-500 rounded-md transition-colors`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div className="border-b border-gray-100 mt-4 mb-2" />
        </div>
    );
};
