// src/components/organisms/ProductsMonthlyTable/utils.ts

interface MonthlyDetailsRow {
  readonly nom: string;
  readonly code_ean: string;
  readonly mois: string;
  readonly mois_libelle: string;
  readonly type_ligne: 'MENSUEL' | 'SYNTHESE' | 'STOCK_MOYEN';
  readonly quantite_vendue: number;
  readonly quantite_stock: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
}

export interface ProductSummary {
  readonly nom: string;
  readonly code_ean: string;
  readonly quantite_vendue_total: number;
  readonly prix_achat_moyen: number;
  readonly prix_vente_moyen: number;
  readonly taux_marge_moyen: number;
  readonly quantite_stock_moyenne: number;
  readonly quantite_stock_actuel: number;
}

// Extension avec gestion stock idéal
export interface EnhancedProductSummary extends ProductSummary {
  readonly stockIdeal: number;
  readonly quantiteACommander: number;
  readonly ecartVsStockMoyen: number;
  readonly ventesQuotidiennesMoyennes: number;
}

export interface ChartDataPoint {
  readonly periode: string;
  readonly quantite: number;
  readonly stock: number;
  readonly prixVente: number;
  readonly prixAchat: number;
  readonly tauxMarge: number;
}

/**
 * Formate un nombre avec suffixes K/M pour affichage compact
 */
