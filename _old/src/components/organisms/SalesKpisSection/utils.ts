// src/components/organisms/SalesKpisSection/utils.ts
import type { SalesKpiData, TransformedSalesKpi, GroupedSalesKpis } from './types';

/**
 * Validation des données KPI ventes
 */
export function validateSalesKpiData(data: SalesKpiData | null): data is SalesKpiData {
  if (!data) return false;
  
  const requiredFields = [
    'quantite_vendue', 'ca_ttc', 'part_marche_ca_pct', 'part_marche_marge_pct',
    'nb_references_selection', 'nb_references_80pct_ca', 'montant_marge', 'taux_marge_pct'
  ] as const;
  
  return requiredFields.every(field => 
    typeof data[field] === 'number' && !isNaN(data[field])
  );
}

/**
 * Vérification si les données sont significatives
 */
export function hasSignificantSalesKpiData(data: SalesKpiData): boolean {
  return data.quantite_vendue > 0 || data.ca_ttc > 0 || data.nb_references_selection > 0;
}

/**
 * Transformation des données brutes en KPI formatés
 */
export function transformSalesKpiData(data: SalesKpiData): TransformedSalesKpi[] {
  const kpis: TransformedSalesKpi[] = [];

  // 1. Quantité Vendue
  kpis.push({
    title: 'Quantité Vendue',
    value: data.quantite_vendue,
    unit: 'number',
    comparison: data.comparison ? {
      value: data.comparison.quantite_vendue,
      percentage: data.comparison.quantite_vendue > 0 
        ? ((data.quantite_vendue - data.comparison.quantite_vendue) / data.comparison.quantite_vendue) * 100
        : 0,
      trend: data.quantite_vendue > data.comparison.quantite_vendue ? 'up' :
             data.quantite_vendue < data.comparison.quantite_vendue ? 'down' : 'neutral'
    } : undefined,
    variant: 'primary',
    subtitle: 'unités'
  });

  // 2. CA TTC
  kpis.push({
    title: 'Chiffre d\'Affaires TTC',
    value: data.ca_ttc,
    unit: 'currency',
    comparison: data.comparison ? {
      value: data.comparison.ca_ttc,
      percentage: data.comparison.ca_ttc > 0 
        ? ((data.ca_ttc - data.comparison.ca_ttc) / data.comparison.ca_ttc) * 100
        : 0,
      trend: data.ca_ttc > data.comparison.ca_ttc ? 'up' :
             data.ca_ttc < data.comparison.ca_ttc ? 'down' : 'neutral'
    } : undefined,
    variant: 'primary',
    subtitle: 'euros'
  });

  // 3. Part Marché CA
  kpis.push({
    title: 'Part de Marché CA',
    value: data.part_marche_ca_pct,
    unit: 'percentage',
    comparison: data.comparison ? {
      value: data.comparison.part_marche_ca_pct,
      percentage: data.comparison.part_marche_ca_pct > 0 
        ? ((data.part_marche_ca_pct - data.comparison.part_marche_ca_pct) / data.comparison.part_marche_ca_pct) * 100
        : 0,
      trend: data.part_marche_ca_pct > data.comparison.part_marche_ca_pct ? 'up' :
             data.part_marche_ca_pct < data.comparison.part_marche_ca_pct ? 'down' : 'neutral'
    } : undefined,
    variant: data.part_marche_ca_pct > 10 ? 'success' : data.part_marche_ca_pct > 5 ? 'primary' : 'warning',
    subtitle: 'du marché'
  });

  // 4. Part Marché Marge
  kpis.push({
    title: 'Part de Marché Marge',
    value: data.part_marche_marge_pct,
    unit: 'percentage',
    comparison: data.comparison ? {
      value: data.comparison.part_marche_marge_pct,
      percentage: data.comparison.part_marche_marge_pct > 0 
        ? ((data.part_marche_marge_pct - data.comparison.part_marche_marge_pct) / data.comparison.part_marche_marge_pct) * 100
        : 0,
      trend: data.part_marche_marge_pct > data.comparison.part_marche_marge_pct ? 'up' :
             data.part_marche_marge_pct < data.comparison.part_marche_marge_pct ? 'down' : 'neutral'
    } : undefined,
    variant: data.part_marche_marge_pct > 10 ? 'success' : data.part_marche_marge_pct > 5 ? 'primary' : 'warning',
    subtitle: 'de la marge'
  });

  // 5. Nb Références
  kpis.push({
    title: 'Références Analysées',
    value: data.nb_references_selection,
    unit: 'number',
    comparison: data.comparison ? {
      value: data.comparison.nb_references_selection,
      percentage: data.comparison.nb_references_selection > 0 
        ? ((data.nb_references_selection - data.comparison.nb_references_selection) / data.comparison.nb_references_selection) * 100
        : 0,
      trend: data.nb_references_selection > data.comparison.nb_references_selection ? 'up' :
             data.nb_references_selection < data.comparison.nb_references_selection ? 'down' : 'neutral'
    } : undefined,
    variant: 'secondary',
    subtitle: 'produits'
  });

  // 6. Références 80% CA (nouveau)
  kpis.push({
    title: 'Références 80% CA',
    value: data.nb_references_80pct_ca,
    unit: 'number',
    comparison: data.comparison ? {
      value: data.comparison.nb_references_80pct_ca,
      percentage: data.comparison.nb_references_80pct_ca > 0 
        ? ((data.nb_references_80pct_ca - data.comparison.nb_references_80pct_ca) / data.comparison.nb_references_80pct_ca) * 100
        : 0,
      trend: data.nb_references_80pct_ca > data.comparison.nb_references_80pct_ca ? 'up' :
             data.nb_references_80pct_ca < data.comparison.nb_references_80pct_ca ? 'down' : 'neutral'
    } : undefined,
    variant: 'secondary',
    subtitle: 'Pareto 80/20'
  });

  // 7. Montant Marge
  kpis.push({
    title: 'Montant Marge',
    value: data.montant_marge,
    unit: 'currency',
    comparison: data.comparison ? {
      value: data.comparison.montant_marge,
      percentage: data.comparison.montant_marge > 0 
        ? ((data.montant_marge - data.comparison.montant_marge) / data.comparison.montant_marge) * 100
        : 0,
      trend: data.montant_marge > data.comparison.montant_marge ? 'up' :
             data.montant_marge < data.comparison.montant_marge ? 'down' : 'neutral'
    } : undefined,
    variant: 'success',
    subtitle: 'euros'
  });

  // 8. Taux Marge
  kpis.push({
    title: 'Taux de Marge',
    value: data.taux_marge_pct,
    unit: 'percentage',
    comparison: data.comparison ? {
      value: data.comparison.taux_marge_pct,
      percentage: data.comparison.taux_marge_pct > 0 
        ? ((data.taux_marge_pct - data.comparison.taux_marge_pct) / data.comparison.taux_marge_pct) * 100
        : 0,
      trend: data.taux_marge_pct > data.comparison.taux_marge_pct ? 'up' :
             data.taux_marge_pct < data.comparison.taux_marge_pct ? 'down' : 'neutral'
    } : undefined,
    variant: data.taux_marge_pct > 25 ? 'success' : data.taux_marge_pct > 15 ? 'primary' : 'warning',
    subtitle: 'rentabilité'
  });

  return kpis;
}

