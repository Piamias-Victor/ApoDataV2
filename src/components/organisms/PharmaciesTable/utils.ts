// src/components/organisms/PharmaciesTable/utils.ts
import type { PharmacyMetrics, SortableColumn, SortDirection } from './types';

/**
 * Fonction de tri des pharmacies
 */
// src/components/organisms/PharmaciesTable/utils.ts

export function sortPharmacies(
  pharmacies: PharmacyMetrics[],
  column: SortableColumn,
  direction: SortDirection | null
): PharmacyMetrics[] {
  if (!direction) return pharmacies;

  return [...pharmacies].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (column) {
      case 'pharmacy_name':
        aValue = a.pharmacy_name || '';
        bValue = b.pharmacy_name || '';
        break;
      case 'ca_ttc':
        aValue = Number(a.ca_ttc) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.ca_ttc) || 0;
        break;
      case 'quantite_vendue':
        aValue = Number(a.quantite_vendue) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.quantite_vendue) || 0;
        break;
      case 'valeur_stock_ht':
        aValue = Number(a.valeur_stock_ht) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.valeur_stock_ht) || 0;
        break;
      case 'montant_marge':
        aValue = Number(a.montant_marge) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.montant_marge) || 0;
        break;
      case 'pourcentage_marge':
        aValue = Number(a.pourcentage_marge) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.pourcentage_marge) || 0;
        break;
      case 'part_marche_pct':
        aValue = Number(a.part_marche_pct) || 0;  // CORRECTION: Force conversion Number
        bValue = Number(b.part_marche_pct) || 0;
        break;
      case 'evolution_ca_pct':
        aValue = a.evolution_ca_pct !== undefined ? Number(a.evolution_ca_pct) : -Infinity;
        bValue = b.evolution_ca_pct !== undefined ? Number(b.evolution_ca_pct) : -Infinity;
        break;
      case 'evolution_relative_pct':
        aValue = a.evolution_relative_pct !== undefined ? Number(a.evolution_relative_pct) : -Infinity;
        bValue = b.evolution_relative_pct !== undefined ? Number(b.evolution_relative_pct) : -Infinity;
        break;
      default:
        return 0;
    }

    // Tri string
    if (typeof aValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    }

    // Tri numérique avec vérification
    if (isNaN(aValue)) aValue = 0;
    if (isNaN(bValue)) bValue = 0;
    
    const comparison = aValue - bValue;
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Fonction de filtrage des pharmacies
 */
export function filterPharmacies(
  pharmacies: PharmacyMetrics[],
  searchQuery: string
): PharmacyMetrics[] {
  if (!searchQuery.trim()) return pharmacies;

  const query = searchQuery.toLowerCase().trim();

  return pharmacies.filter(pharmacy => 
    pharmacy.pharmacy_name?.toLowerCase().includes(query) ||
    pharmacy.pharmacy_id?.toLowerCase().includes(query)
  );
}

/**
 * Fonction de pagination des pharmacies
 */
export function paginatePharmacies(
  pharmacies: PharmacyMetrics[],
  currentPage: number,
  itemsPerPage: number
) {
  const totalPages = Math.ceil(pharmacies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, pharmacies.length);
  
  const paginatedPharmacies = pharmacies.slice(startIndex, endIndex);

  return {
    paginatedPharmacies,
    totalPages,
    startIndex,
    endIndex: endIndex - 1
  };
}

/**
 * Formatage des valeurs monétaires
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0 €';
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formatage des nombres
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Formatage des pourcentages
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  
  // Conversion sécurisée en nombre
  const numValue = Number(value);
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(1)}%`;
}

/**
 * Formatage de l'évolution relative (avec unité pts)
 */
export function formatEvolutionRelative(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)} pts`;
}

/**
 * Variant pour badges d'évolution
 */
export function getEvolutionVariant(value: number): 'success' | 'warning' | 'danger' | 'gray' {
  if (value > 5) return 'success';
  if (value > 0) return 'warning';
  if (value > -5) return 'gray';
  return 'danger';
}

/**
 * Variant pour badges de marge
 */
export function getMarginVariant(value: number): 'success' | 'warning' | 'danger' | 'gray' {
  if (value >= 30) return 'success';
  if (value >= 20) return 'warning';
  if (value >= 10) return 'gray';
  return 'danger';
}

/**
 * Variant pour badges de part de marché
 */
export function getMarketShareVariant(value: number): 'success' | 'warning' | 'danger' | 'gray' {
  if (value >= 10) return 'success';
  if (value >= 5) return 'warning';
  if (value >= 1) return 'gray';
  return 'danger';
}