// src/hooks/pricing/usePricingScenarioCalculations.ts
'use client';

import { useMemo } from 'react';
import type { PricingInputs, PricingResults } from '@/types/pricingCalculator';

/**
 * Hook calcul prix/marge selon formules Excel
 * RSF → UG (dilution) → RFA1 → RFA2 → Marge HT
 */
export function usePricingScenarioCalculations(
  inputs: PricingInputs,
  targetMargin?: number // Marge cible en € (du scénario 1)
): PricingResults {
  return useMemo(() => {
    const { prixTarif, rsf, rfa1, rfa2, tva, quantiteCommandee, ugGratuits, prixPublic } = inputs;

    // 1. Prix net après remise RSF
    const prixNetRemise = prixTarif * (1 - rsf / 100);

    // 2. Prix net avec UG (dilution par quantité totale)
    const quantiteTotale = quantiteCommandee + ugGratuits;
    const prixNetAvecUG = quantiteTotale > 0
      ? (prixNetRemise * quantiteCommandee) / quantiteTotale
      : prixNetRemise;

    // 3. Déduction RFA 1 (sur prix après UG)
    const deductionRFA1 = prixNetAvecUG * (rfa1 / 100);
    const prixNetAvecRFA1 = prixNetAvecUG - deductionRFA1;

    // 4. Déduction RFA 2 (sur prix après RFA1)
    const deductionRFA2 = prixNetAvecRFA1 * (rfa2 / 100);
    const prixNetAvecRFA2 = prixNetAvecRFA1 - deductionRFA2;

    // 5. Conversion prix public TTC → HT
    const prixPublicHT = prixPublic / (1 + tva / 100);

    // 6. Marge en euros HT (prix public HT - prix net final HT)
    const margeEuros = prixPublicHT - prixNetAvecRFA2;

    // 7. Coefficient (prix public HT / prix net final HT)
    const coef = prixNetAvecRFA2 > 0 ? prixPublicHT / prixNetAvecRFA2 : 0;

    // 8. Marge en % (marge HT / prix public HT)
    const margePourcent = prixPublicHT > 0 ? (margeEuros / prixPublicHT) * 100 : 0;

    // 9. Prix public suggéré pour atteindre la marge cible
    let prixPublicSuggere: number | undefined;
    if (targetMargin !== undefined && prixNetAvecRFA2 > 0) {
      // Prix Public HT = Marge cible + Prix Net Final
      const prixPublicHTSuggere = targetMargin + prixNetAvecRFA2;
      // Conversion HT → TTC
      prixPublicSuggere = Number((prixPublicHTSuggere * (1 + tva / 100)).toFixed(2));
    }

    return {
      prixNetRemise: Number(prixNetRemise.toFixed(2)),
      prixNetAvecUG: Number(prixNetAvecUG.toFixed(2)),
      deductionRFA1: Number(deductionRFA1.toFixed(2)),
      prixNetAvecRFA1: Number(prixNetAvecRFA1.toFixed(2)),
      deductionRFA2: Number(deductionRFA2.toFixed(2)),
      prixNetAvecRFA2: Number(prixNetAvecRFA2.toFixed(2)),
      margeEuros: Number(margeEuros.toFixed(2)),
      coef: Number(coef.toFixed(2)),
      margePourcent: Number(margePourcent.toFixed(2)), // 2 décimales au lieu de 0
      ...(prixPublicSuggere !== undefined && { prixPublicSuggere })
    };
  }, [inputs, targetMargin]);
}