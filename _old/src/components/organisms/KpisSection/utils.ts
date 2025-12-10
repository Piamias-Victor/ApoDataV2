// src/components/organisms/KpisSection/utils.ts

import type { KpiData, TransformedKpi } from './types';
import { calculateEvolutionPercentage, getTrendDirection } from '../../molecules/KpiCard/utils';

/**
 * Logique business pour transformation données API vers KPI cards
 */

/**
 * Transforme les données API brutes en 10 KPIs pour 6 cards
 */
export const transformKpiData = (data: KpiData): TransformedKpi[] => {
  const kpis: TransformedKpi[] = [
    // 1. CA TTC (KPI principal pour card CA/Quantités vendues)
    {
      title: 'CA TTC',
      value: data.ca_ttc,
      unit: 'currency',
      comparison: data.comparison ? {
        value: data.comparison.ca_ttc,
        percentage: calculateEvolutionPercentage(data.ca_ttc, data.comparison.ca_ttc),
        trend: getTrendDirection(calculateEvolutionPercentage(data.ca_ttc, data.comparison.ca_ttc))
      } : undefined,
      variant: 'primary',
      subtitle: 'Chiffre d\'affaires TTC'
    },
    
    // 2. Quantité Vendues (KPI secondaire pour card CA/Quantités vendues)
    {
      title: 'Quantité Vendues',
      value: data.quantite_vendue,
      unit: 'number',
      comparison: data.comparison ? {
        value: data.comparison.quantite_vendue,
        percentage: calculateEvolutionPercentage(data.quantite_vendue, data.comparison.quantite_vendue),
        trend: getTrendDirection(calculateEvolutionPercentage(data.quantite_vendue, data.comparison.quantite_vendue))
      } : undefined,
      variant: 'primary',
      subtitle: 'Unités vendues'
    },
    
    // 3. Montant Achat HT (KPI principal pour card Achat/Quantités achetées) - AVEC ÉVOLUTION
    {
      title: 'Montant Achat HT',
      value: data.montant_achat_ht,
      unit: 'currency',
      comparison: data.comparison ? {
        value: data.comparison.montant_achat_ht,
        percentage: calculateEvolutionPercentage(data.montant_achat_ht, data.comparison.montant_achat_ht),
        trend: getTrendDirection(calculateEvolutionPercentage(data.montant_achat_ht, data.comparison.montant_achat_ht))
      } : undefined,
      variant: 'primary',
      subtitle: 'Coût d\'acquisition'
    },
    
    // 4. Quantité Achetées (KPI secondaire pour card Achat/Quantités achetées) - AVEC ÉVOLUTION
    {
      title: 'Quantité Achetées',
      value: data.quantite_achetee,
      unit: 'number',
      comparison: data.comparison ? {
        value: data.comparison.quantite_achetee,
        percentage: calculateEvolutionPercentage(data.quantite_achetee, data.comparison.quantite_achetee),
        trend: getTrendDirection(calculateEvolutionPercentage(data.quantite_achetee, data.comparison.quantite_achetee))
      } : undefined,
      variant: 'primary',
      subtitle: 'Unités achetées'
    },
    
    // 5. Montant Marge (KPI principal pour card Marge/% Marge)
    {
      title: 'Montant Marge',
      value: data.montant_marge,
      unit: 'currency',
      comparison: data.comparison ? {
        value: data.comparison.montant_marge,
        percentage: calculateEvolutionPercentage(data.montant_marge, data.comparison.montant_marge),
        trend: getTrendDirection(calculateEvolutionPercentage(data.montant_marge, data.comparison.montant_marge))
      } : undefined,
      variant: 'primary',
      subtitle: 'Marge brute'
    },
    
    // 6. Pourcentage Marge (KPI secondaire pour card Marge/% Marge)
    {
      title: '% Marge',
      value: data.pourcentage_marge,
      unit: 'percentage',
      comparison: undefined,
      variant: 'primary',
      subtitle: 'Taux de marge'
    },
    
    // 7. Valeur Stock HT (KPI principal pour card Stock/Quantité stock)
    {
      title: 'Valeur Stock HT',
      value: data.valeur_stock_ht,
      unit: 'currency',
      comparison: undefined,
      variant: 'primary',
      subtitle: 'Stock valorisé'
    },
    
    // 8. Quantité Stock (KPI secondaire pour card Stock/Quantité stock)
    {
      title: 'Quantité Stock',
      value: data.quantite_stock,
      unit: 'number',
      comparison: undefined,
      variant: 'primary',
      subtitle: 'Unités en stock'
    },
    
    // 9. Jours de Stock (KPI simple)
    {
      title: 'Jours de Stock',
      value: data.jours_de_stock || 0,
      unit: 'days',
      comparison: undefined,
      variant: 'primary',
      subtitle: 'Rotation stock'
    },
    
    // 10. Références Produits (KPI simple)
    {
      title: 'Références',
      value: data.nb_references_produits,
      unit: 'number',
      comparison: undefined,
      variant: 'primary',
      subtitle: 'Produits analysés'
    }
  ];

  return kpis;
};

