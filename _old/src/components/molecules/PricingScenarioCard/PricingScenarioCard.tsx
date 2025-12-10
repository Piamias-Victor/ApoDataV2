// src/components/molecules/PricingScenarioCard/PricingScenarioCard.tsx
'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '@/components/atoms/Card/Card';
import type { PricingScenario } from '@/types/pricingCalculator';

interface PricingScenarioCardProps {
  readonly scenario: PricingScenario;
  readonly onUpdate: (id: string, field: keyof PricingScenario['inputs'], value: number) => void;
  readonly onDelete: (id: string) => void;
  readonly onNameChange: (id: string, name: string) => void;
}

export const PricingScenarioCard: React.FC<PricingScenarioCardProps> = ({
  scenario,
  onUpdate,
  onDelete,
  onNameChange
}) => {
  const { inputs, results } = scenario;

  const handleInputChange = (field: keyof typeof inputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdate(scenario.id, field, numValue);
  };

  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      {/* Header avec nom éditable */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <input
          type="text"
          value={scenario.name}
          onChange={(e) => onNameChange(scenario.id, e.target.value)}
          className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          placeholder="Nom du scénario"
        />
        <button
          onClick={() => onDelete(scenario.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Prix Tarif"
          value={inputs.prixTarif}
          onChange={(v) => handleInputChange('prixTarif', v)}
          suffix="€"
        />
        <InputField
          label="RSF"
          value={inputs.rsf}
          onChange={(v) => handleInputChange('rsf', v)}
          suffix="%"
        />
        <InputField
          label="RFA 1"
          value={inputs.rfa1}
          onChange={(v) => handleInputChange('rfa1', v)}
          suffix="%"
        />
        <InputField
          label="RFA 2"
          value={inputs.rfa2}
          onChange={(v) => handleInputChange('rfa2', v)}
          suffix="%"
        />
        <InputField
          label="TVA"
          value={inputs.tva}
          onChange={(v) => handleInputChange('tva', v)}
          suffix="%"
        />
        <InputField
          label="Qté commandée"
          value={inputs.quantiteCommandee}
          onChange={(v) => handleInputChange('quantiteCommandee', v)}
          suffix="u"
        />
        <InputField
          label="UG gratuits"
          value={inputs.ugGratuits}
          onChange={(v) => handleInputChange('ugGratuits', v)}
          suffix="u"
        />
        <InputField
          label="Prix Public TTC"
          value={inputs.prixPublic}
          onChange={(v) => handleInputChange('prixPublic', v)}
          suffix="€"
        />
      </div>

      {/* Résultats */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <ResultRow label="Prix net remise" value={results.prixNetRemise} />
        <ResultRow label="Prix net avec UG" value={results.prixNetAvecUG} />
        <ResultRow label="Prix net avec RFA 1" value={results.prixNetAvecRFA1} />
        <ResultRow label="Prix net avec RFA 2" value={results.prixNetAvecRFA2} />
        <div className="border-t border-gray-300 pt-2 mt-2">
          <ResultRow label="Marge" value={results.margeEuros} highlight />
          <ResultRow label="Coefficient" value={results.coef} isCoef />
          <ResultRow label="Marge %" value={results.margePourcent} isPercent highlight />
        </div>
      </div>

      {/* Prix suggéré pour atteindre la marge du scénario 1 */}
      {results.prixPublicSuggere && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 mb-1 font-medium">
            💡 Pour atteindre la même marge que le Scénario 1 :
          </p>
          <p className="text-sm font-bold text-blue-900">
            Prix Public TTC suggéré : {results.prixPublicSuggere.toFixed(2)} €
          </p>
        </div>
      )}
    </Card>
  );
};

const InputField: React.FC<{
  label: string;
  value: number;
  onChange: (value: string) => void;
  suffix: string;
  className?: string;
}> = ({ label, value, onChange, suffix, className = '' }) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <div className="relative">
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="absolute right-3 top-2.5 text-sm text-gray-500">{suffix}</span>
    </div>
  </div>
);

const ResultRow: React.FC<{
  label: string;
  value: number;
  highlight?: boolean;
  isPercent?: boolean;
  isCoef?: boolean;
}> = ({ label, value, highlight = false, isPercent = false, isCoef = false }) => (
  <div className="flex justify-between text-sm">
    <span className={highlight ? 'font-semibold text-gray-900' : 'text-gray-600'}>{label}</span>
    <span className={highlight ? 'font-bold text-blue-600' : 'font-medium text-gray-900'}>
      {isPercent ? `${value.toFixed(2)}%` : isCoef ? value.toFixed(2) : `${value.toFixed(2)} €`}
    </span>
  </div>
);