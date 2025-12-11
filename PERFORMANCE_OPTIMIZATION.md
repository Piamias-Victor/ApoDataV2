# Performance Optimization Guide

## What Was Done

### 1. ✅ Reusable Cache System
**File:** `src/lib/cache/queryCache.ts`

**Features:**
- In-memory cache with 12h TTL
- Reusable across ALL KPI endpoints
- `withCache()` helper function
- Cache stats and management

**Usage:**
```typescript
import { withCache, queryCache } from '@/lib/cache/queryCache';

const cacheKey = queryCache.generateKey('kpi-name', params);
const data = await withCache(cacheKey, () => fetchData(params));
```

### 2. ✅ Optimized SQL Query
**Changed:** LATERAL JOIN → CTE (Common Table Expression)

**Before (SLOW):**
```sql
LEFT JOIN LATERAL (
  SELECT weighted_average_price
  FROM data_inventorysnapshot
  WHERE product_id = po.product_id
  ORDER BY date DESC
  LIMIT 1
) ins ON true
```
**Problem:** Executes subquery for EVERY row (millions of times)

**After (FAST):**
```sql
WITH latest_prices AS (
  SELECT DISTINCT ON (product_id)
    product_id, weighted_average_price
  FROM data_inventorysnapshot
  WHERE weighted_average_price > 0
  ORDER BY product_id, date DESC
)
LEFT JOIN latest_prices lp ON po.product_id = lp.product_id
```
**Benefit:** Pre-calculates ALL prices once, then simple JOIN

### 3. ✅ Database Indexes
**File:** `OPTIMIZE_INDEXES.sql`

**Run this SQL:**
```bash
psql $DATABASE_URL < OPTIMIZE_INDEXES.sql
```

**Indexes created:**
- `idx_order_delivery_date` - Fast date range filtering
- `idx_productorder_product_id` - Fast product joins
- `idx_inventorysnapshot_product_date` - Fast price lookups
- `idx_internalproduct_code_ref` - Fast product filtering
- `idx_internalproduct_pharmacy` - Fast pharmacy filtering

## Expected Performance

### Before Optimization
- First query: **~25 seconds**
- With comparison: **~50 seconds**
- Repeated queries: **~50 seconds** (no cache)

### After Optimization
- First query: **~3-5 seconds** (with indexes + optimized SQL)
- With comparison: **~6-10 seconds**
- Repeated queries: **<100ms** (cache hit!)

### Performance Gains
- **5-10x faster** SQL queries
- **500x faster** cached queries
- **Reusable** cache for all KPIs

## Testing

### 1. Run Index Creation
```bash
psql $DATABASE_URL < OPTIMIZE_INDEXES.sql
```

### 2. Test First Query (should be ~3-5s)
```bash
curl -X POST http://localhost:3000/api/kpi/achats \
  -H "Content-Type: application/json" \
  -d '{"dateRange":{"start":"2025-01-01","end":"2025-12-31"}}'
```

### 3. Test Cached Query (should be <100ms)
```bash
# Run same query again immediately
curl -X POST http://localhost:3000/api/kpi/achats \
  -H "Content-Type: application/json" \
  -d '{"dateRange":{"start":"2025-01-01","end":"2025-12-31"}}'
```

### 4. Check Logs
Look for:
- `✅ [Cache] Hit:` - Cache working!
- `⏳ [Cache] Miss, fetching:` - First time query
- Duration in logs should be much lower

## Cache Management

### Clear cache programmatically
```typescript
import { queryCache } from '@/lib/cache/queryCache';

// Clear all
queryCache.clear();

// Clear expired only
queryCache.clearExpired();

// Get stats
const stats = queryCache.getStats();
console.log(stats); // { size: 10, ttlHours: 12 }
```

### Cache automatically expires after 12h

## Next Steps

1. **Run the index SQL** - Critical for performance
2. **Test and measure** - Compare before/after
3. **Apply same pattern** to other KPIs (Ventes, Marge, Stock)
4. **Monitor cache hit rate** - Should be >80% in production

## Notes

- Cache is in-memory (resets on server restart)
- For production with multiple servers, consider Redis
- Current cache is perfect for 10 concurrent users
- TTL of 12h is configurable in `queryCache.ts`
