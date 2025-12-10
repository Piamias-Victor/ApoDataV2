// src/components/atoms/Badge/Badge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

type BadgeVariant =
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'gray'
    | 'gradient-blue'
    | 'gradient-purple'
    | 'gradient-green';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps {
    variant?: BadgeVariant;
    size?: BadgeSize;
    children: React.ReactNode;
    className?: string;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'primary',
    size = 'sm',
    children,
    className = '',
    iconLeft,
    iconRight,
}) => {
    const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-full
    transition-all duration-200
  `;

    const variants = {
        primary: 'bg-primary-100 text-primary-800 border border-primary-200',
        success: 'bg-success-100 text-success-800 border border-success-200',
        warning: 'bg-warning-100 text-warning-800 border border-warning-200',
        danger: 'bg-danger-100 text-danger-800 border border-danger-200',
        gray: 'bg-gray-100 text-gray-800 border border-gray-200',
        'gradient-blue': 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-sm',
        'gradient-purple': 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 text-white shadow-sm',
        'gradient-green': 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white shadow-sm',
    };

    const sizes = {
        xs: 'px-2 py-0.5 text-xs min-h-[20px]',
        sm: 'px-2.5 py-0.5 text-xs min-h-[24px]',
        md: 'px-3 py-1 text-sm min-h-[28px]',
        lg: 'px-4 py-1.5 text-sm min-h-[32px]',
    };

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-4 h-4',
    };

    return (
        <motion.span
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {iconLeft && <span className={`${iconSizes[size]} ${children ? 'mr-1.5' : ''}`}>{iconLeft}</span>}
            {children}
            {iconRight && <span className={`${iconSizes[size]} ${children ? 'ml-1.5' : ''}`}>{iconRight}</span>}
        </motion.span>
    );
};
