// src/components/atoms/Button/buttonStyles.ts
export const baseStyles = `
  relative inline-flex items-center justify-center font-medium rounded-lg
  transition-all duration-200 ease-in-out cursor-pointer
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-60
`;

export const variants = {
    primary: `
    bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white
    hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700
    hover:shadow-lg hover:shadow-blue-500/25
    focus:ring-blue-400 shadow-md
  `,
    secondary: `
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
    focus:ring-blue-500
  `,
    ghost: `
    bg-transparent text-gray-700
    hover:bg-gray-100
    focus:ring-gray-400
  `,
    outline: `
    bg-white border-2 border-blue-500 text-blue-600
    hover:bg-blue-50
    focus:ring-blue-400
  `,
};

export const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[56px]',
};

export const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
};
