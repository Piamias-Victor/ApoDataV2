// src/components/molecules/ExportButton/ExportButton.tsx

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';

interface ExportButtonProps {
  readonly onClick: () => void;
  readonly isExporting?: boolean;
  readonly disabled?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'primary' | 'secondary' | 'ghost';
  readonly className?: string;
  readonly label?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  isExporting = false,
  disabled = false,
  size = 'sm',
  variant = 'ghost',
  className = '',
  label = 'Export CSV'
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || isExporting}
      className={`text-gray-600 hover:text-gray-900 ${className}`}
      iconLeft={<Download className="w-4 h-4" />}
    >
      {isExporting ? 'Export...' : label}
    </Button>
  );
};