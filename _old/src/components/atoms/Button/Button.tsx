// src/components/atoms/Button/Button.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  readonly variant: ButtonVariant;
  readonly size: ButtonSize;
  readonly children?: React.ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit' | 'reset';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly loadingText?: string;
  readonly iconLeft?: React.ReactNode;
  readonly iconRight?: React.ReactNode;
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

/**
 * Button Component - Design Apple minimaliste avec gradients vibrants
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Valider
 * </Button>
 * 
 * @example
 * <Button variant="outline" size="lg" loading iconLeft={<PlusIcon />}>
 *   Ajouter un produit
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  loadingText,
  iconLeft,
  iconRight,
  fullWidth = false,
  className = '',
  'data-testid': testId,
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed select-none overflow-hidden
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white
      hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700
      hover:shadow-2xl hover:shadow-blue-500/25
      focus:ring-blue-400 shadow-lg shadow-blue-500/20
      disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-300
      hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg
      focus:ring-blue-500 shadow-sm
      disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200
    `,
    danger: `
      bg-gradient-to-r from-red-500 via-pink-500 to-rose-600 text-white
      hover:from-red-600 hover:via-pink-600 hover:to-rose-700
      hover:shadow-2xl hover:shadow-red-500/25
      focus:ring-red-400 shadow-lg shadow-red-500/20
      disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none
    `,
    ghost: `
      bg-transparent text-gray-700 border border-transparent
      hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50
      active:bg-gray-200 focus:ring-gray-400
      disabled:text-gray-400
    `,
    outline: `
      bg-white border-2 text-gray-700 relative
      hover:text-white hover:shadow-lg hover:shadow-blue-500/20
      focus:ring-blue-400
      disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-50
      before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r 
      before:from-blue-500 before:to-purple-600 before:rounded-lg before:-z-10
      after:absolute after:inset-[2px] after:bg-white after:rounded-md after:-z-10
      hover:after:bg-gradient-to-r hover:after:from-blue-500 hover:after:to-purple-600
    `,
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[56px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const CustomSpinner = () => (
    <motion.div
      className={`${iconSizes[size]} relative`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-current opacity-20"
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-current"
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border border-current opacity-40"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );

  const buttonContent = (
    <>
      {loading ? (
        <>
          <CustomSpinner />
          {(loadingText || children) && (
            <span className="ml-2 truncate">
              {loadingText || 'Chargement...'}
            </span>
          )}
        </>
      ) : (
        <>
          {iconLeft && (
            <span className={`${iconSizes[size]} ${children ? 'mr-2' : ''} flex-shrink-0`}>
              {iconLeft}
            </span>
          )}
          {children && <span className="truncate">{children}</span>}
          {iconRight && (
            <span className={`${iconSizes[size]} ${children ? 'ml-2' : ''} flex-shrink-0`}>
              {iconRight}
            </span>
          )}
        </>
      )}
    </>
  );

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      data-testid={testId}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {buttonContent}
    </motion.button>
  );
};