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
 * DateDrawer Component - CORRIGÉ pour éviter les boucles infinies
 * 
 * Corrections :
 * - Ref pour éviter les appels onCountChange redondants
 * - Protection contre les auto-calculations en boucle
 * - Debounce sur les mises à jour de count
 */
export const DateDrawer: React.FC<DateDrawerProps> = ({
  isOpen,
  onClose,
  onCountChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analysis');
  const [customAnalysisStart, setCustomAnalysisStart] = useState('');
  const [customAnalysisEnd, setCustomAnalysisEnd] = useState('');
  const [customComparisonStart, setCustomComparisonStart] = useState('');
  const [customComparisonEnd, setCustomComparisonEnd] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  
  // Refs pour éviter les boucles infinies
  const isAutoCalculating = useRef(false);
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

  // Initialize custom inputs with store values
  useEffect(() => {
    console.log('📅 [DateDrawer] Initializing custom inputs from store');
    
    setCustomAnalysisStart(formatDateForInput(analysisDateRange.start));
    setCustomAnalysisEnd(formatDateForInput(analysisDateRange.end));
    
    if (comparisonDateRange.start && comparisonDateRange.end) {
      setCustomComparisonStart(formatDateForInput(comparisonDateRange.start));
      setCustomComparisonEnd(formatDateForInput(comparisonDateRange.end));
    } else {
      setCustomComparisonStart('');
      setCustomComparisonEnd('');
    }
  }, [analysisDateRange.start, analysisDateRange.end, comparisonDateRange.start, comparisonDateRange.end]);

  // Auto-select N-1 when analysis period changes - avec protection
  useEffect(() => {
    if (analysisDateRange.start && analysisDateRange.end && 
        (!comparisonDateRange.start || !comparisonDateRange.end) &&
        !isAutoCalculating.current) {
      
      console.log('🔄 [DateDrawer] Auto-calculating N-1 comparison');
      isAutoCalculating.current = true;
      
      // Timeout pour éviter les cascades
      setTimeout(() => {
        calculateDateRange('n-1', 'comparison');
        setTimeout(() => {
          isAutoCalculating.current = false;
        }, 200);
      }, 100);
    }
  }, [analysisDateRange.start, analysisDateRange.end, comparisonDateRange.start, comparisonDateRange.end]);

  // Update count avec debounce et ref pour éviter les appels redondants
  useEffect(() => {
    const analysisCount = 1; // Toujours 1 car dates obligatoires
    const comparisonCount = comparisonDateRange.start && comparisonDateRange.end ? 1 : 0;
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
  }, [comparisonDateRange.start, comparisonDateRange.end, onCountChange]);

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
    
    const today = new Date();
    let start: Date;
    let end: Date;

    if (type === 'analysis') {
      switch (presetId) {
        case 'current-month':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today);
          break;
        case 'last-month':
          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'current-year':
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today);
          break;
        case 'last-year':
          start = new Date(today.getFullYear() - 1, 0, 1);
          end = new Date(today.getFullYear() - 1, 11, 31);
          break;
        case 'last-12-months':
          start = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
          end = new Date(today);
          break;
        default:
          return;
      }
      
      const startStr = toSafeDateString(start);
      const endStr = toSafeDateString(end);
      
      if (!startStr || !endStr) {
        setValidationError('Erreur lors du calcul des dates');
        return;
      }
      
      const validationErr = validateDates(startStr, endStr);
      if (validationErr) {
        setValidationError(validationErr);
        return;
      }
      
      setValidationError('');
      setAnalysisDateRange(startStr, endStr);
      
    } else {
      // Comparison logic
      if (!analysisDateRange.start || !analysisDateRange.end) return;

      const analysisStart = new Date(analysisDateRange.start);
      const analysisEnd = new Date(analysisDateRange.end);
      const duration = analysisEnd.getTime() - analysisStart.getTime();

      switch (presetId) {
        case 'n-1':
          start = new Date(analysisStart.getFullYear() - 1, analysisStart.getMonth(), analysisStart.getDate());
          end = new Date(analysisEnd.getFullYear() - 1, analysisEnd.getMonth(), analysisEnd.getDate());
          break;
        case 'previous-period':
          end = new Date(analysisStart.getTime() - 24 * 60 * 60 * 1000);
          start = new Date(end.getTime() - duration);
          break;
        default:
          return;
      }
      
      const startStr = toSafeDateString(start);
      const endStr = toSafeDateString(end);
      
      if (startStr && endStr) {
        setComparisonDateRange(startStr, endStr);
      }
    }
  };

  const handleCustomDateChange = (type: 'analysis' | 'comparison', field: 'start' | 'end', value: string) => {
    console.log(`📝 [DateDrawer] Custom date change: ${type}.${field} = ${value}`);
    
    if (type === 'analysis') {
      if (field === 'start') {
        setCustomAnalysisStart(value);
        if (value && customAnalysisEnd) {
          const validationErr = validateDates(value, customAnalysisEnd);
          if (validationErr) {
            setValidationError(validationErr);
          } else {
            setValidationError('');
            setAnalysisDateRange(value, customAnalysisEnd);
          }
        }
      } else {
        setCustomAnalysisEnd(value);
        if (customAnalysisStart && value) {
          const validationErr = validateDates(customAnalysisStart, value);
          if (validationErr) {
            setValidationError(validationErr);
          } else {
            setValidationError('');
            setAnalysisDateRange(customAnalysisStart, value);
          }
        }
      }
    } else {
      if (field === 'start') {
        setCustomComparisonStart(value);
        if (value && customComparisonEnd) {
          const validationErr = validateDates(value, customComparisonEnd);
          if (validationErr) {
            setValidationError(validationErr);
          } else {
            setValidationError('');
            setComparisonDateRange(value, customComparisonEnd);
          }
        }
      } else {
        setCustomComparisonEnd(value);
        if (customComparisonStart && value) {
          const validationErr = validateDates(customComparisonStart, value);
          if (validationErr) {
            setValidationError(validationErr);
          } else {
            setValidationError('');
            setComparisonDateRange(customComparisonStart, value);
          }
        }
      }
    }
  };

  const handleClearComparison = () => {
    console.log('🗑️ [DateDrawer] Clearing comparison');
    setCustomComparisonStart('');
    setCustomComparisonEnd('');
    clearComparisonDateRange();
    setValidationError('');
  };

  const handleResetDates = () => {
    console.log('🔄 [DateDrawer] Resetting to default dates');
    resetToDefaultDates();
    setValidationError('');
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
                Sélection des périodes
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Validation Error */}
          {validationError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-800 font-medium">Erreur de validation</h4>
                  <p className="text-red-700 text-sm mt-1">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Current Analysis Period */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Période actuelle</h3>
                <div className="text-blue-800 text-sm">
                  Du {formatDateForDisplay(analysisDateRange.start)} au {formatDateForDisplay(analysisDateRange.end)}
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
                      value={customAnalysisStart}
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
                      value={customAnalysisEnd}
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
              {comparisonDateRange.start && comparisonDateRange.end ? (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-900 mb-2">Période de comparaison active</h3>
                      <div className="text-green-800 text-sm">
                        Du {formatDateForDisplay(comparisonDateRange.start)} au {formatDateForDisplay(comparisonDateRange.end)}
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
                      value={customComparisonStart}
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
                      value={customComparisonEnd}
                      onChange={(e) => handleCustomDateChange('comparison', 'end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleResetDates}
              className="text-gray-600 hover:text-gray-800 text-sm underline"
            >
              Réinitialiser aux valeurs par défaut
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};