// src/components/organisms/DateDrawer/DateDrawer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import { useFiltersStore } from '@/stores/useFiltersStore';

interface DateDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCountChange: (count: number) => void;
}

type TabType = 'analysis' | 'comparison';

interface PresetOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

const analysisPresets: PresetOption[] = [
  { id: 'current-month', label: 'Mois en cours', description: 'Du 1er au jour actuel' },
  { id: 'last-month', label: 'Mois dernier', description: 'Mois précédent complet' },
  { id: 'current-year', label: 'Année en cours', description: 'Du 1er janvier au jour actuel' },
  { id: 'last-year', label: 'Année dernière', description: 'Année précédente complète' },
  { id: 'last-12-months', label: '12 derniers mois', description: '365 jours glissants' },
];

const comparisonPresets: PresetOption[] = [
  { id: 'n-1', label: 'N-1', description: 'Même période année précédente' },
  { id: 'previous-period', label: 'Période précédente', description: 'Période juste avant l\'analyse' },
];

/**
 * Conversion Date vers string avec protection TypeScript
 */
const toSafeDateString = (date: Date): string => {
  try {
    const iso = date.toISOString();
    return iso.split('T')[0] || '';
  } catch {
    return '';
  }
};

/**
 * DateDrawer Component - AVEC PENDING STATE ET BOUTON APPLIQUER
 * 
 * Nouvelles fonctionnalités :
 * - Pending state : les modifications ne sont pas appliquées au store immédiatement
 * - Bouton "Appliquer" obligatoire pour valider les changements
 * - Bouton "Effacer dates" pour reset
 * - Cohérence visuelle avec les autres drawers
 */
