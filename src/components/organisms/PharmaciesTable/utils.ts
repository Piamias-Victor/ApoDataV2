// src/components/organisms/PharmaciesTable/utils.ts
import type { 
  PharmacyMetrics, 
  SortableColumn, 
  SortDirection 
} from './types';

// ========== TRI ==========
export function sortPharmacies(
  pharmacies: PharmacyMetrics[],
  column: SortableColumn,
  direction: SortDirection
): PharmacyMetrics[] {
  const sorted = [...pharmacies].sort((a, b) => {
    let aValue = a[column];
    let bValue = b[column];

    // Gestion des valeurs nulles
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Comparaison string (nom pharmacie)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Vérifier si ce sont des nombres déguisés en string
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Ce sont des nombres en string, comparer numériquement
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Vraies strings, comparer alphabétiquement
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Comparaison numérique
    const numA = Number(aValue);
    const numB = Number(bValue);
    
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    
    return direction === 'asc' ? numA - numB : numB - numA;
  });

  return sorted;
}

// ========== FILTRAGE ==========
export function filterPharmacies(
  pharmacies: PharmacyMetrics[],
  searchQuery: string
): PharmacyMetrics[] {
  if (!searchQuery.trim()) return pharmacies;

  const query = searchQuery.toLowerCase().trim();
  return pharmacies.filter(pharmacy => 
    pharmacy.pharmacy_name.toLowerCase().includes(query)
  );
}

// ========== PAGINATION ==========
export function paginatePharmacies(
  pharmacies: PharmacyMetrics[],
  page: number,
  pageSize: number
): {
  paginatedPharmacies: PharmacyMetrics[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.ceil(pharmacies.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, pharmacies.length);
  
  return {
    paginatedPharmacies: pharmacies.slice(startIndex, endIndex),
    totalPages,
    startIndex,
    endIndex
  };
}

// ========== FORMATAGE NOMBRES ==========
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  
  if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M €`;
  if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K €`;
  return `${numValue.toFixed(0)} €`;
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  
  if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
  if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
  return numValue.toFixed(0);
}

export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  return `${numValue.toFixed(1)}%`;
}

export function formatEvolutionPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)}%`;
}

export function formatEvolutionRelative(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)} pts`;
}

export function formatRang(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue) || numValue === 999999) return 'N/A';
  return `#${numValue}`;
}

export function formatGainRang(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'N/A';
  if (numValue === 0) return '=';
  const sign = numValue > 0 ? '+' : '';
  return `${sign}${numValue}`;
}

// ========== VARIANTES BADGES ==========
export type BadgeVariant = 'success' | 'warning' | 'danger';

export function getEvolutionVariant(value: number | string | null | undefined): BadgeVariant {
  if (value === null || value === undefined) return 'warning';
  const numValue = Number(value);
  if (isNaN(numValue)) return 'warning';
  if (numValue >= 5) return 'success';
  if (numValue >= 0) return 'success';
  if (numValue >= -5) return 'warning';
  return 'danger';
}

export function getMarginVariant(margin: number | string | null | undefined): BadgeVariant {
  if (margin === null || margin === undefined) return 'warning';
  const numValue = Number(margin);
  if (isNaN(numValue)) return 'warning';
  if (numValue >= 30) return 'success';
  if (numValue >= 20) return 'warning';
  return 'danger';
}

export function getRangVariant(gain: number | string | null | undefined): BadgeVariant {
  if (gain === null || gain === undefined) return 'warning';
  const numValue = Number(gain);
  if (isNaN(numValue)) return 'warning';
  if (numValue > 0) return 'success';
  if (numValue === 0) return 'warning';
  return 'danger';
}