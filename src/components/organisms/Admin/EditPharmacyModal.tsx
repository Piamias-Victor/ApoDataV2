'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Building2, MapPin } from 'lucide-react';
import { Input } from '@/components/atoms/Input/Input';
import { Button } from '@/components/atoms/Button/Button';
import { Card } from '@/components/atoms/Card/Card';

interface PharmacyData {
    pharmacy_id: string; // From PharmacyAnalysisRow
    pharmacy_name: string;
    pharmacy_city: string; // Used as Address/City
}

interface EditPharmacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pharmacy: PharmacyData | null;
}

export const EditPharmacyModal: React.FC<EditPharmacyModalProps> = ({ isOpen, onClose, onSuccess, pharmacy }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (pharmacy) {
            setName(pharmacy.pharmacy_name);
            setAddress(pharmacy.pharmacy_city || '');
            setError(null);
        }
    }, [pharmacy]);

    // Portal mounting
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen || !pharmacy) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/pharmacies', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: pharmacy.pharmacy_id,
                    name,
                    address
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la mise à jour");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <Card className="w-full max-w-md bg-white p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Modifier la pharmacie</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Mettez à jour les informations de l&apos;officine.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nom de la pharmacie"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Pharmacie du Centre"
                        iconLeft={<Building2 className="w-4 h-4" />}
                        required
                    />

                    <Input
                        label="Ville / Adresse"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ex: Paris 75001"
                        iconLeft={<MapPin className="w-4 h-4" />}
                    />

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                            <span>•</span> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            onClick={onClose}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                            iconLeft={<Save className="w-4 h-4" />}
                        >
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );

    return createPortal(modalContent, document.body);
};
