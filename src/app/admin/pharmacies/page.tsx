// src/app/admin/pharmacies/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, Building2 } from 'lucide-react';
import { PharmaciesTable } from '@/components/organisms/PharmaciesTable';
import { PharmacyEditModal } from '@/components/organisms/PharmacyEditModal';
import { UserCreateModal } from '@/components/organisms/UserCreateModal';
import { UsersTable } from '@/components/organisms/UsersTable/UsersTable';
import { UserEditModal } from '@/components/organisms/UserEditModal/UserEditModal';
import { usePharmacies } from '@/hooks/admin/usePharmacies';
import { useUsers } from '@/hooks/admin/useUsers';
import type { Pharmacy, PharmacyUpdateData } from '@/types/pharmacy';
import type { User, UserUpdateData } from '@/types/user';

/**
 * Page Admin - Gestion des Pharmacies et Utilisateurs
 * Accessible uniquement aux admins via /admin/pharmacies
 */
export default function PharmaciesAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pharmacies' | 'users'>('pharmacies');

  // Hooks
  const {
    data: pharmaciesData,
    loading: pharmaciesLoading,
    error: pharmaciesError,
    filters: pharmacyFilters,
    setSearch: setPharmacySearch,
    setPage: setPharmacyPage,
    refetch: refetchPharmacies
  } = usePharmacies();

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    filters: userFilters,
    setSearch: setUserSearch,
    setPage: setUserPage,
    toggleDeleted,
    refetch: refetchUsers
  } = useUsers();

  // États modals Pharmacies
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isPharmacyEditModalOpen, setIsPharmacyEditModalOpen] = useState(false);

  // États modals Utilisateurs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);

  // États UI
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // === HANDLERS PHARMACIES ===
  const handleEditPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setIsPharmacyEditModalOpen(true);
  };

  const handleSavePharmacy = useCallback(async (id: string, updateData: PharmacyUpdateData) => {
    try {
      const response = await fetch(`/api/admin/pharmacies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to update pharmacy');

      setSuccessMessage('Pharmacie mise à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      await refetchPharmacies();

    } catch (error) {
      console.error('Error updating pharmacy:', error);
      setSuccessMessage('Erreur lors de la mise à jour');
    }
  }, [refetchPharmacies]);

  // === HANDLERS UTILISATEURS ===
  const handleCreateUser = () => setIsUserCreateModalOpen(true);

  const handleUserCreateSuccess = () => {
    setSuccessMessage('Utilisateur créé avec succès');
    setTimeout(() => setSuccessMessage(null), 3000);
    refetchUsers();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserEditModalOpen(true);
  };

  const handleSaveUser = async (id: string, data: UserUpdateData) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update user');

      setSuccessMessage('Utilisateur mis à jour avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      await refetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setSuccessMessage('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      setSuccessMessage('Utilisateur supprimé avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      await refetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setSuccessMessage('Erreur lors de la suppression');
    }
  };

  // === PAGINATION ===
  const handlePageChange = (newPage: number) => {
    if (activeTab === 'pharmacies') {
      setPharmacyPage(newPage);
    } else {
      setUserPage(newPage);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPagination = activeTab === 'pharmacies' ? pharmaciesData?.pagination : usersData?.pagination;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-[1600px] mx-auto">

        {/* === HEADER === */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
              <p className="mt-2 text-sm text-gray-600">
                Gestion des pharmacies et des utilisateurs
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Retour Dashboard
              </button>

              <button
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Users className="mr-2 h-4 w-4" />
                Créer un utilisateur
              </button>
            </div>
          </div>

          {/* === TABS === */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pharmacies')}
                className={`${activeTab === 'pharmacies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Building2 className="mr-2 h-5 w-5" />
                Pharmacies
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`${activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className="mr-2 h-5 w-5" />
                Utilisateurs
              </button>
            </nav>
          </div>

          {/* === FILTRES & RECHERCHE === */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder={activeTab === 'pharmacies' ? "Rechercher une pharmacie..." : "Rechercher un utilisateur..."}
                value={activeTab === 'pharmacies' ? pharmacyFilters.search || '' : userFilters?.search || ''}
                onChange={(e) => activeTab === 'pharmacies' ? setPharmacySearch(e.target.value) : setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {activeTab === 'users' && (
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userFilters?.includeDeleted || false}
                    onChange={toggleDeleted}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Voir supprimés</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* === MESSAGES === */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        {(pharmaciesError || usersError) && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{pharmaciesError || usersError}</span>
          </div>
        )}

        {/* === CONTENU === */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'pharmacies' ? (
            <PharmaciesTable
              pharmacies={pharmaciesData?.pharmacies || []}
              loading={pharmaciesLoading}
              onEdit={handleEditPharmacy}
            />
          ) : (
            <UsersTable
              users={usersData?.users || []}
              loading={usersLoading}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          )}
        </motion.div>

        {/* === PAGINATION === */}
        {currentPagination && currentPagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPagination.currentPage - 1)}
              disabled={currentPagination.currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium ${currentPagination.currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPagination.currentPage} sur {currentPagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPagination.currentPage + 1)}
              disabled={currentPagination.currentPage === currentPagination.totalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium ${currentPagination.currentPage === currentPagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* === MODALS === */}
      <PharmacyEditModal
        isOpen={isPharmacyEditModalOpen}
        onClose={() => setIsPharmacyEditModalOpen(false)}
        pharmacy={selectedPharmacy}
        onSave={handleSavePharmacy}
      />

      <UserCreateModal
        isOpen={isUserCreateModalOpen}
        onClose={() => setIsUserCreateModalOpen(false)}
        onSuccess={handleUserCreateSuccess}
      />

      <UserEditModal
        isOpen={isUserEditModalOpen}
        onClose={() => setIsUserEditModalOpen(false)}
        user={selectedUser}
        pharmacies={pharmaciesData?.pharmacies || []}
        onSave={handleSaveUser}
      />
    </div>
  );
}