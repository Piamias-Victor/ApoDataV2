import { getAchatsKpi } from '../achatsKpiService';
import { getVentesKpi } from '../ventesKpiService';
import { getMargeKpi } from '../margeKpiService';
import { getStockKpi } from '../stockKpiService';
import { getInventoryDaysKpi } from '../inventoryDaysService';
import { getReceptionRateKpi } from '../receptionRateService';
import { getPriceEvolutionKpi } from '../priceEvolutionService';

interface IKpiService {
    getKpiData(request: any): Promise<any>;
}

class KpiServiceRegistry {
    getService(key: string): IKpiService {
        switch (key) {
            case 'achats': return { getKpiData: getAchatsKpi };
            case 'ventes': return { getKpiData: getVentesKpi };
            case 'marge': return { getKpiData: getMargeKpi };
            case 'stock': return { getKpiData: getStockKpi };
            case 'inventoryDays': return { getKpiData: getInventoryDaysKpi };
            case 'receptionRate': return { getKpiData: getReceptionRateKpi };
            case 'priceEvolution': return { getKpiData: getPriceEvolutionKpi };
            default: throw new Error(`Service ${key} not found`);
        }
    }
}

export const kpiServiceFactory = new KpiServiceRegistry();
