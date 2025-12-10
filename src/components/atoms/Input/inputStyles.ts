// src/components/atoms/Input/inputStyles.ts
export const baseStyles = `
  w-full rounded-lg font-medium transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-1
  disabled:cursor-not-allowed disabled:opacity-60
  placeholder:text-gray-400
`;

export const variants = {
    default: (error?: string) => `
    bg-white border border-gray-300 text-gray-900
    hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
  `,
    filled: (error?: string) => `
    bg-gray-100 border border-transparent text-gray-900
    hover:bg-gray-150 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20
    ${error ? 'bg-red-50 border-red-500' : ''}
  `,
    outlined: (error?: string) => `
    bg-transparent border-2 border-gray-300 text-gray-900
    hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/20
    ${error ? 'border-red-500' : ''}
  `,
};

export const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-4 py-3 text-base min-h-[48px]',
};

export const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};
