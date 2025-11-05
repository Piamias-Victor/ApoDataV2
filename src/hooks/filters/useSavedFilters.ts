// src/hooks/filters/useSavedFilters.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import type {
  SavedFilter,
  SaveFilterPayload,
  LoadFilterResult,
  UseSavedFiltersReturn,
} from '@/types/savedFilters';
import type { SelectedPharmacy } from '@/stores/useFiltersStore';

/**
 * Hook pour gérer les filtres sauvegardés
 * 
 * Features :
 * - Liste des filtres sauvegardés
 * - Sauvegarde de la sélection actuelle (produits, labos, catégories, pharmacies, dates)
 * - Chargement d'un filtre (applique au store)
 * - Renommage d'un filtre
 * - Suppression d'un filtre
 */
export function useSavedFilters(): UseSavedFiltersReturn {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingFilter, setIsLoadingFilter] = useState<boolean>(false);
  const [isDeletingFilter, setIsDeletingFilter] = useState<boolean>(false);
  const [isRenamingFilter, setIsRenamingFilter] = useState<boolean>(false);

  // Accès au store pour récupérer les filtres actuels et les appliquer
  const {
    products,
    selectedProducts,
    selectedLaboratories,
    selectedCategories,
    pharmacy,
    selectedPharmacies,
    analysisDateRange,
    comparisonDateRange,
    setProductFiltersWithNames,
    setLaboratoryFiltersWithNames,
    setCategoryFiltersWithNames,
    setPharmacyFiltersWithNames,
    setAnalysisDateRange,
    setComparisonDateRange,
    clearAllFilters,
  } = useFiltersStore();

  /**
   * Récupère la liste des filtres sauvegardés
   */
  const refreshFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/saved-filters', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des filtres');
      }

      const data = await response.json();
      setSavedFilters(data.filters || []);

      console.log('✅ [useSavedFilters] Filters loaded:', data.filters?.length || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('❌ [useSavedFilters] Error loading filters:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge automatiquement les filtres au mount
   */
  useEffect(() => {
    refreshFilters();
  }, [refreshFilters]);

  /**
   * Sauvegarde la sélection actuelle des filtres
   */
  const saveCurrentFilters = useCallback(
    async (name: string) => {
      try {
        setIsSaving(true);
        setError(null);

        // Validation dates
        if (!analysisDateRange.start || !analysisDateRange.end) {
          throw new Error('Les dates d\'analyse sont obligatoires');
        }

        // Construire le payload depuis le store
        const payload: SaveFilterPayload = {
          name: name.trim(),
          product_codes: products,
          laboratory_names: selectedLaboratories.map(lab => lab.name),
          category_names: selectedCategories.map(cat => cat.name),
          category_types: selectedCategories.map(cat => cat.type),
          pharmacy_ids: pharmacy,
          analysis_date_start: analysisDateRange.start,
          analysis_date_end: analysisDateRange.end,
          comparison_date_start: comparisonDateRange.start || null,
          comparison_date_end: comparisonDateRange.end || null,
        };

        console.log('💾 [useSavedFilters] Saving filter:', {
          name: payload.name,
          products: payload.product_codes.length,
          laboratories: payload.laboratory_names.length,
          categories: payload.category_names.length,
          pharmacies: payload.pharmacy_ids.length,
          dates: `${payload.analysis_date_start} → ${payload.analysis_date_end}`,
          hasComparison: !!(payload.comparison_date_start && payload.comparison_date_end),
        });

        const response = await fetch('/api/saved-filters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }

        const data = await response.json();
        
        // Ajouter le nouveau filtre à la liste
        setSavedFilters(prev => [data.filter, ...prev]);

        console.log('✅ [useSavedFilters] Filter saved:', data.filter.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
        console.error('❌ [useSavedFilters] Error saving filter:', err);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [
      products,
      selectedLaboratories,
      selectedCategories,
      pharmacy,
      analysisDateRange,
      comparisonDateRange,
    ]
  );

  /**
   * Charge un filtre sauvegardé et l'applique au store
   * Remplace complètement les filtres actuels (écrasement)
   */
  const loadFilter = useCallback(
    async (id: string) => {
      try {
        setIsLoadingFilter(true);
        setError(null);

        console.log('📂 [useSavedFilters] Loading filter:', id);

        const response = await fetch(`/api/saved-filters/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du chargement du filtre');
        }

        const data: LoadFilterResult = await response.json();

        console.log('📊 [useSavedFilters] Filter loaded:', {
          name: data.filter.name,
          totalProducts: data.resolvedProductCodes.length,
          laboratories: data.resolvedLaboratories.length,
          categories: data.resolvedCategories.length,
          pharmacies: data.resolvedPharmacies.length,
          dates: `${data.filter.analysis_date_start} → ${data.filter.analysis_date_end}`,
        });

        // ✅ Effacer TOUS les filtres actuels (écrasement complet)
        clearAllFilters();

        // Appliquer les produits directs
        if (data.filter.product_codes.length > 0) {
          setProductFiltersWithNames(
            data.filter.product_codes,
            data.filter.product_codes.map(code => {
              const product = selectedProducts.find(p => p.code === code);
              return product || {
                code,
                name: `Produit ${code}`,
              };
            })
          );
        }

        // Appliquer les laboratoires
        if (data.resolvedLaboratories.length > 0) {
          const allLabCodes = data.resolvedLaboratories.flatMap(lab => lab.productCodes);
          setLaboratoryFiltersWithNames(allLabCodes, data.resolvedLaboratories);
        }

        // Appliquer les catégories
        if (data.resolvedCategories.length > 0) {
          const allCatCodes = data.resolvedCategories.flatMap(cat => cat.productCodes);
          setCategoryFiltersWithNames(allCatCodes, data.resolvedCategories);
        }

        // ✅ Appliquer les pharmacies avec données complètes de la DB
        if (data.resolvedPharmacies.length > 0) {
          const pharmaciesWithNames: SelectedPharmacy[] = data.resolvedPharmacies.map(pharmacy => ({
            id: pharmacy.id,
            name: pharmacy.name,
            address: pharmacy.address || 'Adresse non disponible',
            ca: pharmacy.ca || 0,
            area: pharmacy.area || 'Zone non définie',
            employees_count: pharmacy.employees_count || 0,
            id_nat: pharmacy.id_nat || '',
          }));
          
          const pharmacyIds = data.resolvedPharmacies.map(p => p.id);
          setPharmacyFiltersWithNames(pharmacyIds, pharmaciesWithNames);
        }

        // ✅ Appliquer les dates d'analyse (obligatoires)
        setAnalysisDateRange(
          data.filter.analysis_date_start,
          data.filter.analysis_date_end
        );

        // ✅ Appliquer les dates de comparaison (optionnelles)
        if (data.filter.comparison_date_start && data.filter.comparison_date_end) {
          setComparisonDateRange(
            data.filter.comparison_date_start,
            data.filter.comparison_date_end
          );
        } else {
          setComparisonDateRange(null, null);
        }

        console.log('✅ [useSavedFilters] Filter applied to store (complete override)');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
        console.error('❌ [useSavedFilters] Error loading filter:', err);
        throw err;
      } finally {
        setIsLoadingFilter(false);
      }
    },
    [
      clearAllFilters,
      setProductFiltersWithNames,
      setLaboratoryFiltersWithNames,
      setCategoryFiltersWithNames,
      setPharmacyFiltersWithNames,
      setAnalysisDateRange,
      setComparisonDateRange,
      selectedProducts,
      selectedPharmacies,
    ]
  );

  /**
   * Renomme un filtre sauvegardé
   */
  const renameFilter = useCallback(
    async (id: string, newName: string) => {
      try {
        setIsRenamingFilter(true);
        setError(null);

        console.log('✏️ [useSavedFilters] Renaming filter:', { id, newName });

        const response = await fetch(`/api/saved-filters/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du renommage');
        }

        const data = await response.json();

        // Mettre à jour la liste locale
        setSavedFilters(prev =>
          prev.map(f => (f.id === id ? data.filter : f))
        );

        console.log('✅ [useSavedFilters] Filter renamed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
        console.error('❌ [useSavedFilters] Error renaming filter:', err);
        throw err;
      } finally {
        setIsRenamingFilter(false);
      }
    },
    []
  );

  /**
   * Supprime un filtre sauvegardé
   */
  const deleteFilter = useCallback(
    async (id: string) => {
      try {
        setIsDeletingFilter(true);
        setError(null);

        console.log('🗑️ [useSavedFilters] Deleting filter:', id);

        const response = await fetch(`/api/saved-filters/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }

        // Retirer de la liste locale
        setSavedFilters(prev => prev.filter(f => f.id !== id));

        console.log('✅ [useSavedFilters] Filter deleted');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
        console.error('❌ [useSavedFilters] Error deleting filter:', err);
        throw err;
      } finally {
        setIsDeletingFilter(false);
      }
    },
    []
  );

  return {
    savedFilters,
    isLoading,
    error,
    isSaving,
    isLoadingFilter,
    isDeletingFilter,
    isRenamingFilter,
    loadFilter,
    saveCurrentFilters,
    renameFilter,
    deleteFilter,
    refreshFilters,
  };
}