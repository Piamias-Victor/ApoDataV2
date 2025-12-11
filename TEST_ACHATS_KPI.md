# Test Achats KPI avec Evolution

## Test 1: Sans période de comparaison
```bash
curl -X POST http://localhost:3000/api/kpi/achats \
  -H "Content-Type: application/json" \
  -d '{
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    }
  }'
```

**Réponse attendue:**
```json
{
  "montant_ht": 123456789,
  "quantite_achetee": 61667321,
  "queryTime": 4000
}
```

## Test 2: Avec période de comparaison (2024 vs 2025)
```bash
curl -X POST http://localhost:3000/api/kpi/achats \
  -H "Content-Type: application/json" \
  -d '{
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "comparisonDateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }'
```

**Réponse attendue:**
```json
{
  "montant_ht": 123456789,
  "quantite_achetee": 61667321,
  "evolution_percent": 12.5,
  "queryTime": 8000
}
```

## Notes
- L'évolution est calculée sur le **montant_ht** (pas sur la quantité)
- Si montant de comparaison = 0, pas d'évolution retournée
- Deux requêtes SQL si période de comparaison fournie
