// src/components/atoms/Input/Input.tsx
'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { baseStyles, variants, sizes, iconSizes } from './inputStyles';

type InputVariant = keyof typeof variants;
type InputSize = keyof typeof sizes;

interface InputProps {
    variant?: InputVariant;
    size?: InputSize;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    placeholder?: string;
    label?: string;
    error?: string | undefined;
    disabled?: boolean;
    required?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    variant = 'default',
    size = 'md',
    type = 'text',
    placeholder,
    label,
    error,
    disabled = false,
    required = false,
    iconLeft,
    iconRight,
    value,
    onChange,
    className = '',
}, ref) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {iconLeft && (
                    <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${iconSizes[size]} text-gray-500 pointer-events-none z-10`}>
                        {iconLeft}
                    </div>
                )}

                <motion.input
                    ref={ref}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onChange={onChange}
                    className={`
            ${baseStyles} ${variants[variant](error)} ${sizes[size]}
            ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''}
            ${className}
          `}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                />

                {iconRight && (
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${iconSizes[size]} text-gray-500 z-10 flex items-center justify-center`}>
                        {iconRight}
                    </div>
                )}
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
