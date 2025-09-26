// src/app/(dashboard)/pricing/page.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { PricingSimulationSection } from '@/components/organisms/PricingSimulationSection/PricingSimulationSection';
import { useFiltersStore } from '@/stores/useFiltersStore';

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
            Simulez vos nouvelles conditions tarifaires et analysez l'impact sur vos marges
          </p>
        </div>
      </div>

      {/* Section de simulation */}
      <PricingSimulationSection 
        productCodes={productsFilter}
        onRefresh={() => {
          // Optionnel : actions sur refresh
          console.log('Données actualisées');
        }}
      />
    </motion.div>
  );
}