export const DateDrawer: React.FC<DateDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');
  
  // PENDING STATE - États locaux pour les modifications non appliquées
  const [pendingAnalysisStart, setPendingAnalysisStart] = useState('');
  const [pendingAnalysisEnd, setPendingAnalysisEnd] = useState('');
  const [pendingComparisonStart, setPendingComparisonStart] = useState('');
  const [pendingComparisonEnd, setPendingComparisonEnd] = useState('');
  
  const [validationError, setValidationError] = useState<string>('');
  
  // Refs pour éviter les boucles infinies
  const countRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    analysisDateRange,
    comparisonDateRange,
    setAnalysisDateRange,
    setComparisonDateRange,
    clearComparisonDateRange,
    resetToDefaultDates
  } = useFiltersStore();

  // Initialize pending states with store values when drawer opens
  useEffect(() => {
    if (isOpen) {
      console.log('📅 [DateDrawer] Initializing pending states from store');
      
      setPendingAnalysisStart(formatDateForInput(analysisDateRange.start));
      setPendingAnalysisEnd(formatDateForInput(analysisDateRange.end));
      
      if (comparisonDateRange.start && comparisonDateRange.end) {
        setPendingComparisonStart(formatDateForInput(comparisonDateRange.start));
        setPendingComparisonEnd(formatDateForInput(comparisonDateRange.end));
      } else {
        setPendingComparisonStart('');
        setPendingComparisonEnd('');
      }
      
      setValidationError('');
    }
  }, [isOpen, analysisDateRange.start, analysisDateRange.end, comparisonDateRange.start, comparisonDateRange.end]);

  // Update count based on pending states
  useEffect(() => {
    const analysisCount = pendingAnalysisStart && pendingAnalysisEnd ? 1 : 0;
    const comparisonCount = pendingComparisonStart && pendingComparisonEnd ? 1 : 0;
    const newCount = analysisCount + comparisonCount;
    
    // Guard : éviter les appels redondants
    if (countRef.current !== newCount) {
      countRef.current = newCount;
      
      // Clear timeout précédent
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounce pour éviter les appels multiples
      timeoutRef.current = setTimeout(() => {
        console.log(`📊 [DateDrawer] Count updated: ${newCount} (analysis: ${analysisCount}, comparison: ${comparisonCount})`);
        onCountChange(newCount);
      }, 50);
    }
  }, [pendingAnalysisStart, pendingAnalysisEnd, pendingComparisonStart, pendingComparisonEnd, onCountChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatDateForInput = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const isoString = date.toISOString();
      const datePart = isoString.split('T')[0];
      return datePart || '';
    } catch {
      return '';
    }
  };

  const formatDateForDisplay = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const validateDates = (start: string, end: string): string => {
    if (!start.trim() || !end.trim()) {
      return 'Les dates de début et de fin sont obligatoires';
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Format de date invalide';
    }
    
    if (startDate > endDate) {
      return 'La date de début doit être antérieure à la date de fin';
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (endDate > today) {
      return 'La date de fin ne peut pas être dans le futur';
    }
    
    return '';
  };

  const calculateDateRange = (presetId: string, type: 'analysis' | 'comparison') => {
    console.log(`🧮 [DateDrawer] Calculating ${type} preset: ${presetId}`);
    setValidationError('');
    
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    try {
      if (type === 'analysis') {
        switch (presetId) {
          case 'current-month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
          case 'last-month':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
          case 'current-year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;
          case 'last-year':
            startDate = new Date(today.getFullYear() - 1, 0, 1);
            endDate = new Date(today.getFullYear() - 1, 11, 31);
            break;
          case 'last-12-months':
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            endDate = today;
            break;
          default:
            console.warn(`Preset analysis inconnu: ${presetId}`);
            return;
        }
        
        setPendingAnalysisStart(toSafeDateString(startDate));
        setPendingAnalysisEnd(toSafeDateString(endDate));
        
      } else {
        const analysisStart = pendingAnalysisStart || analysisDateRange.start;
        const analysisEnd = pendingAnalysisEnd || analysisDateRange.end;
        
        if (!analysisStart || !analysisEnd) {
          setValidationError('Veuillez d\'abord définir une période d\'analyse');
          return;
        }
        
        const baseStart = new Date(analysisStart);
        const baseEnd = new Date(analysisEnd);
        
        switch (presetId) {
          case 'n-1':
            startDate = new Date(baseStart);
            startDate.setFullYear(baseStart.getFullYear() - 1);
            endDate = new Date(baseEnd);
            endDate.setFullYear(baseEnd.getFullYear() - 1);
            break;
          case 'previous-period':
            const duration = baseEnd.getTime() - baseStart.getTime();
            endDate = new Date(baseStart.getTime() - 24 * 60 * 60 * 1000);
            startDate = new Date(endDate.getTime() - duration);
            break;
          default:
            console.warn(`Preset comparison inconnu: ${presetId}`);
            return;
        }
        
        setPendingComparisonStart(toSafeDateString(startDate));
        setPendingComparisonEnd(toSafeDateString(endDate));
      }
      
    } catch (error) {
      console.error('Erreur calcul date range:', error);
      setValidationError('Erreur lors du calcul des dates');
    }
  };

  const handleCustomDateChange = (type: 'analysis' | 'comparison', field: 'start' | 'end', value: string) => {
    console.log(`📝 [DateDrawer] Custom date change: ${type}.${field} = ${value}`);
    setValidationError('');
    
    if (type === 'analysis') {
      if (field === 'start') {
        setPendingAnalysisStart(value);
      } else {
        setPendingAnalysisEnd(value);
      }
    } else {
      if (field === 'start') {
        setPendingComparisonStart(value);
      } else {
        setPendingComparisonEnd(value);
      }
    }
  };

  const handleClearComparison = () => {
    console.log('🗑️ [DateDrawer] Clearing pending comparison');
    setPendingComparisonStart('');
    setPendingComparisonEnd('');
    setValidationError('');
  };

  const handleResetDates = () => {
    console.log('🔄 [DateDrawer] Resetting to default dates');
    
    // Reset to default analysis dates
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setPendingAnalysisStart(toSafeDateString(firstDayOfMonth));
    setPendingAnalysisEnd(toSafeDateString(today));
    setPendingComparisonStart('');
    setPendingComparisonEnd('');
    setValidationError('');
  };

  // NOUVEAU : Fonction pour appliquer les changements au store
  const applyFilters = () => {
    console.log('✅ [DateDrawer] Applying pending filters to store');
    
    // Validation analysis dates
    const analysisError = validateDates(pendingAnalysisStart, pendingAnalysisEnd);
    if (analysisError) {
      setValidationError(analysisError);
      return;
    }

    // Validation comparison dates si présentes
    if (pendingComparisonStart && pendingComparisonEnd) {
      const comparisonError = validateDates(pendingComparisonStart, pendingComparisonEnd);
      if (comparisonError) {
        setValidationError(`Comparaison: ${comparisonError}`);
        return;
      }
    }

    // Apply analysis dates to store
    setAnalysisDateRange(pendingAnalysisStart, pendingAnalysisEnd);
    
    // Apply comparison dates to store
    if (pendingComparisonStart && pendingComparisonEnd) {
      setComparisonDateRange(pendingComparisonStart, pendingComparisonEnd);
    } else {
      clearComparisonDateRange();
    }
    
    setValidationError('');
    console.log('📅 [DateDrawer] Filters applied successfully');
  };

  // NOUVEAU : Fonction pour effacer complètement les dates
  const clearDateFilters = () => {
    console.log('🗑️ [DateDrawer] Clearing all date filters');
    resetToDefaultDates();
    
    // Reset pending states to new defaults
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setPendingAnalysisStart(toSafeDateString(firstDayOfMonth));
    setPendingAnalysisEnd(toSafeDateString(today));
    setPendingComparisonStart('');
    setPendingComparisonEnd('');
    setValidationError('');
  };

  const hasChanges = () => {
    return pendingAnalysisStart !== formatDateForInput(analysisDateRange.start) ||
           pendingAnalysisEnd !== formatDateForInput(analysisDateRange.end) ||
           pendingComparisonStart !== formatDateForInput(comparisonDateRange.start || '') ||
           pendingComparisonEnd !== formatDateForInput(comparisonDateRange.end || '');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        className="fixed top-0 right-0 h-full w-[600px] z-50 bg-white shadow-strong border-l border-gray-200 flex flex-col"
        initial={{ x: 600 }}
        animate={{ x: 0 }}
        exit={{ x: 600 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Filtres Dates
              </h2>
              <p className="text-gray-600 text-sm">
                Définissez vos plages d'analyse et de comparaison
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Période d'analyse</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'comparison'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Période de comparaison</span>
            </div>
          </button>
        </div>

        {/* Error Display */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-700 text-sm">{validationError}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Current Analysis Period */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">Période d'analyse sélectionnée</h3>
                    <div className="text-blue-800 text-sm">
                      Du {pendingAnalysisStart ? formatDateForDisplay(pendingAnalysisStart) : 'Non défini'} au {pendingAnalysisEnd ? formatDateForDisplay(pendingAnalysisEnd) : 'Non défini'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Périodes prédéfinies</h3>
                <div className="grid gap-3">
                  {analysisPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => calculateDateRange(preset.id, 'analysis')}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="font-medium text-gray-900">{preset.label}</div>
                      <div className="text-gray-600 text-sm">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Dates */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Période personnalisée</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={pendingAnalysisStart}
                      onChange={(e) => handleCustomDateChange('analysis', 'start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={pendingAnalysisEnd}
                      onChange={(e) => handleCustomDateChange('analysis', 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Current Comparison Period */}
              {pendingComparisonStart && pendingComparisonEnd ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-900 mb-2">Période de comparaison sélectionnée</h3>
                      <div className="text-green-800 text-sm">
                        Du {formatDateForDisplay(pendingComparisonStart)} au {formatDateForDisplay(pendingComparisonEnd)}
                      </div>
                    </div>
                    <button
                      onClick={handleClearComparison}
                      className="text-green-700 hover:text-green-800 text-sm underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Aucune période de comparaison</h3>
                  <p className="text-gray-600 text-sm">
                    Sélectionnez une période pour comparer avec votre analyse
                  </p>
                </div>
              )}

              {/* Presets */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Comparaisons prédéfinies</h3>
                <div className="grid gap-3">
                  {comparisonPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => calculateDateRange(preset.id, 'comparison')}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="font-medium text-gray-900">{preset.label}</div>
                      <div className="text-gray-600 text-sm">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Comparison Dates */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Période personnalisée</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={pendingComparisonStart}
                      onChange={(e) => handleCustomDateChange('comparison', 'start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={pendingComparisonEnd}
                      onChange={(e) => handleCustomDateChange('comparison', 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOUVEAU : Action Buttons - MÊME STRUCTURE QUE LES AUTRES DRAWERS */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                applyFilters();
                onClose();
              }}
              disabled={!pendingAnalysisStart || !pendingAnalysisEnd}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${pendingAnalysisStart && pendingAnalysisEnd
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Appliquer ({countRef.current})
            </button>
            <button
              onClick={() => {
                clearDateFilters();
                onClose();
              }}
              className="
                px-4 py-2 text-sm font-medium rounded-lg border
                border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400
                focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              Effacer dates
            </button>
          </div>
        </div>

        {/* Tutorial - Compact */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <p className="text-xs text-gray-600">
            <strong>Filtres Dates :</strong> Définissez vos périodes d'analyse et de comparaison
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Les changements ne sont appliqués qu'après avoir cliqué sur "Appliquer"
          </p>
        </div>

      </motion.div>
    </>
  );
};