/**
 * Regroupement des KPI pour les DualKpiCard
 */
export function groupSalesKpisForDualCards(kpis: TransformedSalesKpi[]): GroupedSalesKpis {
  if (kpis.length < 8) {
    throw new Error('Insufficient KPI data for grouping');
  }

  // Validation explicite des éléments requis
  const requiredKpis = kpis.slice(0, 8);
  if (requiredKpis.some(kpi => !kpi)) {
    throw new Error('Missing required KPI data');
  }

  return {
    // Card 1: Quantité Vendue + CA TTC
    quantityCa: {
      main: requiredKpis[0]!,      // Quantité Vendue
      secondary: requiredKpis[1]!  // CA TTC
    },
    
    // Card 2: Part Marché CA + Part Marché Marge
    marketShare: {
      main: requiredKpis[2]!,      // Part Marché CA
      secondary: requiredKpis[3]!  // Part Marché Marge
    },
    
    // Card 3: Nb Références + % Références Vendues
    references: {
      main: requiredKpis[4]!,      // Nb Références
      secondary: requiredKpis[5]!  // % Références Vendues
    },
    
    // Card 4: Montant Marge + Taux Marge
    margin: {
      main: requiredKpis[6]!,      // Montant Marge
      secondary: requiredKpis[7]!  // Taux Marge
    }
  };
}

/**
 * Messages d'erreur contextuels
 */
export function getSalesKpiErrorMessage(error: string): string {
  if (error.includes('Date range is required')) {
    return 'Veuillez sélectionner une période d\'analyse dans les filtres.';
  }
  
  if (error.includes('Invalid date format')) {
    return 'Le format des dates sélectionnées est invalide.';
  }
  
  if (error.includes('timeout') || error.includes('TIMEOUT')) {
    return 'Le calcul des KPI a pris trop de temps. Réduisez la période ou les filtres.';
  }
  
  if (error.includes('Network')) {
    return 'Erreur réseau. Vérifiez votre connexion internet.';
  }
  
  return 'Erreur lors du calcul des indicateurs de vente. Veuillez réessayer.';
}