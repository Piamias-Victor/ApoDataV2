// src/app/admin/pharmacies/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { PharmaciesTable } from '@/components/organisms/PharmaciesTable';
import { PharmacyEditModal } from '@/components/organisms/PharmacyEditModal';
import { UserCreateModal } from '@/components/organisms/UserCreateModal';
import { usePharmacies } from '@/hooks/admin/usePharmacies';
import type { Pharmacy, PharmacyUpdateData } from '@/types/pharmacy';

/**
 * Page Admin - Gestion des Pharmacies avec création d'utilisateurs intégrée
 * Accessible uniquement aux admins via /admin/pharmacies
 */
export default function PharmaciesAdminPage() {
  const router = useRouter();
  const { data, loading, error, filters, setSearch, setPage, refetch } = usePharmacies();
  
  // États modals
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);
  
  // États UI
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // === HANDLERS PHARMACIES ===
  const handleEdit = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsEditModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setSelectedPharmacy(null);
    setIsEditModalOpen(false);
  };
  
  const handleSavePharmacy = useCallback(async (id: string, updateData: PharmacyUpdateData) => {
    try {
      const response = await fetch(`/api/admin/pharmacies/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update pharmacy');
      }
      
      setSuccessMessage('Pharmacie mise à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      await refetch();
      
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      setSuccessMessage('Erreur lors de la mise à jour');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [refetch]);

  // === HANDLERS UTILISATEURS ===
  const handleCreateUser = () => {
    setIsUserCreateModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserCreateModalOpen(false);
  };

  const handleUserCreateSuccess = () => {
    setSuccessMessage('Utilisateur créé avec succès');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // === HANDLERS PAGINATION ===
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Génération des numéros de pages pour la pagination
  const generatePageNumbers = () => {
    if (!data?.pagination) return [];
    
    const { currentPage, totalPages } = data.pagination;
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* === HEADER AVEC ACTIONS === */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Pharmacies
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Administration des pharmacies et création d'utilisateurs
              </p>
            </div>
            
            {/* Actions principales */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg 
                  className="mr-2 h-4 w-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                  />
                </svg>
                Retour Dashboard
              </button>
              
              {/* Bouton création utilisateur */}
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Users className="mr-2 h-4 w-4" />
                Créer un utilisateur
              </button>
            </div>
          </div>
          
          {/* === STATISTIQUES === */}
          {data && data.pagination && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="text-sm font-medium text-gray-500">Total Pharmacies</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {data.pagination.totalItems}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="text-sm font-medium text-gray-500">Page Actuelle</div>
                <div className="mt-1 text-2xl font-bold text-blue-600">
                  {data.pagination.currentPage} / {data.pagination.totalPages}
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="text-sm font-medium text-gray-500">Résultats Affichés</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {data.pharmacies.length}
                </div>
              </motion.div>

              {/* Nouvelle statistique - Actions rapides */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4"
              >
                <div className="text-sm font-medium text-blue-600">Actions Rapides</div>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={handleCreateUser}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    + Utilisateur
                  </button>
                  <button
                    onClick={() => refetch()}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    ↻ Actualiser
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
        
        {/* === BARRE DE RECHERCHE === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Rechercher par nom de pharmacie..."
              value={filters.search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {filters.search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
        
        {/* === MESSAGES === */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{successMessage}</span>
            </div>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}
        
        {/* === TABLE DES PHARMACIES === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PharmaciesTable
            pharmacies={data?.pharmacies || []}
            loading={loading}
            onEdit={handleEdit}
          />
        </motion.div>
        
        {/* === PAGINATION === */}
        {data && data.pagination && data.pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center space-x-2"
          >
            {/* Bouton Précédent */}
            <button
              onClick={() => handlePageChange(data.pagination.currentPage - 1)}
              disabled={data.pagination.currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                data.pagination.currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Précédent
            </button>
            
            {/* Première page si non visible */}
            {(() => {
              const pages = generatePageNumbers();
              const firstPage = pages[0];
              if (pages.length > 0 && firstPage && firstPage > 1) {
                return (
                  <>
                    <button
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors duration-200"
                    >
                      1
                    </button>
                    {firstPage > 2 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </>
                );
              }
              return null;
            })()}
            
            {/* Numéros de pages */}
            {generatePageNumbers().map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  page === data.pagination.currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
            
            {/* Dernière page si non visible */}
            {(() => {
              const pages = generatePageNumbers();
              const lastPage = pages[pages.length - 1];
              if (pages.length > 0 && lastPage && lastPage < data.pagination.totalPages) {
                return (
                  <>
                    {lastPage < data.pagination.totalPages - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(data.pagination.totalPages)}
                      className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 transition-colors duration-200"
                    >
                      {data.pagination.totalPages}
                    </button>
                  </>
                );
              }
              return null;
            })()}
            
            {/* Bouton Suivant */}
            <button
              onClick={() => handlePageChange(data.pagination.currentPage + 1)}
              disabled={data.pagination.currentPage === data.pagination.totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                data.pagination.currentPage === data.pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Suivant
            </button>
          </motion.div>
        )}
      </div>
      
      {/* === MODALS === */}
      <PharmacyEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        pharmacy={selectedPharmacy}
        onSave={handleSavePharmacy}
      />

      <UserCreateModal
        isOpen={isUserCreateModalOpen}
        onClose={handleCloseUserModal}
        onSuccess={handleUserCreateSuccess}
      />
    </div>
  );
}