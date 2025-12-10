// src/components/organisms/FilterPanel/components/shared/FilterSearchInput.tsx
import React from 'react';
import { Search } from 'lucide-react';

interface FilterSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    focusColor?: 'purple' | 'blue';
}

export const FilterSearchInput: React.FC<FilterSearchInputProps> = ({
    value,
    onChange,
    placeholder = "Rechercher...",
    focusColor = 'blue'
}) => {
    const focusBorderColor = focusColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-blue-500';
    const groupFocusColor = focusColor === 'purple' ? 'group-focus-within:text-purple-500' : 'group-focus-within:text-blue-500';

    return (
        <div className="relative group mb-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${groupFocusColor} transition-colors`} />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-gray-50 hover:bg-white focus:bg-white border-2 border-transparent ${focusBorderColor} rounded-xl py-3 pl-10 pr-4 outline-none focus:outline-none focus:ring-0 transition-all font-medium text-sm text-gray-800 placeholder:text-gray-400`}
                autoFocus
            />
        </div>
    );
};
