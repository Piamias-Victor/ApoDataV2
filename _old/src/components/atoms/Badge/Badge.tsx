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
  | 'beta'
  | 'gradient-blue'
  | 'gradient-purple'
  | 'gradient-pink'
  | 'gradient-green';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps {
  readonly variant: BadgeVariant;
  readonly size?: BadgeSize;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly animated?: boolean;
  readonly pulsing?: boolean;
  readonly interactive?: boolean;
  readonly iconLeft?: React.ReactNode;
  readonly iconRight?: React.ReactNode;
  readonly onClick?: () => void;
  readonly 'data-testid'?: string;
}

/**
 * Badge Component - Design Apple minimaliste avec gradients vibrants
 * 
 * @example
 * <Badge variant="primary" size="md">
 *   Nouveau
 * </Badge>
 * 
 * @example
 * <Badge variant="gradient-blue" animated pulsing>
 *   En cours
 * </Badge>
 * 
 * @example
 * <Badge variant="success" interactive onClick={handleClick} iconLeft={<CheckIcon />}>
 *   Validé
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant,
  size = 'sm',
  children,
  className = '',
  animated = false,
  pulsing = false,
  interactive = false,
  iconLeft,
  iconRight,
  onClick,
  'data-testid': testId,
}) => {
  const isClickable = onClick || interactive;

  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-full
    transition-all duration-200 ease-in-out select-none
    ${isClickable ? 'cursor-pointer' : ''}
    ${pulsing ? 'animate-pulse' : ''}
  `;

  const variants = {
    primary: `
      bg-primary-100 text-primary-800 border border-primary-200
      ${isClickable ? 'hover:bg-primary-200 hover:border-primary-300' : ''}
    `,
    success: `
      bg-success-100 text-success-800 border border-success-200
      ${isClickable ? 'hover:bg-success-200 hover:border-success-300' : ''}
    `,
    warning: `
      bg-warning-100 text-warning-800 border border-warning-200
      ${isClickable ? 'hover:bg-warning-200 hover:border-warning-300' : ''}
    `,
    danger: `
      bg-danger-100 text-danger-800 border border-danger-200
      ${isClickable ? 'hover:bg-danger-200 hover:border-danger-300' : ''}
    `,
    gray: `
      bg-gray-100 text-gray-800 border border-gray-200
      ${isClickable ? 'hover:bg-gray-200 hover:border-gray-300' : ''}
    `,
    beta: `
      bg-gradient-to-r from-primary-500 to-purple-600 text-white border border-transparent
      shadow-sm
      ${isClickable ? 'hover:from-primary-600 hover:to-purple-700 hover:shadow-md' : ''}
    `,
    'gradient-blue': `
      bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white 
      border border-transparent shadow-sm
      ${isClickable ? 'hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 hover:shadow-blue' : ''}
    `,
    'gradient-purple': `
      bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 text-white
      border border-transparent shadow-sm
      ${isClickable ? 'hover:from-purple-600 hover:via-pink-600 hover:to-rose-700 hover:shadow-purple' : ''}
    `,
    'gradient-pink': `
      bg-gradient-to-r from-pink-500 via-rose-500 to-red-600 text-white
      border border-transparent shadow-sm
      ${isClickable ? 'hover:from-pink-600 hover:via-rose-600 hover:to-red-700 hover:shadow-pink' : ''}
    `,
    'gradient-green': `
      bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white
      border border-transparent shadow-sm
      ${isClickable ? 'hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 hover:shadow-md' : ''}
    `,
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

  const badgeContent = (
    <>
      {iconLeft && (
        <span className={`${iconSizes[size]} ${children ? 'mr-1.5' : ''} flex-shrink-0`}>
          {iconLeft}
        </span>
      )}
      {children && <span className="truncate">{children}</span>}
      {iconRight && (
        <span className={`${iconSizes[size]} ${children ? 'ml-1.5' : ''} flex-shrink-0`}>
          {iconRight}
        </span>
      )}
    </>
  );

  const BadgeElement = isClickable ? motion.button : motion.span;

  return (
    <BadgeElement
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={
        animated && isClickable
          ? { scale: 1.05, y: -1 }
          : {}
      }
      whileTap={
        animated && isClickable
          ? { scale: 0.95 }
          : {}
      }
      animate={
        pulsing
          ? {
              scale: [1, 1.05, 1],
              opacity: [1, 0.8, 1],
            }
          : {}
      }
      transition={
        pulsing
          ? {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : { duration: 0.2, ease: 'easeInOut' }
      }
    >
      {badgeContent}
    </BadgeElement>
  );
};