import { useState, useCallback } from 'react';
import { NegotiationScenario, ScenarioField } from '@/types/negotiation';

const DEFAULT_SCENARIO: Omit<NegotiationScenario, 'id' | 'name'> = {
    prixTarif: '',
    rsfPercent: '',
    rfa1Percent: '',
    rfa2Percent: '',
    tvaPercent: 20, 
    qteCommandee: 1,
    ug: 0,
    prixPublicTTC: '',
    
    // Computed initial values
    prixNetRemise: 0,
    prixNetAvecUG: 0,
    prixNetAvecRFA1: 0,
    prixNetAvecRFA2: 0,
    margeVal: 0,
    coefficient: 0,
    margePercent: 0,
};

const parseVal = (v: number | string): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
        // Replace comma with dot for French users typing "10,5"
        const clean = v.replace(',', '.').replace(/[^0-9.-]/g, ''); 
        return parseFloat(clean) || 0;
    }
    return 0;
};

const calculateScenario = (scenario: NegotiationScenario): NegotiationScenario => {
    // Inputs (Parsed)
    const prixTarif = parseVal(scenario.prixTarif);
    const rsfPercent = parseVal(scenario.rsfPercent);
    const rfa1Percent = parseVal(scenario.rfa1Percent);
    const rfa2Percent = parseVal(scenario.rfa2Percent);
    const tvaPercent = parseVal(scenario.tvaPercent);
    const qteCommandee = parseVal(scenario.qteCommandee);
    const ug = parseVal(scenario.ug);
    const prixPublicTTC = parseVal(scenario.prixPublicTTC);

    // 1. Prix Net Remise
    const prixNetRemise = prixTarif * (1 - (rsfPercent / 100));

    // 2. Prix Net avec UG
    // Coût total pour (Qte + UG) produits = PrixNetRemise * Qte
    // Coût unitaire lissé = (PrixNetRemise * Qte) / (Qte + UG)
    const totalUnits = qteCommandee + ug;
    const prixNetAvecUG = totalUnits > 0 
        ? (prixNetRemise * qteCommandee) / totalUnits 
        : 0;

    // 3. Prix Net avec RFA 1
    // Attention: RFA souvent sur le net ? Oui, "en cascade" validé par défaut dans le plan.
    const prixNetAvecRFA1 = prixNetAvecUG * (1 - (rfa1Percent / 100));

    // 4. Prix Net avec RFA 2
    const prixNetAvecRFA2 = prixNetAvecRFA1 * (1 - (rfa2Percent / 100));

    // 5. Prix Vente HT
    const prixVenteHT = tvaPercent !== -100 
        ? prixPublicTTC / (1 + (tvaPercent / 100)) 
        : 0;

    // 6. Marge brute (Valeur)
    const margeVal = prixVenteHT - prixNetAvecRFA2;

    // 7. Coefficient Multiplicateur (PV TTC / PA OPTIMISÉ)
    const coefficient = prixNetAvecRFA2 > 0 
        ? prixPublicTTC / prixNetAvecRFA2 
        : 0;

    // 8. Taux de marque (%)
    const margePercent = prixVenteHT > 0 
        ? (margeVal / prixVenteHT) * 100 
        : 0;

    return {
        ...scenario,
        prixNetRemise,
        prixNetAvecUG,
        prixNetAvecRFA1,
        prixNetAvecRFA2,
        margeVal,
        coefficient,
        margePercent,
    };
};

export const useNegotiation = () => {
    const [scenarios, setScenarios] = useState<NegotiationScenario[]>([
        { id: '1', name: 'Proposition Actuelle', ...DEFAULT_SCENARIO },
        { id: '2', name: 'Proposition Labo', ...DEFAULT_SCENARIO },
        { id: '3', name: 'Proposition Cible', ...DEFAULT_SCENARIO },
    ]);

    const updateScenarioObj = useCallback((id: string, updates: Partial<NegotiationScenario>) => {
        setScenarios(prev => prev.map(s => {
            if (s.id !== id) return s;
            // Merge raw updates first (e.g. keeping string inputs like "10.")
            const merged = { ...s, ...updates };
            // Then calculate derived values based on parsed versions
            return calculateScenario(merged);
        }));
    }, []);

    const updateField = useCallback((id: string, field: ScenarioField, value: number | string) => {
        updateScenarioObj(id, { [field]: value });
    }, [updateScenarioObj]);

    // Outil: Quel Prix Public pour Scénario 3 pour égaler Marge VALEUR du Scénario 1 ?
    const calculateTargetPP_forMarginVal = useCallback((targetScenarioId: string, referenceScenarioId: string) => {
        const refScenario = scenarios.find(s => s.id === referenceScenarioId);
        const targetScenario = scenarios.find(s => s.id === targetScenarioId);

        if (!refScenario || !targetScenario) return 0;
        
        const targetNetBuyPrice = targetScenario.prixNetAvecRFA2;
        const targetTvaRate = 1 + (parseVal(targetScenario.tvaPercent) / 100);
        
        const requiredSellingPriceHT = refScenario.margeVal + targetNetBuyPrice;
        const requiredPP_TTC = requiredSellingPriceHT * targetTvaRate;

        return requiredPP_TTC;
    }, [scenarios]);

    // Outil: Quel Prix Public pour Scénario 3 pour égaler Marge % du Scénario 1 ?
    const calculateTargetPP_forMarginPercent = useCallback((targetScenarioId: string, referenceScenarioId: string) => {
        const refScenario = scenarios.find(s => s.id === referenceScenarioId);
        const targetScenario = scenarios.find(s => s.id === targetScenarioId);

        if (!refScenario || !targetScenario) return 0;
        
        const targetNetBuyPrice = targetScenario.prixNetAvecRFA2;
        const targetTvaRate = 1 + (parseVal(targetScenario.tvaPercent) / 100);
        const targetMarginRate = refScenario.margePercent / 100;

        if (targetMarginRate >= 1) return 0;

        const requiredSellingPriceHT = targetNetBuyPrice / (1 - targetMarginRate);
        const requiredPP_TTC = requiredSellingPriceHT * targetTvaRate;

        return requiredPP_TTC;
    }, [scenarios]);

    return {
        scenarios,
        updateField,
        updateScenarioObj,
        calculateTargetPP_forMarginVal,
        calculateTargetPP_forMarginPercent
    };
};
