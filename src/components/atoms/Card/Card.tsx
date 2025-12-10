// src/components/atoms/Card/Card.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
    variant?: CardVariant;
    padding?: CardPadding;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    variant = 'default',
    padding = 'md',
    className = '',
    children,
    onClick,
    hoverable = false,
}) => {
    const isClickable = onClick || hoverable;

    const baseStyles = `
    relative bg-white rounded-xl transition-all duration-300
    ${isClickable ? 'cursor-pointer' : ''}
  `;

    const variants = {
        default: `
      border border-gray-200
      ${isClickable ? 'hover:border-gray-300 hover:shadow-md' : ''}
    `,
        elevated: `
      shadow-md border border-gray-100
      ${isClickable ? 'hover:shadow-lg hover:border-gray-200' : ''}
    `,
        glass: `
      bg-white/80 backdrop-blur-xl border border-white/20
      shadow-md
      ${isClickable ? 'hover:bg-white/90 hover:shadow-lg' : ''}
    `,
        gradient: `
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      border border-blue-200/50 shadow-md
      ${isClickable ? 'hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100' : ''}
    `,
    };

    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
    };

    const CardElement = onClick ? motion.button : motion.div;

    return (
        <CardElement
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
            whileHover={isClickable ? { scale: 1.01, y: -2 } : {}}
            whileTap={isClickable ? { scale: 0.99 } : {}}
            transition={{ duration: 0.2 }}
        >
            {children}
        </CardElement>
    );
};
