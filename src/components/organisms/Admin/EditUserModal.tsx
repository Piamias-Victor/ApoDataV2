'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        pharmacy_id?: string;
    } | null;
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState('pharmacy_user');
    const [pharmacyId, setPharmacyId] = useState('');
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setName(user.name);
            setRole(user.role === 'admin' ? 'admin' : 'pharmacy_user');
            setPharmacyId(user.pharmacy_id || '');
            fetchPharmacies();
        }
    }, [isOpen, user]);

    const fetchPharmacies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/pharmacies/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '' })
            });
            if (res.ok) {
                const data = await res.json();
                setPharmacies(data.pharmacies || []);
            }
        } catch (error) {
            console.error('Error fetching pharmacies:', error);
            toast.error("Erreur lors du chargement des pharmacies");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim()) {
            toast.error("Le nom est requis");
            return;
        }

        if (role === 'pharmacy_user' && !pharmacyId) {
            toast.error("Veuillez sélectionner une pharmacie pour cet utilisateur");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    role,
                    pharmacy_id: role === 'admin' ? null : pharmacyId
                })
            });

            if (res.ok) {
                toast.success("Utilisateur modifié avec succès");
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                toast.error(data.error || "Erreur lors de la modification");
            }
        } catch (error) {
            toast.error("Erreur réseau");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Modifier l&apos;utilisateur</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200/50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Nom complet
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                            placeholder="Ex: Jean Dupont"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Rôle
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm bg-white"
                        >
                            <option value="pharmacy_user">Utilisateur Pharmacie</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>

                    {role === 'pharmacy_user' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Pharmacie liée
                            </label>
                            {isLoading ? (
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Chargement des pharmacies...
                                </div>
                            ) : (
                                <select
                                    value={pharmacyId}
                                    onChange={(e) => setPharmacyId(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm bg-white"
                                >
                                    <option value="">Sélectionner une pharmacie...</option>
                                    {pharmacies.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.cip})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