/**
 * Interface pour retour de groupKpisForDualCards
 */
interface GroupedKpis {
  caSales: {
    main: TransformedKpi;
    secondary: TransformedKpi;
  };
  purchaseQuantity: {
    main: TransformedKpi;
    secondary: TransformedKpi;
  };
  margin: {
    main: TransformedKpi;
    secondary: TransformedKpi;
  };
  stock: {
    main: TransformedKpi;
    secondary: TransformedKpi;
  };
  stockDays: TransformedKpi;
  references: TransformedKpi;
}

/**
 * Groupe les KPIs pour créer les cards doubles avec validation
 */
export const groupKpisForDualCards = (kpis: TransformedKpi[]): GroupedKpis => {
  if (kpis.length < 10) {
    throw new Error(`Insufficient KPI data: expected 10, got ${kpis.length}`);
  }
  
  return {
    // Card 1: CA TTC / Quantités vendues
    caSales: {
      main: kpis[0]!, // CA TTC - assertion non-null car length validée
      secondary: kpis[1]! // Quantité vendues
    },
    
    // Card 2: Achat HT / Quantités achetées - AVEC ÉVOLUTIONS
    purchaseQuantity: {
      main: kpis[2]!, // Montant Achat HT (avec évolution)
      secondary: kpis[3]! // Quantité achetées (avec évolution)
    },
    
    // Card 3: Marge / % Marge
    margin: {
      main: kpis[4]!, // Montant Marge
      secondary: kpis[5]! // % Marge
    },
    
    // Card 4: Stock / Quantité stock
    stock: {
      main: kpis[6]!, // Valeur Stock HT
      secondary: kpis[7]! // Quantité Stock
    },
    
    // Card 5: Jours de stock (simple)
    stockDays: kpis[8]!,
    
    // Card 6: Références (simple)
    references: kpis[9]!
  };
};

/**
 * Valide si les données KPI sont cohérentes
 */
export const validateKpiData = (data: KpiData): boolean => {
  if (typeof data.ca_ttc !== 'number' || data.ca_ttc < 0) return false;
  if (typeof data.montant_marge !== 'number') return false;
  if (typeof data.valeur_stock_ht !== 'number' || data.valeur_stock_ht < 0) return false;
  if (typeof data.quantite_vendue !== 'number' || data.quantite_vendue < 0) return false;
  if (typeof data.quantite_achetee !== 'number' || data.quantite_achetee < 0) return false;
  if (typeof data.montant_achat_ht !== 'number' || data.montant_achat_ht < 0) return false;
  if (typeof data.quantite_stock !== 'number' || data.quantite_stock < 0) return false;
  if (typeof data.pourcentage_marge !== 'number') return false;
  if (typeof data.nb_references_produits !== 'number' || data.nb_references_produits < 0) return false;
  
  // Validation optionnelle jours_de_stock
  if (data.jours_de_stock !== null && (typeof data.jours_de_stock !== 'number' || data.jours_de_stock < 0)) {
    return false;
  }
  
  // Validation comparison étendue si présente
  if (data.comparison) {
    if (typeof data.comparison.ca_ttc !== 'number' || data.comparison.ca_ttc < 0) return false;
    if (typeof data.comparison.montant_marge !== 'number') return false;
    if (typeof data.comparison.quantite_vendue !== 'number' || data.comparison.quantite_vendue < 0) return false;
    // Validation nouvelles propriétés comparison
    if (typeof data.comparison.montant_achat_ht !== 'number' || data.comparison.montant_achat_ht < 0) return false;
    if (typeof data.comparison.quantite_achetee !== 'number' || data.comparison.quantite_achetee < 0) return false;
  }
  
  return true;
};

/**
 * Génère un message d'erreur contextuel
 */
export const getKpiErrorMessage = (error: string): string => {
  if (error.includes('date')) {
    return 'Erreur de période : vérifiez les dates sélectionnées';
  }
  
  if (error.includes('network') || error.includes('fetch')) {
    return 'Erreur réseau : vérifiez votre connexion';
  }
  
  if (error.includes('timeout')) {
    return 'Délai d\'attente dépassé : les données sont en cours de chargement';
  }
  
  return 'Erreur lors du calcul des KPI : contactez le support';
};

/**
 * Détermine si les KPI ont des valeurs significatives
 */
export const hasSignificantKpiData = (data: KpiData): boolean => {
  return data.ca_ttc > 0 || 
         Math.abs(data.montant_marge) > 0 || 
         data.valeur_stock_ht > 0 ||
         data.quantite_vendue > 0 ||
         data.montant_achat_ht > 0 ||
         data.quantite_achetee > 0;
};