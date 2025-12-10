export interface MonthlyPharmacyMetric {
    pharmacy_id: string;
    pharmacy_name: string;
    month: string; // YYYY-MM format

    // Sales metrics
    quantite_vendue: number;
    montant_ventes_ttc: number;

    // Purchase metrics
    quantite_achetee: number;
    montant_achats_ht: number;

    // Evolution vs previous month
    evol_ventes_pct: number | null;
    evol_achats_pct: number | null;
}

export interface PharmacyMonthlyData {
    pharmacy_id: string;
    pharmacy_name: string;
    months: {
        [month: string]: {
            quantite_vendue: number;
            montant_ventes_ttc: number;
            quantite_achetee: number;
            montant_achats_ht: number;
            evol_ventes_pct: number | null;
            evol_achats_pct: number | null;
        };
    };
}

export interface MonthlyMetricsResponse {
    pharmacies: PharmacyMonthlyData[];
    months: string[]; // List of all months in the period
    queryTime: number;
}
