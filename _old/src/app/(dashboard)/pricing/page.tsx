// src/app/(dashboard)/pricing/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { PricingSimulationSection } from '@/components/organisms/PricingSimulationSection/PricingSimulationSection';
import { useFiltersStore } from '@/stores/useFiltersStore';
import { PricingCalculator } from '@/components/organisms/PricingCalculator/PricingCalculator';

export default function PricingPage() {
  const productsFilter = useFiltersStore((state) => state.products);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Calcul de Prix & Simulation
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            Simulez vos conditions tarifaires et analysez l'impact sur vos marges
          </p>
        </div>
      </div>

      {/* Calculateur vierge */}
      <PricingCalculator />

      {/* Séparateur visuel */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">
            Simulation sur produits sélectionnés
          </span>
        </div>
      </div>

      {/* Section de simulation existante */}
      <PricingSimulationSection 
        productCodes={productsFilter}
        onRefresh={() => {
          console.log('Données actualisées');
        }}
      />
    </motion.div>
  );
}