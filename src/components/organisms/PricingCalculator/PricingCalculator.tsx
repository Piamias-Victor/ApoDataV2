// src/components/organisms/PricingCalculator/PricingCalculator.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Calculator } from 'lucide-react';
import { PricingScenarioCard } from '@/components/molecules/PricingScenarioCard/PricingScenarioCard';
import { Button } from '@/components/atoms/Button/Button';
import { usePricingScenarioCalculations } from '@/hooks/pricing/usePricingScenarioCalculations';
import type { PricingScenario, PricingInputs } from '@/types/pricingCalculator';
import { DEFAULT_INPUTS } from '@/types/pricingCalculator';

const MAX_SCENARIOS = 3;

export const PricingCalculator: React.FC = () => {
  const [scenarios, setScenarios] = useState<PricingScenario[]>([]);

  const addScenario = useCallback(() => {
    if (scenarios.length >= MAX_SCENARIOS) return;

    const newScenario: PricingScenario = {
      id: `scenario-${Date.now()}`,
      name: `Scénario ${scenarios.length + 1}`,
      inputs: DEFAULT_INPUTS,
      results: {
        prixNetRemise: 0,
        prixNetAvecUG: 0,
        deductionRFA1: 0,
        prixNetAvecRFA1: 0,
        deductionRFA2: 0,
        prixNetAvecRFA2: 0,
        margeEuros: 0,
        coef: 0,
        margePourcent: 0
      }
    };

    setScenarios((prev) => [...prev, newScenario]);
  }, [scenarios.length]);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateScenarioInput = useCallback(
    (id: string, field: keyof PricingInputs, value: number) => {
      setScenarios((prev) =>
        prev.map((scenario) => {
          if (scenario.id !== id) return scenario;

          const updatedInputs = { ...scenario.inputs, [field]: value };
          return { ...scenario, inputs: updatedInputs };
        })
      );
    },
    []
  );

  const updateScenarioName = useCallback((id: string, name: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  }, []);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calculator className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Calculateur Prix & Marge
          </h2>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={addScenario}
          disabled={scenarios.length >= MAX_SCENARIOS}
          iconLeft={<Plus className="w-4 h-4" />}
        >
          Ajouter un scénario ({scenarios.length}/{MAX_SCENARIOS})
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">
        Simulez vos conditions tarifaires avec remises RFA et RSF. 
        Maximum {MAX_SCENARIOS} scénarios simultanés.
      </p>

      {/* Scénarios */}
      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Aucun scénario créé</p>
          <Button variant="primary" size="md" onClick={addScenario}>
            Créer mon premier scénario
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioWithCalculation
              key={scenario.id}
              scenario={scenario}
              onUpdate={updateScenarioInput}
              onDelete={deleteScenario}
              onNameChange={updateScenarioName}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const ScenarioWithCalculation: React.FC<{
  scenario: PricingScenario;
  onUpdate: (id: string, field: keyof PricingInputs, value: number) => void;
  onDelete: (id: string) => void;
  onNameChange: (id: string, name: string) => void;
}> = ({ scenario, onUpdate, onDelete, onNameChange }) => {
  const results = usePricingScenarioCalculations(scenario.inputs);

  const scenarioWithResults = {
    ...scenario,
    results
  };

  return (
    <PricingScenarioCard
      scenario={scenarioWithResults}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onNameChange={onNameChange}
    />
  );
};