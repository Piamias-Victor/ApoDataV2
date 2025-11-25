// src/components/atoms/Input/Input.tsx
'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

type InputVariant = 'default' | 'filled' | 'outlined' | 'ghost' | 'gradient';
type InputSize = 'sm' | 'md' | 'lg';
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

interface InputProps {
  readonly variant?: InputVariant;
  readonly size?: InputSize;
  readonly type?: InputType;
  readonly placeholder?: string;
  readonly label?: string;
  readonly helperText?: string;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly iconLeft?: React.ReactNode;
  readonly iconRight?: React.ReactNode;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  readonly onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

/**
 * Input Component - Design Apple minimaliste avec animations fluides
 * 
 * @example
 * <Input 
 *   variant="default" 
 *   size="md" 
 *   label="Email" 
 *   placeholder="exemple@email.com"
 *   type="email"
 * />
 * 
 * @example
 * <Input 
 *   variant="gradient" 
 *   size="lg" 
 *   iconLeft={<SearchIcon />}
 *   placeholder="Rechercher un produit..."
 *   error="Ce champ est requis"
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  type = 'text',
  placeholder,
  label,
  helperText,
  error,
  disabled = false,
  required = false,
  iconLeft,
  iconRight,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  className = '',
  'data-testid': testId,
}, ref) => {
  const hasError = Boolean(error);
  const hasIcons = iconLeft || iconRight;

  const baseStyles = `
    w-full rounded-lg font-medium transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:cursor-not-allowed disabled:opacity-60
    placeholder:text-gray-400
    ${hasIcons ? 'flex items-center' : ''}
  `;

  const variants = {
    default: `
      bg-white border border-gray-300 text-gray-900
      hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      disabled:bg-gray-50 disabled:border-gray-200
    `,
    filled: `
      bg-gray-100 border border-transparent text-gray-900
      hover:bg-gray-150 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20
      ${hasError ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      disabled:bg-gray-50
    `,
    outlined: `
      bg-transparent border-2 border-gray-300 text-gray-900
      hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      disabled:border-gray-200
    `,
    ghost: `
      bg-transparent border border-transparent text-gray-900
      hover:bg-gray-100 focus:bg-white focus:border-gray-300 focus:ring-gray-500/20
      ${hasError ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      disabled:bg-gray-50
    `,
    gradient: `
      bg-white text-gray-900 relative border border-transparent
      hover:shadow-lg focus:shadow-blue focus:ring-2 focus:ring-blue-500/20
      ${hasError ? 'focus:ring-red-500/20' : ''}
      disabled:bg-gray-50 disabled:opacity-60
      before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-r 
      before:from-blue-500 before:to-purple-600 before:rounded-lg before:-z-10
      after:absolute after:inset-[1px] after:bg-white after:rounded-[7px] after:-z-10
      focus:after:bg-white
    `,
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-4 py-3 text-base min-h-[48px]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const inputElement = (
    <motion.input
      ref={ref}
      type={type}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      data-testid={testId}
      className={`
        ${baseStyles} ${variants[variant]} ${sizes[size]}
        ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''}
        ${variant === 'gradient' ? 'relative z-0' : ''}
        ${className}
      `}
      whileFocus={{ scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    />
  );

  const inputWithIcons = hasIcons ? (
    <div className="relative">
      {iconLeft && (
        <div className={`
          absolute left-3 top-1/2 transform -translate-y-1/2 z-10
          ${iconSizes[size]} text-gray-500 pointer-events-none
          flex items-center justify-center
        `}>
          {iconLeft}
        </div>
      )}
      {inputElement}
      {iconRight && (
        <div className={`
          absolute right-3 top-1/2 transform -translate-y-1/2 z-10
          ${iconSizes[size]} text-gray-500
          flex items-center justify-center
        `}>
          {iconRight}
        </div>
      )}
    </div>
  ) : inputElement;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {inputWithIcons}

      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';