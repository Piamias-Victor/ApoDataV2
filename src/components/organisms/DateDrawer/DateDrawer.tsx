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
  
  const isAutoCalculating = useRef(false);

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
    // analysisDateRange est maintenant toujours défini (pas nullable)
    setCustomAnalysisStart(formatDateForInput(analysisDateRange.start));
    setCustomAnalysisEnd(formatDateForInput(analysisDateRange.end));
    
    if (comparisonDateRange.start && comparisonDateRange.end) {
      setCustomComparisonStart(formatDateForInput(comparisonDateRange.start));
      setCustomComparisonEnd(formatDateForInput(comparisonDateRange.end));
    }
  }, [analysisDateRange, comparisonDateRange]);

  // Auto-select N-1 when analysis period changes
  useEffect(() => {
    if (analysisDateRange.start && analysisDateRange.end && 
        (!comparisonDateRange.start || !comparisonDateRange.end) &&
        !isAutoCalculating.current) {
      isAutoCalculating.current = true;
      calculateDateRange('n-1', 'comparison');
      setTimeout(() => {
        isAutoCalculating.current = false;
      }, 100);
    }
  }, [analysisDateRange.start, analysisDateRange.end]);

  // Update count - analysis toujours comptée car obligatoire
  useEffect(() => {
    const analysisCount = 1; // Toujours 1 car dates obligatoires
    const comparisonCount = comparisonDateRange.start && comparisonDateRange.end ? 1 : 0;
    onCountChange(analysisCount + comparisonCount);
  }, [comparisonDateRange, onCountChange]);

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
    today.setHours(23, 59, 59, 999); // Fin de journée pour comparaison
    
    if (endDate > today) {
      return 'La date de fin ne peut pas être dans le futur';
    }
    
    return '';
  };

  const calculateDateRange = (presetId: string, type: 'analysis' | 'comparison') => {
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
      
      // Vérification TypeScript
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
      // Comparison logic
      if (field === 'start') {
        setCustomComparisonStart(value);
        if (value && customComparisonEnd) {
          setComparisonDateRange(value, customComparisonEnd);
        }
      } else {
        setCustomComparisonEnd(value);
        if (customComparisonStart && value) {
          setComparisonDateRange(customComparisonStart, value);
        }
      }
    }
  };

  const handleApply = () => {
    // Validation finale avant fermeture
    if (activeTab === 'analysis') {
      const validationErr = validateDates(customAnalysisStart, customAnalysisEnd);
      if (validationErr) {
        setValidationError(validationErr);
        return;
      }
    }
    
    setValidationError('');
    onClose();
  };

  const handleClear = () => {
    if (activeTab === 'analysis') {
      // Reset aux dates par défaut au lieu de vider
      resetToDefaultDates();
      setValidationError('');
    } else {
      clearComparisonDateRange();
      setCustomComparisonStart('');
      setCustomComparisonEnd('');
    }
  };

  const tabs = [
    { id: 'analysis' as TabType, label: 'Période d\'analyse', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'comparison' as TabType, label: 'Période de comparaison', icon: <Calendar className="w-4 h-4" /> },
  ];

  const currentPresets = activeTab === 'analysis' ? analysisPresets : comparisonPresets;
  const currentRange = activeTab === 'analysis' ? analysisDateRange : comparisonDateRange;
  const currentCustomStart = activeTab === 'analysis' ? customAnalysisStart : customComparisonStart;
  const currentCustomEnd = activeTab === 'analysis' ? customAnalysisEnd : customComparisonEnd;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <motion.div
        className="fixed top-0 right-0 h-full w-[500px] z-50 bg-white shadow-strong border-l border-gray-200 flex flex-col"
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Sélection des périodes
            </h3>
            {activeTab === 'analysis' && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                Obligatoire
              </span>
            )}
          </div>
          <motion.button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Tab Switch */}
        <div className="p-6 border-b border-gray-100">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setValidationError(''); // Clear errors when switching tabs
                }}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Validation Error */}
            {validationError && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{validationError}</p>
              </div>
            )}
            
            {/* Current Selection Display */}
            {currentRange.start && currentRange.end && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Période sélectionnée
                  {activeTab === 'analysis' && (
                    <span className="ml-2 text-xs text-blue-600">(par défaut: mois en cours)</span>
                  )}
                </p>
                <p className="text-sm text-blue-700">
                  Du {formatDateForDisplay(currentRange.start)} au {formatDateForDisplay(currentRange.end)}
                </p>
              </div>
            )}

            {/* Presets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Sélections rapides
              </h4>
              <div className="space-y-2">
                {currentPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => calculateDateRange(preset.id, activeTab)}
                    disabled={activeTab === 'comparison' && (!analysisDateRange.start || !analysisDateRange.end)}
                    className={`
                      w-full p-3 text-left rounded-lg border transition-all duration-200
                      ${activeTab === 'comparison' && (!analysisDateRange.start || !analysisDateRange.end)
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {preset.label}
                      {preset.id === 'current-month' && activeTab === 'analysis' && (
                        <span className="ml-2 text-xs text-blue-600">(par défaut)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
              
              {activeTab === 'comparison' && (!analysisDateRange.start || !analysisDateRange.end) && (
                <p className="text-xs text-amber-600 mt-2">
                  Définissez d'abord une période d'analyse
                </p>
              )}
            </div>

            {/* Custom Date Selection */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Dates personnalisées
                {activeTab === 'analysis' && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date de début {activeTab === 'analysis' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={currentCustomStart}
                    onChange={(e) => handleCustomDateChange(activeTab, 'start', e.target.value)}
                    className={`
                      w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent
                      ${validationError && activeTab === 'analysis'
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                      }
                    `}
                    required={activeTab === 'analysis'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date de fin {activeTab === 'analysis' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={currentCustomEnd}
                    onChange={(e) => handleCustomDateChange(activeTab, 'end', e.target.value)}
                    className={`
                      w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent
                      ${validationError && activeTab === 'analysis'
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                      }
                    `}
                    required={activeTab === 'analysis'}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={handleApply}
                disabled={!!validationError}
                className={`
                  flex-1 px-4 py-2 text-sm font-medium rounded-lg
                  focus:ring-2 focus:ring-offset-2 transition-all duration-200
                  ${validationError
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  }
                `}
              >
                Appliquer
              </button>
              <button
                onClick={handleClear}
                className="
                  px-4 py-2 text-sm font-medium rounded-lg border
                  border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400
                  focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                  transition-all duration-200
                "
              >
                {activeTab === 'analysis' ? 'Réinitialiser' : 'Effacer'}
              </button>
            </div>
            
            {activeTab === 'analysis' && (
              <p className="text-xs text-gray-500 text-center">
                La période d'analyse est obligatoire et définie par défaut sur le mois en cours
              </p>
            )}
          </div>

        </div>
      </motion.div>
    </>
  );
};