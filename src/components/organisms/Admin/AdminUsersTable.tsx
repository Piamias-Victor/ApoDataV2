'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Loader2, CheckCircle, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    pharmacy_name?: string;
}

export function AdminUsersTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [resendingId, setResendingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users/list');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResendInvitation = async (userId: string, email: string) => {
        // Simple confirm is safer, but notifications should be toasts
        if (!confirm(`Renvoyer l'invitation à ${email} ?`)) return;

        setResendingId(userId);
        const promise = fetch(`/api/admin/users/${userId}/resend-invitation`, {
            method: 'POST'
        }).then(async (res) => {
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Échec de l\'envoi');
            }
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Envoi de l\'invitation...',
            success: 'Invitation envoyée avec succès !',
            error: (err) => `Erreur : ${err.message}`
        });

        try {
            await promise;
        } catch (error) {
            // Error handled by toast
        } finally {
            setResendingId(null);
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email} ?`)) return;

        setDeletingId(userId);
        const promise = fetch(`/api/admin/users/${userId}/delete`, {
            method: 'DELETE'
        }).then(async (res) => {
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Échec de la suppression');
            }
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Suppression en cours...',
            success: () => {
                setUsers(prev => prev.filter(u => u.id !== userId));
                return 'Utilisateur supprimé avec succès';
            },
            error: (err) => `Erreur : ${err.message}`
        });

        try {
            await promise;
        } catch (error) {
            // Error handled by toast
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nom
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Pharmacie
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Rôle
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Créé le
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">
                                        {user.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.pharmacy_name ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            {user.pharmacy_name}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Aucune</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <CheckCircle className="w-3 h-3" />
                                        Actif
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleResendInvitation(user.id, user.email)}
                                            disabled={resendingId === user.id}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {resendingId === user.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Mail className="w-3.5 h-3.5" />
                                            )}
                                            Invitation
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                            disabled={deletingId === user.id}
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {deletingId === user.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Aucun utilisateur trouvé
                </div>
            )}
        </div>
    );
}
