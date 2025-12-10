// src/hooks/filters/useSavedFilters.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { useGenericGroupStore } from '@/stores/useGenericGroupStore';
import type {
  SavedFilter,
  FilterType,
  SaveFilterPayload,
  SaveClassicFilterPayload,
  SaveGenericFilterPayload,
  LoadClassicFilterResult,
  LoadGenericFilterResult,
  UseSavedFiltersReturn,
} from '@/types/savedFilters';
import type { SelectedPharmacy } from '@/stores/useFiltersStore';

/**
 * Hook pour gérer les filtres sauvegardés - CLASSIQUES + GÉNÉRIQUES
 * 
 * Features :
 * - Liste des filtres sauvegardés (filtrés par type)
 * - Sauvegarde de la sélection actuelle (détection auto du type)
 * - Chargement d'un filtre (applique au bon store)
 * - Renommage d'un filtre
 * - Suppression d'un filtre
 */
export function useSavedFilters(filterType?: FilterType): UseSavedFiltersReturn {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingFilter, setIsLoadingFilter] = useState<boolean>(false);
  const [isDeletingFilter, setIsDeletingFilter] = useState<boolean>(false);
  const [isRenamingFilter, setIsRenamingFilter] = useState<boolean>(false);

  // ===== ACCÈS AUX STORES =====

  // Store classique
  const {
    products,
    selectedProducts,
    selectedLaboratories,
    selectedCategories,
    pharmacy,
    excludedProducts: classicExcludedProducts,
    selectedExcludedProducts: classicSelectedExcludedProducts,
    analysisDateRange,
    comparisonDateRange,
    setProductFiltersWithNames,
    setLaboratoryFiltersWithNames,
    setCategoryFiltersWithNames,
    setPharmacyFiltersWithNames,
    setExcludedProductsWithNames: setClassicExcludedProductsWithNames,
    setAnalysisDateRange,
    setComparisonDateRange,
    clearAllFilters: clearClassicFilters,
  } = useFiltersStore();

  // Store générique
  const {
    selectedGroups,
    selectedProducts: genericSelectedProducts,
    selectedLaboratories: genericSelectedLaboratories,
    excludedProducts: genericExcludedProducts,
    selectedExcludedProducts: genericSelectedExcludedProducts,
    priceFilters,
    tvaRates,
    genericStatus,
    dateRange: genericDateRange,
    showGlobalTop,
    clearSelection: clearGenericSelection,
    addProducts,
    addLaboratories,
    setExcludedProductsWithNames: setGenericExcludedProductsWithNames,
    setPriceFilters,
    setTvaRates,
    setGenericStatus,
    setDateRange: setGenericDateRange,
    setShowGlobalTop,
    recalculateProductCodes,
  } = useGenericGroupStore();

  /**
   * Récupère la liste des filtres sauvegardés (avec filtrage optionnel par type)
   */
  const refreshFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = filterType 
        ? `/api/saved-filters?filter_type=${filterType}`
        : '/api/saved-filters';

      const response = await fetch(url, {
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

      console.log('✅ [useSavedFilters] Filters loaded:', {
        filterType: filterType || 'all',
        count: data.filters?.length || 0
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      console.error('❌ [useSavedFilters] Error loading filters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  /**
   * Charge automatiquement les filtres au mount
   */
  useEffect(() => {
    refreshFilters();
  }, [refreshFilters]);

  /**
   * Sauvegarde la sélection actuelle des filtres
   * Le type est passé explicitement pour éviter toute ambiguïté
   */
  const saveCurrentFilters = useCallback(
    async (name: string, type: FilterType) => {
      try {
        setIsSaving(true);
        setError(null);

        let payload: SaveFilterPayload;

        if (type === 'classic') {
          // === VALIDATION CLASSIQUE ===
          if (!analysisDateRange.start || !analysisDateRange.end) {
            throw new Error('Les dates d\'analyse sont obligatoires');
          }

          const classicPayload: SaveClassicFilterPayload = {
            filter_type: 'classic',
            name: name.trim(),
            pharmacy_ids: pharmacy,
            product_codes: products,
            laboratory_names: selectedLaboratories.map(lab => lab.name),
            category_names: selectedCategories.map(cat => cat.name),
            category_types: selectedCategories.map(cat => cat.type),
            excluded_product_codes: classicExcludedProducts,
            analysis_date_start: analysisDateRange.start,
            analysis_date_end: analysisDateRange.end,
            comparison_date_start: comparisonDateRange.start || null,
            comparison_date_end: comparisonDateRange.end || null,
          };

          console.log('💾 [useSavedFilters] Saving CLASSIC filter:', {
            name: classicPayload.name,
            products: classicPayload.product_codes.length,
            laboratories: classicPayload.laboratory_names.length,
            categories: classicPayload.category_names.length,
            pharmacies: classicPayload.pharmacy_ids.length,
            exclusions: classicPayload.excluded_product_codes.length,
          });

          payload = classicPayload;

        } else {
          // === VALIDATION GÉNÉRIQUE ===
          if (!genericDateRange) {
            throw new Error('Les dates d\'analyse sont obligatoires');
          }

          const genericPayload: SaveGenericFilterPayload = {
            filter_type: 'generic',
            name: name.trim(),
            pharmacy_ids: pharmacy,
            generic_groups: selectedGroups,
            generic_products: genericSelectedProducts,
            generic_laboratories: genericSelectedLaboratories,
            price_filters: priceFilters,
            tva_rates: tvaRates,
            generic_status: genericStatus,
            show_global_top: showGlobalTop,
            excluded_product_codes: genericExcludedProducts,
            analysis_date_start: genericDateRange.start,
            analysis_date_end: genericDateRange.end,
            comparison_date_start: comparisonDateRange.start || null,
            comparison_date_end: comparisonDateRange.end || null,
          };

          console.log('💾 [useSavedFilters] Saving GENERIC filter:', {
            name: genericPayload.name,
            groups: genericPayload.generic_groups.length,
            products: genericPayload.generic_products.length,
            laboratories: genericPayload.generic_laboratories.length,
            pharmacies: genericPayload.pharmacy_ids.length,
            exclusions: genericPayload.excluded_product_codes.length,
            hasPriceFilters: Object.values(genericPayload.price_filters).some(
              range => range.min !== null || range.max !== null
            ),
            tvaRates: genericPayload.tva_rates.length,
            genericStatus: genericPayload.generic_status,
          });

          payload = genericPayload;
        }

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

        console.log('✅ [useSavedFilters] Filter saved:', {
          id: data.filter.id,
          type: data.filter.filter_type,
        });
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
      // Classique
      products,
      selectedLaboratories,
      selectedCategories,
      pharmacy,
      classicExcludedProducts,
      analysisDateRange,
      comparisonDateRange,
      // Générique
      selectedGroups,
      genericSelectedProducts,
      genericSelectedLaboratories,
      genericExcludedProducts,
      priceFilters,
      tvaRates,
      genericStatus,
      genericDateRange,
      showGlobalTop,
    ]
  );

  /**
   * Charge un filtre sauvegardé et l'applique au bon store
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

        const data = await response.json();

        if ('resolvedProductCodes' in data) {
          // === FILTRE CLASSIQUE ===
          const classicData = data as LoadClassicFilterResult;

          console.log('📊 [useSavedFilters] Loading CLASSIC filter:', {
            name: classicData.filter.name,
            totalProducts: classicData.resolvedProductCodes.length,
            laboratories: classicData.resolvedLaboratories.length,
            categories: classicData.resolvedCategories.length,
            pharmacies: classicData.resolvedPharmacies.length,
            exclusions: classicData.filter.excluded_product_codes.length,
          });

          // Effacer tous les filtres classiques
          clearClassicFilters();

          // Appliquer les produits directs
          if (classicData.filter.product_codes.length > 0) {
            setProductFiltersWithNames(
              classicData.filter.product_codes,
              classicData.filter.product_codes.map(code => {
                const product = selectedProducts.find(p => p.code === code);
                return product || {
                  code,
                  name: `Produit ${code}`,
                };
              })
            );
          }

          // Appliquer les laboratoires
          if (classicData.resolvedLaboratories.length > 0) {
            const allLabCodes = classicData.resolvedLaboratories.flatMap(lab => lab.productCodes);
            setLaboratoryFiltersWithNames(allLabCodes, classicData.resolvedLaboratories);
          }

          // Appliquer les catégories
          if (classicData.resolvedCategories.length > 0) {
            const allCatCodes = classicData.resolvedCategories.flatMap(cat => cat.productCodes);
            setCategoryFiltersWithNames(allCatCodes, classicData.resolvedCategories);
          }

          // Appliquer les pharmacies
          if (classicData.resolvedPharmacies.length > 0) {
            const pharmaciesWithNames: SelectedPharmacy[] = classicData.resolvedPharmacies.map(pharmacy => ({
              id: pharmacy.id,
              name: pharmacy.name,
              address: pharmacy.address || 'Adresse non disponible',
              ca: pharmacy.ca || 0,
              area: pharmacy.area || 'Zone non définie',
              employees_count: pharmacy.employees_count || 0,
              id_nat: pharmacy.id_nat || '',
            }));
            
            const pharmacyIds = classicData.resolvedPharmacies.map(p => p.id);
            setPharmacyFiltersWithNames(pharmacyIds, pharmaciesWithNames);
          }

          // Appliquer les exclusions
          if (classicData.filter.excluded_product_codes.length > 0) {
            setClassicExcludedProductsWithNames(
              classicData.filter.excluded_product_codes,
              classicData.filter.excluded_product_codes.map(code => {
                const excluded = classicSelectedExcludedProducts.find(p => p.code === code);
                return excluded || {
                  code,
                  name: `Produit exclu ${code}`,
                };
              })
            );
          }

          // Appliquer les dates
          setAnalysisDateRange(
            classicData.filter.analysis_date_start,
            classicData.filter.analysis_date_end
          );

          if (classicData.filter.comparison_date_start && classicData.filter.comparison_date_end) {
            setComparisonDateRange(
              classicData.filter.comparison_date_start,
              classicData.filter.comparison_date_end
            );
          } else {
            setComparisonDateRange(null, null);
          }

        } else {
          // === FILTRE GÉNÉRIQUE ===
          const genericData = data as LoadGenericFilterResult;

          console.log('📊 [useSavedFilters] Loading GENERIC filter:', {
            name: genericData.filter.name,
            groups: genericData.filter.generic_groups.length,
            products: genericData.filter.generic_products.length,
            laboratories: genericData.filter.generic_laboratories.length,
            pharmacies: genericData.resolvedPharmacies.length,
            exclusions: genericData.filter.excluded_product_codes.length,
          });

          // Effacer tous les filtres génériques
          clearGenericSelection();

          // Ajouter les groupes un par un avec mapping null
          const store = useGenericGroupStore.getState();
          genericData.filter.generic_groups.forEach(group => {
            store.addGroup({
              generic_group: group.generic_group,
              product_codes: group.product_codes,
              product_count: group.product_count,
              referent_name: group.referent_name ?? null,
              referent_code: group.referent_code ?? null,
              referent_lab: group.referent_lab ?? null,
              generic_count: group.generic_count ?? 0,
            });
          });

          // Mapper les produits avec le bon type
          if (genericData.filter.generic_products.length > 0) {
            const mappedProducts = genericData.filter.generic_products.map(p => ({
              code_13_ref: p.code_13_ref,
              name: p.name,
              bcb_lab: p.laboratory_name || p.bcb_lab || '',
              bcb_generic_status: (p.bcb_generic_status as 'GÉNÉRIQUE' | 'RÉFÉRENT' | undefined) || 'GÉNÉRIQUE',
              bcb_generic_group: p.bcb_generic_group || '',
            }));
            addProducts(mappedProducts);
          }

          // Mapper les laboratoires avec null → 0
          if (genericData.filter.generic_laboratories.length > 0) {
            const mappedLabs = genericData.filter.generic_laboratories.map(l => ({
              laboratory_name: l.laboratory_name,
              product_codes: l.product_codes,
              product_count: l.product_count,
              generic_count: l.generic_count ?? 0, // 🔥 null → 0
              referent_count: l.referent_count ?? 0, // 🔥 null → 0
            }));
            addLaboratories(mappedLabs);
          }

          // Appliquer les pharmacies
          if (genericData.resolvedPharmacies.length > 0) {
            const pharmaciesWithNames: SelectedPharmacy[] = genericData.resolvedPharmacies.map(pharmacy => ({
              id: pharmacy.id,
              name: pharmacy.name,
              address: pharmacy.address || 'Adresse non disponible',
              ca: pharmacy.ca || 0,
              area: pharmacy.area || 'Zone non définie',
              employees_count: pharmacy.employees_count || 0,
              id_nat: pharmacy.id_nat || '',
            }));
            
            const pharmacyIds = genericData.resolvedPharmacies.map(p => p.id);
            setPharmacyFiltersWithNames(pharmacyIds, pharmaciesWithNames);
          }

          // Appliquer les exclusions
          if (genericData.filter.excluded_product_codes.length > 0) {
            setGenericExcludedProductsWithNames(
              genericData.filter.excluded_product_codes,
              genericData.filter.excluded_product_codes.map(code => {
                const excluded = genericSelectedExcludedProducts.find(p => p.code === code);
                return excluded || {
                  code,
                  name: `Produit exclu ${code}`,
                };
              })
            );
          }

          // Appliquer les filtres de prix
          setPriceFilters(genericData.filter.price_filters);

          // Appliquer les taux TVA
          setTvaRates(genericData.filter.tva_rates);

          // Appliquer le statut générique
          setGenericStatus(genericData.filter.generic_status);

          // Appliquer le mode global
          setShowGlobalTop(genericData.filter.show_global_top);

  // Appliquer les dates
          setGenericDateRange({
          start: genericData.filter.analysis_date_start,
          end: genericData.filter.analysis_date_end
        });
        
          setAnalysisDateRange(
            genericData.filter.analysis_date_start,
            genericData.filter.analysis_date_end
          );

          if (genericData.filter.comparison_date_start && genericData.filter.comparison_date_end) {
            setComparisonDateRange(
              genericData.filter.comparison_date_start,
              genericData.filter.comparison_date_end
            );
          } else {
            setComparisonDateRange(null, null);
          }

          // Recalculer les product codes
          recalculateProductCodes();
        }

        console.log('✅ [useSavedFilters] Filter applied successfully');
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
      clearClassicFilters,
      clearGenericSelection,
      setProductFiltersWithNames,
      setLaboratoryFiltersWithNames,
      setCategoryFiltersWithNames,
      setPharmacyFiltersWithNames,
      setClassicExcludedProductsWithNames,
      setGenericExcludedProductsWithNames,
      setAnalysisDateRange,
      setComparisonDateRange,
      addProducts,
      addLaboratories,
      setPriceFilters,
      setTvaRates,
      setGenericStatus,
      setGenericDateRange,
      setShowGlobalTop,
      recalculateProductCodes,
      selectedProducts,
      classicSelectedExcludedProducts,
      genericSelectedExcludedProducts,
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