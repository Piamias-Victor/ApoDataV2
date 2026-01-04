'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Mail, Building, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface RegisterUserModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface PharmacyOption {
    id: string;
    name: string;
}

export const RegisterUserModal: React.FC<RegisterUserModalProps> = ({ onClose, onSuccess }) => {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const [pharmacyId, setPharmacyId] = useState('');

    // Pharmacies Data
    const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
    const [loadingPharmacies, setLoadingPharmacies] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Fetch pharmacies on mount
    useEffect(() => {
        const fetchPharmacies = async () => {
            setLoadingPharmacies(true);
            try {
                // Post to search endpoint with empty query to get list
                const res = await fetch('/api/pharmacies/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: '' })
                });
                if (res.ok) {
                    const data = await res.json();
                    setPharmacies(data.pharmacies || []);
                }
            } catch (err) {
                console.error('Failed to fetch pharmacies', err);
            } finally {
                setLoadingPharmacies(false);
            }
        };

        if (role === 'user') {
            fetchPharmacies();
        }
    }, [role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/admin/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name,
                    role,
                    pharmacyId: role === 'admin' ? null : pharmacyId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Nouvel Utilisateur</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Invitation envoyée !</h3>
                            <p className="text-gray-500">L&apos;utilisateur recevra un email pour finaliser son inscription.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm"
                                        placeholder="Jean Dupont"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email professionnel</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm"
                                        placeholder="jean.dupont@apodata.fr"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('user')}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${role === 'user'
                                            ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        Utilisateur
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('admin')}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${role === 'admin'
                                            ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        Administrateur
                                    </button>
                                </div>
                            </div>

                            {/* Pharmacy Selection (Only for User) */}
                            {role === 'user' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacie rattachée</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            required={role === 'user'}
                                            value={pharmacyId}
                                            onChange={e => setPharmacyId(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none text-sm appearance-none cursor-pointer"
                                            disabled={loadingPharmacies}
                                        >
                                            <option value="">Sélectionner une pharmacie</option>
                                            {pharmacies.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        {loadingPharmacies && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full mt-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all shadow-xl shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0 font-semibold text-sm tracking-wide flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Envoi en cours...' : 'Envoyer l\'invitation'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
