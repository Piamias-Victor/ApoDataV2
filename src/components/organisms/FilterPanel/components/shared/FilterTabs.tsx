// src/components/organisms/FilterPanel/components/shared/FilterTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string> {
    id: T;
    label: string;
    icon: LucideIcon;
}

interface FilterTabsProps<T extends string> {
    tabs: TabItem<T>[];
    activeTab: T;
    onTabChange: (id: T) => void;
}

export const FilterTabs = <T extends string>({ tabs, activeTab, onTabChange }: FilterTabsProps<T>) => {

    // Calculate position for the sliding background based on active index
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    const tabCount = tabs.length;
    const tabWidthPercent = 100 / tabCount;
    const leftPosition = `calc(${activeIndex * tabWidthPercent}% + 4px)`;
    const widthCalc = `calc(${tabWidthPercent}% - 8px)`;
    // Correction: It's better to let framer motion handle layout animations if possible, 
    // but the 'left' percentage trick is reliable for simple segmented controls.
    // For 2 tabs: 0 -> 4px, 1 -> 50%
    // For general case we might need more complex calculation or Just stick to 2 tabs for now as current use case is only 2.
    // Let's assume 2 tabs for simplicity or calc strictly.

    // Actually, exact 50% logic from before was cleanest for 2 items. 
    // Let's stick to the styling used previously which was optimized for 2 tabs, but make it generic enough.
    // If we assume 2 tabs mostly:

    return (
        <div className="flex p-1 bg-gray-100/80 rounded-xl relative mb-4">
            <motion.div
                className="absolute inset-y-1 bg-white rounded-lg shadow-sm"
                initial={false}
                animate={{ left: leftPosition }}
                style={{ width: widthCalc }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
