// src/components/molecules/TwoFactorRequiredModal/TwoFactorRequiredModal.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button/Button';

interface TwoFactorRequiredModalProps {
  readonly isOpen: boolean;
}

export const TwoFactorRequiredModal: React.FC<TwoFactorRequiredModalProps> = ({
  isOpen
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleActivate = () => {
    router.push('/setup-2fa');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 mx-4"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Sécurité renforcée requise
            </h2>
            <p className="text-gray-600">
              Pour protéger votre compte, l&apos;activation de la double authentification est obligatoire.
            </p>
          </div>

          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Cette mesure garantit la sécurité de vos données pharmaceutiques et respecte les normes de conformité.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleActivate}
          >
            Activer la double authentification
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-xs text-gray-500">
            Cette étape ne prend que 2 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
};