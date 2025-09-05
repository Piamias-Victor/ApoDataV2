// src/components/molecules/PharmacySelect.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Pharmacy {
  readonly id: string;
  readonly name: string;
  readonly area?: string;
  readonly address?: string;
}

interface PharmacySelectProps {
  readonly value: string | undefined;
  readonly onChange: (pharmacyId: string | undefined) => void;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export const PharmacySelect: React.FC<PharmacySelectProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Rechercher une pharmacie...'
}) => {
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger TOUTES les pharmacies au montage
  useEffect(() => {
    const loadAllPharmacies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Essayer d'abord avec une limite très élevée
        let response = await fetch('/api/admin/pharmacies?limit=10000&page=1', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        let pharmacies = result.pharmacies || [];
        
        // Filtrer et nettoyer les données pour éviter les valeurs nulles
        pharmacies = pharmacies.filter((p: any) => p && p.id && p.name).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          area: p.area || '',
          address: p.address || ''
        }));
        
        // Si on a moins de pharmacies que le total, récupérer toutes les pages
        if (result.pagination && result.pagination.totalItems > pharmacies.length) {
          const totalPages = result.pagination.totalPages;
          
          for (let page = 2; page <= totalPages; page++) {
            const pageResponse = await fetch(`/api/admin/pharmacies?limit=1000&page=${page}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            });
            
            if (pageResponse.ok) {
              const pageResult = await pageResponse.json();
              const pagePharmacies = (pageResult.pharmacies || [])
                .filter((p: any) => p && p.id && p.name)
                .map((p: any) => ({
                  id: p.id,
                  name: p.name || '',
                  area: p.area || '',
                  address: p.address || ''
                }));
              pharmacies = [...pharmacies, ...pagePharmacies];
            }
          }
        }
        
        console.log(`PharmacySelect: ${pharmacies.length} pharmacies chargées`);
        setAllPharmacies(pharmacies);
        
        // Si une valeur est présélectionnée, la trouver et l'afficher
        if (value && pharmacies.length > 0) {
          const preselected = pharmacies.find((p: Pharmacy) => p.id === value);
          if (preselected) {
            setSelectedPharmacy(preselected);
            setSearchQuery(`${preselected.name}${preselected.area ? ` - ${preselected.area}` : ''}`);
          }
        }
        
      } catch (err) {
        console.error('PharmacySelect error:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setAllPharmacies([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllPharmacies();
  }, []);

  // Mettre à jour l'affichage si la value change de l'extérieur
  useEffect(() => {
    if (value && allPharmacies.length > 0) {
      const pharmacy = allPharmacies.find(p => p.id === value);
      if (pharmacy) {
        setSelectedPharmacy(pharmacy);
        setSearchQuery(`${pharmacy.name}${pharmacy.area ? ` - ${pharmacy.area}` : ''}`);
      }
    } else if (!value) {
      setSelectedPharmacy(null);
      setSearchQuery('');
    }
  }, [value, allPharmacies]);

  // Filtrer les pharmacies selon la recherche AVEC VÉRIFICATIONS DE SÉCURITÉ
  const filteredPharmacies = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return allPharmacies;
    }
    
    const query = searchQuery.toLowerCase();
    return allPharmacies.filter(pharmacy => {
      // Vérifications de sécurité pour éviter les erreurs null/undefined
      const name = pharmacy.name || '';
      const area = pharmacy.area || '';
      const address = pharmacy.address || '';
      
      return (
        name.toLowerCase().includes(query) ||
        area.toLowerCase().includes(query) ||
        address.toLowerCase().includes(query)
      );
    });
  }, [allPharmacies, searchQuery]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setIsDropdownOpen(true);
    
    // Si on efface, reset la sélection
    if (!newQuery.trim()) {
      setSelectedPharmacy(null);
      onChange(undefined);
    }
  };

  const handleInputFocus = () => {
    if (!loading && allPharmacies.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handlePharmacyClick = (pharmacy: Pharmacy) => {
    if (pharmacy.id === 'admin') {
      // Option spéciale Admin
      setSelectedPharmacy(null);
      setSearchQuery('Aucune pharmacie (Admin)');
      onChange(undefined);
    } else {
      setSelectedPharmacy(pharmacy);
      setSearchQuery(`${pharmacy.name}${pharmacy.area ? ` - ${pharmacy.area}` : ''}`);
      onChange(pharmacy.id);
    }
    setIsDropdownOpen(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedPharmacy(null);
    setIsDropdownOpen(false);
    onChange(undefined);
  };

  // Gestion des erreurs
  if (error) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Pharmacie
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-red-700 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700">
        Pharmacie
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {/* Input de recherche - même style que la page admin */}
        <input
          type="text"
          placeholder={loading ? 'Chargement des pharmacies...' : placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled || loading}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        
        {/* Icône de recherche */}
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
        
        {/* Bouton effacer */}
        {searchQuery && !loading && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown des résultats */}
        <AnimatePresence>
          {isDropdownOpen && !loading && allPharmacies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {/* Option Admin si pas required */}
              {!required && (
                <button
                  onClick={() => handlePharmacyClick({ id: 'admin', name: 'Aucune pharmacie', area: 'Admin' } as Pharmacy)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition-colors border-b border-gray-100"
                >
                  <div className="font-medium text-gray-700">Aucune pharmacie (Admin)</div>
                  <div className="text-xs text-gray-500">Compte administrateur sans pharmacie liée</div>
                </button>
              )}
              
              {/* Liste des pharmacies filtrées */}
              {filteredPharmacies.length > 0 ? (
                <>
                  {filteredPharmacies.slice(0, 50).map((pharmacy) => (
                    <button
                      key={pharmacy.id}
                      onClick={() => handlePharmacyClick(pharmacy)}
                      className={`
                        w-full px-4 py-3 text-left text-sm hover:bg-gray-100 transition-colors
                        ${selectedPharmacy?.id === pharmacy.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                      `}
                    >
                      <div className="font-medium text-gray-900">{pharmacy.name || 'Nom non disponible'}</div>
                      {pharmacy.area && (
                        <div className="text-xs text-gray-500">{pharmacy.area}</div>
                      )}
                      {pharmacy.address && (
                        <div className="text-xs text-gray-400 truncate">{pharmacy.address}</div>
                      )}
                    </button>
                  ))}
                  
                  {/* Message si trop de résultats */}
                  {filteredPharmacies.length > 50 && (
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                      {filteredPharmacies.length - 50} pharmacies supplémentaires. Affinez votre recherche.
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  {searchQuery ? (
                    <>
                      Aucune pharmacie trouvée pour "<span className="font-medium">{searchQuery}</span>"
                      <br />
                      <span className="text-xs">Essayez un nom ou une zone différente</span>
                    </>
                  ) : (
                    <>
                      {allPharmacies.length} pharmacies disponibles
                      <br />
                      <span className="text-xs">Tapez pour rechercher</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicateur de chargement */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {/* Info debug en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400">
          {allPharmacies.length} pharmacies chargées
          {filteredPharmacies.length !== allPharmacies.length && 
            ` • ${filteredPharmacies.length} résultats filtrés`
          }
        </div>
      )}
    </div>
  );
};