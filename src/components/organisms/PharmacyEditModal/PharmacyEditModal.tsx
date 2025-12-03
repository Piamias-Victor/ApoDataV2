// src/components/organisms/PharmacyEditModal/PharmacyEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Pharmacy, PharmacyUpdateData } from '@/types/pharmacy';

interface PharmacyEditModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly pharmacy: Pharmacy | null;
  readonly onSave: (id: string, data: PharmacyUpdateData) => Promise<void>;
}

/**
 * Modal d'édition des informations d'une pharmacie
 */
export const PharmacyEditModal: React.FC<PharmacyEditModalProps> = ({
  isOpen,
  onClose,
  pharmacy,
  onSave
}) => {
  const [formData, setFormData] = useState<PharmacyUpdateData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le formulaire quand la pharmacie change
  useEffect(() => {
    if (pharmacy) {
      setFormData({
        name: pharmacy.name,
        id_nat: pharmacy.id_nat,
        address: pharmacy.address,
        area: pharmacy.area,
        ca: pharmacy.ca,
        employees_count: pharmacy.employees_count,
        ca_rank: pharmacy.ca_rank ?? null
      });
      setError(null);
    }
  }, [pharmacy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pharmacy) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(pharmacy.id, formData);
      onClose();
    } catch (err) {
      console.error('Error saving pharmacy:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PharmacyUpdateData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;

    if (field === 'ca' || field === 'employees_count' || field === 'ca_rank') {
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value || null }));
    }
  };

  if (!pharmacy) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    Modifier la Pharmacie
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la pharmacie *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={handleChange('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Pharmacie Centrale"
                  />
                </div>

                {/* ID National */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID National
                  </label>
                  <input
                    type="text"
                    value={formData.id_nat || ''}
                    onChange={handleChange('id_nat')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="ID-123456"
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={handleChange('address')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="123 Rue de la Santé, 75001 Paris"
                  />
                </div>

                {/* Région */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Région
                  </label>
                  <select
                    value={formData.area || ''}
                    onChange={handleChange('area')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Sélectionner une région</option>
                    <option value="Île-de-France">Île-de-France</option>
                    <option value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d'Azur</option>
                    <option value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</option>
                    <option value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</option>
                    <option value="Occitanie">Occitanie</option>
                    <option value="Hauts-de-France">Hauts-de-France</option>
                    <option value="Grand Est">Grand Est</option>
                    <option value="Normandie">Normandie</option>
                    <option value="Bretagne">Bretagne</option>
                    <option value="Pays de la Loire">Pays de la Loire</option>
                    <option value="Centre-Val de Loire">Centre-Val de Loire</option>
                    <option value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</option>
                    <option value="Corse">Corse</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Nombre d'employés */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre d'employés
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.employees_count || ''}
                      onChange={handleChange('employees_count')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="10"
                    />
                  </div>

                  {/* CA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chiffre d'affaires (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.ca || ''}
                      onChange={handleChange('ca')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="1500000"
                    />
                  </div>

                  {/* Rang CA */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rang CA (Classement manuel)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.ca_rank || ''}
                      onChange={handleChange('ca_rank')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: 1 pour la meilleure pharmacie"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Plus le chiffre est petit, meilleur est le classement (1 = 1er)
                    </p>
                  </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};