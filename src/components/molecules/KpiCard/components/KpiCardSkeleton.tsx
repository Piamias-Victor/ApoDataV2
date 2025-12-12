import React from 'react';

export const KpiCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-white/50 shadow-xl p-6 h-full relative overflow-hidden">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />

            {/* Header Skeleton */}
            <div className="flex items-start justify-between mb-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-10 bg-gray-100 rounded-xl animate-pulse" />
            </div>

            {/* Primary Value Skeleton */}
            <div className="h-9 w-40 bg-gray-200 rounded-lg mb-4 animate-pulse" />

            {/* Footer Skeleton */}
            <div className="flex items-end justify-between mt-auto">
                <div className="space-y-1">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
            </div>
        </div>
    );
};
