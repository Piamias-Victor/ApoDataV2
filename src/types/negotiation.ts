export interface NegotiationScenario {
    id: string; 
    name: string; // "Propal actuelle", "Propal Labo", "Propal cible"
    isLocked?: boolean; 
    
    // Inputs (Saisies Utilisateur - string allowed for stable typing)
    prixTarif: number | string;      
    rsfPercent: number | string;     
    rfa1Percent: number | string;    
    rfa2Percent: number | string;    
    tvaPercent: number | string;     
    qteCommandee: number | string;   
    ug: number | string;             
    prixPublicTTC: number | string;
    tradeSellOutAmount: number | string; // NEW: Trade Sell-Out (€)
    tradeSellOutPercent: number | string; // NEW: Trade Sell-Out (%)  

    
    // Outputs
    prixNetRemise: number;      // Calculé: Prix Tarif * (1 - RSF)
    prixNetAvecUG: number;      // Calculé: (PrixNetRemise * Qte) / (Qte + UG)
    prixNetAvecRFA1: number;    // Calculé: PrixNetAvecUG * (1 - RFA1)
    prixNetAvecRFA2: number;    // Calculé (Final): PrixNetAvecRFA1 * (1 - RFA2)
    
    prixNetTrade: number;       // NEW: PrixNetAvecRFA2 - TradeValue
    margeTradeVal: number;      // NEW: PrixVenteHT - PrixNetTrade
    margeTradePercent: number;  // NEW: (MargeTradeVal / PrixVenteHT) * 100
    prixPublicTTCEffectif: number; // NEW: Prix Public TTC après application du Trade
    
    margeVal: number;           // Calculé: PrixVenteHT - PrixAchatNetFinal
    coefficient: number;        // Calculé: PrixPublicTTC / PrixAchatNetFinal
    margePercent: number;       // Calculé: (MargeVal / PrixVenteHT) * 100
}

export type ScenarioField = keyof Pick<NegotiationScenario, 'prixTarif' | 'rsfPercent' | 'rfa1Percent' | 'rfa2Percent' | 'tvaPercent' | 'qteCommandee' | 'ug' | 'prixPublicTTC' | 'tradeSellOutAmount' | 'tradeSellOutPercent'>;
