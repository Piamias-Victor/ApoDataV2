import React from 'react';

interface FilterLoadingStateProps {
    message?: string;
    color?: 'orange' | 'blue' | 'purple' | 'red' | 'green';
}

export const FilterLoadingState: React.FC<FilterLoadingStateProps> = ({
    message = "Recherche en cours...",
    color = "orange"
}) => {
    const colorClasses = {
        orange: 'border-orange-500',
        blue: 'border-blue-500',
        purple: 'border-purple-500',
        red: 'border-red-500',
        green: 'border-green-500'
    };

    return (
        <div className="flex flex-col items-center justify-center pt-8 text-gray-400 space-y-3 min-h-[200px]">
            <div className={`w-8 h-8 border-3 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`} />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};
