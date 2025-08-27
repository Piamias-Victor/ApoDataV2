// src/components/organisms/MetricsEvolutionChart/utils.ts
import type { ViewMode, AggregatedDataPoint, ChartDataPoint } from './types';

// Interface locale pour éviter les erreurs d'import
interface DailyMetricsEntry {
  date: string;
  quantite_vendue_jour: number;
  ca_ttc_jour: number;
  marge_jour: number;
  quantite_achat_jour: number;
  montant_achat_jour: number;
  stock_jour: number;
  cumul_quantite_vendue: number;
  cumul_quantite_achetee: number;
  cumul_ca_ttc: number;
  cumul_montant_achat: number;
  cumul_marge: number;
}

/**
 * Agrège les données daily metrics par période (semaine/mois)
 */
export function aggregateDataByPeriod(
  dailyData: DailyMetricsEntry[], 
  viewMode: ViewMode
): AggregatedDataPoint[] {
  if (viewMode === 'daily') {
    return dailyData.map(entry => ({
      date: entry.date,
      period: formatPeriodLabel(entry.date, viewMode),
      ventes: entry.ca_ttc_jour,
      achats: entry.montant_achat_jour,
      marge: entry.marge_jour,
      stock: entry.stock_jour
    }));
  }

  const groupedData = new Map<string, DailyMetricsEntry[]>();

  // Groupage par période
  dailyData.forEach(entry => {
    const periodKey = getPeriodKey(entry.date, viewMode);
    if (!groupedData.has(periodKey)) {
      groupedData.set(periodKey, []);
    }
    groupedData.get(periodKey)!.push(entry);
  });

  // Agrégation
  const aggregatedData: AggregatedDataPoint[] = [];
  
  groupedData.forEach((entries) => {
    if (entries.length === 0) return;
    
    const firstEntry = entries[0]!; // Non-null assertion car on vérifie length > 0
    const lastEntry = entries[entries.length - 1]!; // Non-null assertion car on vérifie length > 0
    
    aggregatedData.push({
      date: firstEntry.date,
      period: formatPeriodLabel(firstEntry.date, viewMode),
      ventes: entries.reduce((sum, entry) => sum + entry.ca_ttc_jour, 0),
      achats: entries.reduce((sum, entry) => sum + entry.montant_achat_jour, 0),
      marge: entries.reduce((sum, entry) => sum + entry.marge_jour, 0),
      stock: lastEntry.stock_jour // Stock = valeur à la fin de période
    });
  });

  return aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Génère les données finales avec cumuls pour le graphique
 */
export function prepareChartData(
  aggregatedData: AggregatedDataPoint[]
): ChartDataPoint[] {
  let cumulVentes = 0;
  let cumulAchats = 0;
  let cumulMarge = 0;

  return aggregatedData.map(point => {
    cumulVentes += point.ventes;
    cumulAchats += point.achats;
    cumulMarge += point.marge;

    return {
      ...point,
      cumulVentes,
      cumulAchats,
      cumulMarge,
      cumulStock: point.stock // Stock n'est pas cumulatif
    };
  });
}

/**
 * Génère la clé de période pour groupage
 */
function getPeriodKey(dateStr: string, viewMode: ViewMode): string {
  const date = new Date(dateStr);
  
  switch (viewMode) {
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'weekly':
      const year = date.getFullYear();
      const weekNumber = getWeekNumber(date);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    case 'daily':
    default:
      return dateStr;
  }
}

/**
 * Formate le label d'affichage de période
 */
export function formatPeriodLabel(dateStr: string, viewMode: ViewMode): string {
  const date = new Date(dateStr);
  
  switch (viewMode) {
    case 'monthly':
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
    case 'weekly':
      const weekNumber = getWeekNumber(date);
      return `S${weekNumber} ${date.getFullYear()}`;
    case 'daily':
    default:
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
}

/**
 * Calcule le numéro de semaine ISO
 */
function getWeekNumber(date: Date): number {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/**
 * Formatage intelligent des valeurs pour tooltips
 */
export function formatValueForTooltip(value: number, type: 'currency' | 'number'): string {
  if (type === 'currency') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Validation des données pour éviter les erreurs
 */
export function validateChartData(data: ChartDataPoint[]): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  return data.every(point => 
    typeof point.date === 'string' &&
    typeof point.ventes === 'number' &&
    typeof point.achats === 'number' &&
    typeof point.marge === 'number' &&
    typeof point.stock === 'number' &&
    !isNaN(point.ventes) &&
    !isNaN(point.achats) &&
    !isNaN(point.marge) &&
    !isNaN(point.stock)
  );
}