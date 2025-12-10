// src/components/atoms/Button/Button.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { baseStyles, variants, sizes, iconSizes } from './buttonStyles';
import { Loader2 } from 'lucide-react';

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children?: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    loading?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    className = '',
}) => {
    return (
        <motion.button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`
        ${baseStyles} ${variants[variant]} ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} ${className}
      `}
            whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            transition={{ duration: 0.2 }}
        >
            {loading ? (
                <span className="flex items-center">
                    <Loader2 className={`animate-spin ${iconSizes[size]} mr-2`} />
                    Chargement...
                </span>
            ) : (
                <span className="flex items-center justify-center">
                    {iconLeft && <span className={`${iconSizes[size]} ${children ? 'mr-2' : ''} flex items-center`}>{iconLeft}</span>}
                    {children && <span>{children}</span>}
                    {iconRight && <span className={`${iconSizes[size]} ${children ? 'ml-2' : ''} flex items-center`}>{iconRight}</span>}
                </span>
            )}
        </motion.button>
    );
};
