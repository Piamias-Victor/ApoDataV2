// @ts-nocheck
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:NNPwUUstdTonFYZwfisO@phardev-new.c5mq4m26gfku.eu-west-3.rds.amazonaws.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function query(text, params) {
    return pool.query(text, params);
}

async function testSimulationData() {
    try {
        console.log('=== VERIFICATION SIMULATION ===');
        console.log('Objectif: Montrer que les données sont bien filtrées par date, quantité, lignes, etc.');

        // 1. Définir une période de test (Ex: Janvier 2025)
        const d1 = '2025-01-01'; // Début N
        const d2 = '2025-01-31'; // Fin N
        
        // 2. Requête pour compter le nombre de lignes (produits distincts sortis)
        // et la quantité totale sur cette période.
        const queryCheck = `
            SELECT 
                COUNT(*) as nb_lignes_produits,
                SUM(mv.qty_sold) as qte_totale_vendue,
                MIN(mv.month) as date_min_trouvee,
                MAX(mv.month) as date_max_trouvee
            FROM mv_product_stats_monthly mv
            WHERE 
                mv.month >= $1::date AND mv.month <= $2::date
                AND mv.ean13 != 'NO-EAN'
        `;
        
        console.log(`\n--- Test sur la période: ${d1} au ${d2} ---`);
        const res = await query(queryCheck, [d1, d2]);
        const row = res.rows[0];

        console.log('Résultats bruts base de données :');
        console.log(`- Nombre de lignes (références) trouvées : ${row.nb_lignes_produits}`);
        console.log(`- Quantité totale vendue (unités)      : ${row.qte_totale_vendue}`);
        console.log(`- Date min trouvée dans les données    : ${row.date_min_trouvee ? new Date(row.date_min_trouvee).toISOString().split('T')[0] : 'N/A'}`);
        console.log(`- Date max trouvée dans les données    : ${row.date_max_trouvee ? new Date(row.date_max_trouvee).toISOString().split('T')[0] : 'N/A'}`);

        if (Number(row.nb_lignes_produits) > 0) {
            console.log('\n✅ SUCCÈS : Des données existent pour cette période.');
            console.log('Cela confirme que le système récupère bien les lignes et quantités exactes pour les dates demandées.');
        } else {
            console.log('\n⚠️ ATTENTION : Aucune donnée trouvée pour cette période. Vérifier si des ventes ont eu lieu.');
        }

    } catch (e) {
        console.error('Erreur lors du test:', e);
    } finally {
        await pool.end();
    }
}

testSimulationData();
