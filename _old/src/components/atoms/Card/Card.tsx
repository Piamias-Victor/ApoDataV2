// src/components/atoms/Card/Card.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive' | 'gradient' | 'glass';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  readonly variant?: CardVariant;
  readonly padding?: CardPadding;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly onClick?: () => void;
  readonly hoverable?: boolean;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly 'data-testid'?: string;
}

/**
 * Card Component - Design Apple minimaliste avec effets modernes
 * 
 * @example
 * <Card variant="elevated" padding="lg" hoverable>
 *   <h3>Titre de la carte</h3>
 *   <p>Contenu de la carte</p>
 * </Card>
 * 
 * @example
 * <Card variant="interactive" onClick={handleClick}>
 *   Carte cliquable
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
  hoverable = false,
  loading = false,
  disabled = false,
  'data-testid': testId,
}) => {
  const isClickable = onClick || hoverable;
  
  const baseStyles = `
    relative bg-white rounded-xl transition-all duration-300 ease-out
    ${isClickable && !disabled ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${loading ? 'overflow-hidden' : ''}
  `;

  const variants = {
    default: `
      border border-gray-200
      ${isClickable ? 'hover:border-gray-300 hover:shadow-soft' : ''}
    `,
    elevated: `
      shadow-soft border border-gray-100
      ${isClickable ? 'hover:shadow-strong hover:border-gray-200' : ''}
    `,
    outlined: `
      border-2 border-gray-300
      ${isClickable ? 'hover:border-gray-400 hover:shadow-md' : ''}
    `,
    interactive: `
      border border-gray-200 shadow-sm
      hover:border-blue-300 hover:shadow-blue hover:-translate-y-1
      active:translate-y-0 active:shadow-soft
      focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
    `,
    gradient: `
      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
      border border-blue-200/50 shadow-soft
      ${isClickable ? 'hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 hover:shadow-blue' : ''}
    `,
    glass: `
      bg-white/80 backdrop-blur-xl border border-white/20
      shadow-soft relative overflow-hidden
      ${isClickable ? 'hover:bg-white/90 hover:shadow-strong' : ''}
      before:absolute before:inset-0 before:bg-gradient-to-br 
      before:from-white/20 before:to-transparent before:pointer-events-none
    `,
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const LoadingOverlay = () => (
    <motion.div
      className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-8 h-8 relative"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-200"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500"
          animate={{ rotate: 360 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border border-blue-300"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>
    </motion.div>
  );

  const CardElement = onClick ? motion.button : motion.div;

  return (
    <CardElement
      onClick={!disabled && !loading ? onClick : undefined}
      data-testid={testId}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
      whileHover={
        isClickable && !disabled && !loading
          ? variant === 'interactive'
            ? { y: -4, scale: 1.02 }
            : { scale: 1.01, y: -2 }
          : {}
      }
      whileTap={
        isClickable && !disabled && !loading
          ? { scale: 0.98, y: 0 }
          : {}
      }
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {children}
      {loading && <LoadingOverlay />}
    </CardElement>
  );
};