// src/components/atoms/Slider/RangeSlider.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    unit?: string; // '€' or '%'
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    color = 'blue',
    unit = '€'
}) => {
    const [minVal, setMinVal] = useState(value[0]);
    const [maxVal, setMaxVal] = useState(value[1]);
    const range = useRef<HTMLDivElement>(null);

    // Color theme configuration
    const colorClasses = {
        blue: {
            focus: 'focus:ring-blue-500 focus:border-blue-500',
            bg: 'bg-blue-500',
            border: 'border-blue-500'
        },
        green: {
            focus: 'focus:ring-green-500 focus:border-green-500',
            bg: 'bg-green-500',
            border: 'border-green-500'
        },
        orange: {
            focus: 'focus:ring-orange-500 focus:border-orange-500',
            bg: 'bg-orange-500',
            border: 'border-orange-500'
        },
        purple: {
            focus: 'focus:ring-purple-500 focus:border-purple-500',
            bg: 'bg-purple-500',
            border: 'border-purple-500'
        },
        red: {
            focus: 'focus:ring-red-500 focus:border-red-500',
            bg: 'bg-red-500',
            border: 'border-red-500'
        }
    };

    const theme = colorClasses[color];

    // Sync from props
    useEffect(() => {
        setMinVal(value[0]);
        setMaxVal(value[1]);
    }, [value]);

    const getPercent = React.useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    // Visual updates
    useEffect(() => {
        if (range.current) {
            const minPercent = getPercent(minVal);
            const maxPercent = getPercent(maxVal);
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, maxVal, min, max, getPercent]);

    // Handle Slider Changes
    const handleSliderMin = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(e.target.value), maxVal - step);
        setMinVal(value);
        onChange([value, maxVal]);
    };

    const handleSliderMax = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(e.target.value), minVal + step);
        setMaxVal(value);
        onChange([minVal, value]);
    };

    // Handle Input Changes (Direct Typing)
    const handleInputMin = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        if (value < min) value = min;
        if (value > maxVal) value = maxVal; // constraints
        setMinVal(value);
        onChange([value, maxVal]);
    };

    const handleInputMax = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(e.target.value);
        if (value > max) value = max;
        if (value < minVal) value = minVal; // constraints
        setMaxVal(value);
        onChange([minVal, value]);
    };

    return (
        <div className="space-y-4">
            {/* Input Fields */}
            <div className="flex gap-4 items-start">
                <div className="flex-1">
                    <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1 block">Min ({unit})</label>
                    <input
                        type="number"
                        value={minVal}
                        onChange={handleInputMin}
                        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 ${theme.focus} transition-all outline-none`}
                    />
                </div>
                <div className="pt-5 text-gray-300">-</div>
                <div className="flex-1">
                    <label className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1 block">Max ({unit})</label>
                    <input
                        type="number"
                        value={maxVal}
                        onChange={handleInputMax}
                        className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 ${theme.focus} transition-all outline-none`}
                    />
                </div>
            </div>

            {/* Slider Track */}
            <div className="relative h-2 w-full pt-4 pb-2">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minVal}
                    onChange={handleSliderMin}
                    className="absolute z-30 w-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto h-2"
                    style={{ zIndex: minVal > max - 100 ? 5 : 3 }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxVal}
                    onChange={handleSliderMax}
                    className="absolute z-40 w-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto h-2"
                />

                <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 rounded-full -translate-y-1/2 overflow-hidden z-10">
                    <div
                        ref={range}
                        className={`absolute h-full ${theme.bg} rounded-full`}
                    />
                </div>

                <div
                    className={`absolute top-1/2 h-5 w-5 bg-white border-2 ${theme.border} rounded-full -translate-y-1/2 shadow-sm z-20 pointer-events-none transition-transform`}
                    style={{ left: `calc(${getPercent(minVal)}% - 10px)` }}
                />
                <div
                    className={`absolute top-1/2 h-5 w-5 bg-white border-2 ${theme.border} rounded-full -translate-y-1/2 shadow-sm z-20 pointer-events-none transition-transform`}
                    style={{ left: `calc(${getPercent(maxVal)}% - 10px)` }}
                />
            </div>
        </div>
    );
};
