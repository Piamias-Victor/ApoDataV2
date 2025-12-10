// src/components/molecules/TwoFactorModal/TwoFactorModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';

interface TwoFactorModalProps {
    isOpen: boolean;
    onVerify: (token: string) => Promise<void>;
    onClose?: () => void;
    isLoading?: boolean;
    readonly error?: string | undefined;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
    isOpen, onVerify, onClose, isLoading = false, error
}) => {
    const [token, setToken] = useState('');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900">Double Authentification</h2>
                        </div>
                        {onClose && (
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onVerify(token); }} className="space-y-6">
                        <Input
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000 000"
                            label="Code de vérification"
                            className="text-center text-2xl tracking-[0.5em] font-mono"
                            disabled={isLoading}
                            error={error}
                        />
                        <Button
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
