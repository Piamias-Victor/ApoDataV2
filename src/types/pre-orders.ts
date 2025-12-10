export interface PreOrderMetric {
    date: string; // YYYY-MM
    montant_achat_ht: number;
    quantite: number;
}

export interface PreOrdersResponse {
    metrics: PreOrderMetric[];
    total_montant_achat_ht: number;
    total_quantite: number;
    queryTime: number;
}
