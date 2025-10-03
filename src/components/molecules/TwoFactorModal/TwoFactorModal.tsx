// src/components/molecules/TwoFactorModal/TwoFactorModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

interface TwoFactorModalProps {
  readonly isOpen: boolean;
  readonly onVerify: (token: string) => Promise<void>;
  readonly onClose?: () => void;
  readonly isLoading?: boolean;
  readonly error?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onVerify,
  onClose,
  isLoading = false,
  error
}) => {
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length === 6) {
      await onVerify(token);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Double authentification
              </h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              label="Code à 6 chiffres"
              helperText="Entrez le code depuis votre application Authenticator"
              className="text-center text-2xl tracking-widest"
              disabled={isLoading}
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
                size="md"
              type="submit"
              variant="primary"
              fullWidth
              disabled={token.length !== 6 || isLoading}
              loading={isLoading}
            >
              Vérifier
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};