import React, { useState, useEffect } from 'react';
import { User, UserUpdateData, USER_ROLES } from '@/types/user';
import { Pharmacy } from '@/types/pharmacy';
import { X } from 'lucide-react';

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    pharmacies: Pharmacy[]; // Pour la liste déroulante
    onSave: (id: string, data: UserUpdateData) => Promise<void>;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
    isOpen,
    onClose,
    user,
    pharmacies,
    onSave
}) => {
    const [formData, setFormData] = useState<UserUpdateData>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                role: user.role,
                pharmacyId: user.pharmacyId
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(user.id, formData);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-white">
                                Modifier l'utilisateur
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <form id="edit-user-form" onSubmit={handleSubmit}>
                        {/* Body */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Informations non modifiables */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Informations du compte
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                                        <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-200">
                                            {user.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                        <div className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-md border border-gray-200">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Champs modifiables */}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                        Rôle <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors sm:text-sm"
                                    >
                                        {Object.entries(USER_ROLES).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Définit les permissions de l'utilisateur dans l'application
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="pharmacy" className="block text-sm font-medium text-gray-700 mb-2">
                                        Pharmacie associée
                                    </label>
                                    <select
                                        id="pharmacy"
                                        value={formData.pharmacyId || ''}
                                        onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value || null })}
                                        className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors sm:text-sm"
                                    >
                                        <option value="">Aucune pharmacie</option>
                                        {pharmacies.map((pharmacy) => (
                                            <option key={pharmacy.id} value={pharmacy.id}>
                                                {pharmacy.name} {pharmacy.id_nat ? `(${pharmacy.id_nat})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Optionnel - Restreint l'accès aux données d'une pharmacie spécifique
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Enregistrer
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