export const formatLargeNumber = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  if (value === 0) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(1)}K`;
  } else if (absValue >= 100) {
    return `${sign}${Math.round(absValue)}`;
  } else {
    return `${sign}${absValue.toFixed(1)}`;
  }
};

/**
 * Formate un prix en euros avec 2 décimales
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 €';
  }
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formate un pourcentage avec 1 décimale
 */
export const formatPercentage = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
};

/**
 * Détermine la classe CSS pour coloration marge selon seuils pharma
 */
export const getMarginColorClass = (marginPercent: number): string => {
  if (marginPercent >= 25) return 'text-green-700 bg-green-50';    
  if (marginPercent >= 15) return 'text-green-600 bg-green-25';    
  if (marginPercent >= 8) return 'text-yellow-600 bg-yellow-50';   
  if (marginPercent >= 3) return 'text-orange-600 bg-orange-50';   
  return 'text-red-600 bg-red-50';                                 
};

/**
 * Détermine la classe CSS pour coloration stock selon rotation
 */
export const getStockColorClass = (stockQuantity: number, averageStock: number): string => {
  if (stockQuantity === 0) return 'text-red-700 bg-red-100';       
  
  const ratio = stockQuantity / Math.max(averageStock, 1);
  
  if (ratio >= 2) return 'text-orange-600 bg-orange-50';           
  if (ratio >= 0.8) return 'text-green-600 bg-green-50';          
  if (ratio >= 0.3) return 'text-yellow-600 bg-yellow-50';        
  return 'text-red-600 bg-red-50';                                
};

/**
 * Filtre les produits par recherche (nom OU code EAN)
 */
export const filterProductSummaries = (
  products: ProductSummary[] | EnhancedProductSummary[], 
  searchQuery: string
): (ProductSummary | EnhancedProductSummary)[] => {
  if (!searchQuery.trim()) return products;
  
  const query = searchQuery.toLowerCase().trim();
  
  return products.filter(product => {
    const matchesName = product.nom.toLowerCase().includes(query);
    const matchesCode = product.code_ean.toLowerCase().includes(query);
    
    // Support recherche par fin de code EAN avec *
    const matchesCodeEnd = query.startsWith('*') && 
      product.code_ean.toLowerCase().endsWith(query.slice(1));
    
    return matchesName || matchesCode || matchesCodeEnd;
  });
};

/**
 * Pagination côté client
 */
export const paginateProductSummaries = (
  products: (ProductSummary | EnhancedProductSummary)[],
  currentPage: number,
  itemsPerPage: number
) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, products.length);
  const paginatedProducts = products.slice(startIndex, endIndex);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return {
    paginatedProducts,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, products.length)
  };
};

/**
 * Tri des produits par colonne (avec nouvelles colonnes)
 */
export type SortableColumn = 
  | 'nom' 
  | 'code_ean'
  | 'quantite_vendue_total'
  | 'prix_achat_moyen'
  | 'prix_vente_moyen'
  | 'taux_marge_moyen'
  | 'quantite_stock_moyenne'
  | 'quantite_stock_actuel'
  | 'stockIdeal'
  | 'quantiteACommander'
  | 'ecartVsStockMoyen';

export type SortDirection = 'asc' | 'desc' | null;

export const sortProductSummaries = (
  products: (ProductSummary | EnhancedProductSummary)[],
  column: SortableColumn,
  direction: SortDirection
): (ProductSummary | EnhancedProductSummary)[] => {
  if (!direction) return [...products];

  return [...products].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (column) {
      case 'nom':
        aValue = a.nom.toLowerCase();
        bValue = b.nom.toLowerCase();
        break;
      case 'code_ean':
        aValue = a.code_ean;
        bValue = b.code_ean;
        break;
      case 'quantite_vendue_total':
        aValue = a.quantite_vendue_total;
        bValue = b.quantite_vendue_total;
        break;
      case 'prix_achat_moyen':
        aValue = a.prix_achat_moyen;
        bValue = b.prix_achat_moyen;
        break;
      case 'prix_vente_moyen':
        aValue = a.prix_vente_moyen;
        bValue = b.prix_vente_moyen;
        break;
      case 'taux_marge_moyen':
        aValue = a.taux_marge_moyen;
        bValue = b.taux_marge_moyen;
        break;
      case 'quantite_stock_moyenne':
        aValue = a.quantite_stock_moyenne;
        bValue = b.quantite_stock_moyenne;
        break;
      case 'quantite_stock_actuel':
        aValue = a.quantite_stock_actuel;
        bValue = b.quantite_stock_actuel;
        break;
      // Nouvelles colonnes pour tri
      case 'stockIdeal':
        aValue = (a as EnhancedProductSummary).stockIdeal || 0;
        bValue = (b as EnhancedProductSummary).stockIdeal || 0;
        break;
      case 'quantiteACommander':
        aValue = (a as EnhancedProductSummary).quantiteACommander || 0;
        bValue = (b as EnhancedProductSummary).quantiteACommander || 0;
        break;
      case 'ecartVsStockMoyen':
        aValue = (a as EnhancedProductSummary).ecartVsStockMoyen || 0;
        bValue = (b as EnhancedProductSummary).ecartVsStockMoyen || 0;
        break;
      default:
        return 0;
    }

    // Comparaison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    }

    const numA = Number(aValue);
    const numB = Number(bValue);
    const comparison = numA - numB;
    return direction === 'asc' ? comparison : -comparison;
  });
};

/**
 * Conversion des données mensuelles pour graphique Recharts avec stock
 */
export const convertToChartData = (monthlyDetails: MonthlyDetailsRow[]): ChartDataPoint[] => {
  return monthlyDetails
    .filter(row => row.type_ligne === 'MENSUEL')
    .map(row => ({
      periode: formatMonthLabel(row.mois),
      quantite: row.quantite_vendue,
      stock: row.quantite_stock,
      prixVente: row.prix_vente_moyen,
      prixAchat: row.prix_achat_moyen,
      tauxMarge: row.taux_marge_moyen
    }))
    .sort((a, b) => {
      const dateA = parseMonthFromLabel(a.periode);
      const dateB = parseMonthFromLabel(b.periode);
      return dateA.getTime() - dateB.getTime();
    });
};

/**
 * Formate un mois YYYY-MM en libellé court fr-FR
 */
const formatMonthLabel = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 2) return dateStr;
    
    const year = parts[0];
    const month = parts[1];
    if (!year || !month) return dateStr;
    
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return new Intl.DateTimeFormat('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  } catch {
    return dateStr;
  }
};

/**
 * Parse un libellé de mois en Date pour tri chronologique
 */
const parseMonthFromLabel = (monthLabel: string): Date => {
  try {
    const parts = monthLabel.split(' ');
    if (parts.length !== 2) return new Date();
    
    const monthStr = parts[0];
    const yearStr = parts[1];
    
    if (!monthStr || !yearStr) return new Date();
    
    const year = parseInt(yearStr);
    
    const monthMap: Record<string, number> = {
      'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3,
      'mai': 4, 'juin': 5, 'juil.': 6, 'août': 7,
      'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11
    };
    
    const month = monthMap[monthStr.toLowerCase()] ?? 0;
    return new Date(year, month, 1);
  } catch {
    return new Date();
  }
};

/**
 * Calcule des statistiques de performance pour un produit
 */
export interface ProductPerformanceStats {
  readonly tendanceVentes: 'hausse' | 'baisse' | 'stable';
  readonly variationVentes: number;
  readonly tendanceMarge: 'hausse' | 'baisse' | 'stable';
  readonly variationMarge: number;
  readonly regulariteStock: 'regulier' | 'volatile' | 'critique';
  readonly coefficientVariationStock: number;
}

export const calculateProductPerformance = (
  monthlyDetails: MonthlyDetailsRow[]
): ProductPerformanceStats => {
  const monthlyData = monthlyDetails
    .filter(row => row.type_ligne === 'MENSUEL')
    .sort((a, b) => a.mois.localeCompare(b.mois));

  if (monthlyData.length < 2) {
    return {
      tendanceVentes: 'stable',
      variationVentes: 0,
      tendanceMarge: 'stable',
      variationMarge: 0,
      regulariteStock: 'regulier',
      coefficientVariationStock: 0
    };
  }

  const firstMonth = monthlyData[0];
  const lastMonth = monthlyData[monthlyData.length - 1];
  
  if (!firstMonth || !lastMonth) {
    return {
      tendanceVentes: 'stable',
      variationVentes: 0,
      tendanceMarge: 'stable',
      variationMarge: 0,
      regulariteStock: 'regulier',
      coefficientVariationStock: 0
    };
  }

  // Tendance ventes
  const variationVentes = firstMonth.quantite_vendue > 0
    ? ((lastMonth.quantite_vendue - firstMonth.quantite_vendue) / firstMonth.quantite_vendue) * 100
    : 0;
  
  const tendanceVentes = Math.abs(variationVentes) < 5 ? 'stable' 
    : variationVentes > 0 ? 'hausse' : 'baisse';

  // Tendance marge
  const variationMarge = firstMonth.taux_marge_moyen > 0
    ? ((lastMonth.taux_marge_moyen - firstMonth.taux_marge_moyen) / firstMonth.taux_marge_moyen) * 100
    : 0;
  
  const tendanceMarge = Math.abs(variationMarge) < 3 ? 'stable' 
    : variationMarge > 0 ? 'hausse' : 'baisse';

  // Régularité stock (coefficient de variation)
  const stockValues = monthlyData.map(row => row.quantite_stock).filter(stock => stock > 0);
  const moyenneStock = stockValues.reduce((sum, val) => sum + val, 0) / stockValues.length;
  const varianceStock = stockValues.reduce((sum, val) => sum + Math.pow(val - moyenneStock, 2), 0) / stockValues.length;
  const ecartTypeStock = Math.sqrt(varianceStock);
  const coefficientVariationStock = moyenneStock > 0 ? (ecartTypeStock / moyenneStock) * 100 : 0;

  const regulariteStock = coefficientVariationStock < 20 ? 'regulier'
    : coefficientVariationStock < 50 ? 'volatile' : 'critique';

  return {
    tendanceVentes,
    variationVentes,
    tendanceMarge,
    variationMarge,
    regulariteStock,
    coefficientVariationStock
  };
};

/**
 * Calcule les métriques de stock idéal pour un produit
 */
export const calculateStockMetrics = (
  product: ProductSummary,
  joursStockIdeal: number
): {
  stockIdeal: number;
  quantiteACommander: number;
  ecartVsStockMoyen: number;
  ventesQuotidiennesMoyennes: number;
} => {
  // Ventes moyennes quotidiennes sur 12 mois (365 jours)
  const ventesQuotidiennesMoyennes = product.quantite_vendue_total / 365;
  
  // Stock idéal = ventes quotidiennes × jours stock idéal
  const stockIdeal = Math.round(ventesQuotidiennesMoyennes * joursStockIdeal);
  
  // Quantité à commander = stock idéal - stock actuel (minimum 0)
  const quantiteACommander = Math.max(0, stockIdeal - product.quantite_stock_actuel);
  
  // Écart vs stock moyen = stock idéal - stock moyen
  const ecartVsStockMoyen = stockIdeal - product.quantite_stock_moyenne;
  
  return {
    stockIdeal,
    quantiteACommander,
    ecartVsStockMoyen,
    ventesQuotidiennesMoyennes
  };
};