
const rawData = [
  { cip: '2241522', id_nat: '062044623' },
  { cip: '2003697', id_nat: '062044623' },
  { cip: '2812712', id_nat: '062044623' },
  { cip: '2074088', id_nat: '132040429' },
  { cip: '2018856', id_nat: '342027828' },
  { cip: '2267912', id_nat: '842004863' },
  { cip: '2012700', id_nat: '842004863' },
  { cip: '2068755', id_nat: '132040585' },
  { cip: '2003964', id_nat: '132040585' },
  { cip: '2012629', id_nat: '262071004' },
  { cip: '2172852', id_nat: '672030095' },
  { cip: '2712789', id_nat: '672030095' },
  { cip: '2174844', id_nat: '682020763' },
  { cip: '2001842', id_nat: '062027784' },
  { cip: '2006468', id_nat: '062027784' },
  { cip: '2168825', id_nat: '642013593' },
  { cip: '2266400', id_nat: '842005456' },
  { cip: '2213720', id_nat: '842006751' },
  { cip: '2069607', id_nat: '132086612' },
  { cip: '2264974', id_nat: '672033586' },
  { cip: '2285554', id_nat: '692039340' },
  { cip: '2012616', id_nat: '692039340' },
  { cip: '2042873', id_nat: '832002810' },
  { cip: '2800796', id_nat: '832002810' },
  { cip: '2014879', id_nat: '832002810' },
  { cip: '7502040', id_nat: '832002810' },
  { cip: '2016728', id_nat: '332018811' },
  { cip: '2043919', id_nat: '842003121' },
  { cip: '2245202', id_nat: '202041711' },
  { cip: '2050287', id_nat: '942018359' },
  { cip: '2261533', id_nat: '132061276' },
  { cip: '2258714', id_nat: '772012092' },
  { cip: '2062287', id_nat: '062037049' },
  { cip: '2260346', id_nat: '952700268' },
  { cip: '2267069', id_nat: '342026218' },
  { cip: '2273030', id_nat: '202021481' },
  { cip: '2213301', id_nat: '832006787' },
  { cip: '2000840', id_nat: '112002860' },
  { cip: '2710493', id_nat: '432000842' },
  { cip: '2039331', id_nat: '772011623' },
  { cip: '2005235', id_nat: '202021648' },
  { cip: '2102172', id_nat: '332022219' },
  { cip: '2000514', id_nat: '332022755' },
  { cip: '2012631', id_nat: '132081613' },
  { cip: '2241700', id_nat: '132028473' },
  { cip: '2265606', id_nat: '802006031' },
  { cip: '2007051', id_nat: '802006031' },
  { cip: '2216627', id_nat: '852007137' },
  { cip: '2262411', id_nat: '772012522' },
  { cip: '2014785', id_nat: '772012522' },
  { cip: '2013413', id_nat: '842006348' },
  { cip: '2213207', id_nat: '832010870' },
  { cip: '2255692', id_nat: '832011449' },
  { cip: '2043400', id_nat: '832011431' },
  { cip: '2070696', id_nat: '132048687' },
  { cip: '2009819', id_nat: '132048687' },
  { cip: '2021696', id_nat: '422027854' },
  { cip: '2043898', id_nat: '842005472' },
  { cip: '2269087', id_nat: '752040428' },
  { cip: '2275420', id_nat: '132066978' },
  { cip: '2014498', id_nat: '132066978' },
  { cip: '2249689', id_nat: '832011373' },
  { cip: '2007267', id_nat: '832011373' },
  { cip: '2043369', id_nat: '832011498' },
  { cip: '2006478', id_nat: '832011498' },
  { cip: '2001439', id_nat: '062037692' },
  { cip: '2060866', id_nat: '062050992' },
  { cip: '2013978', id_nat: '302003330' },
  { cip: '2014385', id_nat: '302003330' },
  { cip: '2003487', id_nat: '302007638' },
  { cip: '2241386', id_nat: '952701043' },
  { cip: '2805459', id_nat: '932017825' },
  { cip: '2000671', id_nat: '132048190' },
  { cip: '2014039', id_nat: '752043471' },
  { cip: '2190819', id_nat: '752043471' },
  { cip: '2002398', id_nat: '132043514' },
  { cip: '2006688', id_nat: '422027524' },
  { cip: '2004383', id_nat: '422027524' },
  { cip: '2184564', id_nat: '732003132' },
  { cip: '2014928', id_nat: '732003132' },
  { cip: '2281235', id_nat: '132083346' },
  { cip: '2271447', id_nat: '842005837' },
  { cip: '2000793', id_nat: '422026542' },
  { cip: '2001450', id_nat: '912015948' },
  { cip: '2006836', id_nat: '922020771' },
  { cip: '2145038', id_nat: '562008771' },
  { cip: '2985049', id_nat: '562008771' },
  { cip: '2176574', id_nat: '692039092' },
  { cip: '2092039', id_nat: '282004084' },
  { cip: '2046773', id_nat: '912015492' },
  { cip: '2002958', id_nat: '742005481' },
  { cip: '2012756', id_nat: '052702370' },
  { cip: '2257925', id_nat: '052702370' },
  { cip: '2125556', id_nat: '442002119' },
  { cip: '2002439', id_nat: '692020472' },
  { cip: '2245600', id_nat: '212004386' },
  { cip: '2004565', id_nat: '212004386' },
  { cip: '2007327', id_nat: '192005940' },
  { cip: '2081179', id_nat: '192005940' },
  { cip: '2265632', id_nat: '192005940' },
  { cip: '2207413', id_nat: '792020646' },
  { cip: '3003717', id_nat: '972103352' },
  { cip: '3944226', id_nat: '972103352' },
  { cip: '2277889', id_nat: '062029590' },
  { cip: '2285140', id_nat: '152001665' },
  { cip: '2004946', id_nat: '302004957' },
  { cip: '2096159', id_nat: '302004957' },
  { cip: '2170457', id_nat: '662004100' },
  { cip: '2007754', id_nat: '662004100' },
  { cip: '2037046', id_nat: '732002811' },
  { cip: '2009552', id_nat: '732002811' },
  { cip: '2245029', id_nat: '202041943' },
  { cip: '2245019', id_nat: '202041943' },
  { cip: '2032289', id_nat: '662004522' },
  { cip: '2007825', id_nat: '662004522' },
  { cip: '2007826', id_nat: '662004522' },
  { cip: '2781606', id_nat: '132021585' },
  { cip: '2284220', id_nat: '302006192' },
  { cip: '2005282', id_nat: '132042649' },
  { cip: '2004969', id_nat: '132042649' },
  { cip: '2022485', id_nat: '442005393' },
  { cip: '2269506', id_nat: '442004586' },
  { cip: '2255540', id_nat: '922021373' },
  { cip: '2009918', id_nat: '922021373' },
  { cip: '2007123', id_nat: '712006733' },
  { cip: '2181914', id_nat: '712006733' },
  { cip: '2007129', id_nat: '712006733' },
  { cip: '2098753', id_nat: '312008915' },
  { cip: '2009541', id_nat: '312008915' },
  { cip: '2040698', id_nat: '782712756' },
  { cip: '2050072', id_nat: '782712756' },
  { cip: '2176071', id_nat: '692013469' },
  { cip: '2018065', id_nat: '342027588' },
  { cip: '2009397', id_nat: '342027588' },
  { cip: '2008842', id_nat: '342027588' },
  { cip: '2026338', id_nat: '572013522' },
  { cip: '2252534', id_nat: '842006462' },
  { cip: '2288602', id_nat: '342030137' },
  { cip: '2225322', id_nat: '912011640' },
  { cip: '2186645', id_nat: '742006752' },
  { cip: '2250495', id_nat: '912016110' },
  { cip: '2165562', id_nat: '632013454' },
  { cip: '2072049', id_nat: '132046384' },
  { cip: '2012778', id_nat: '062029871' },
  { cip: '2014174', id_nat: '062029871' },
  { cip: '62029871', id_nat: '062029871' },
  { cip: '2000910', id_nat: '372006049' },
  { cip: '2250055', id_nat: '842006306' },
  { cip: '2010211', id_nat: '842006306' },
  { cip: '2108263', id_nat: '342030285' },
  { cip: '2006217', id_nat: '132069444' },
  { cip: '2225474', id_nat: '922017215' },
  { cip: '2168720', id_nat: '642024772' }
];

// Group CIPs by ID_NAT
const grouped = rawData.reduce((acc, curr) => {
    if (!acc[curr.id_nat]) {
        acc[curr.id_nat] = new Set();
    }
    acc[curr.id_nat].add(curr.cip);
    return acc;
}, {});

console.log(`-- 1. Ajout de la colonne (à exécuter une seule fois)
ALTER TABLE data_pharmacy ADD COLUMN IF NOT EXISTS cip TEXT;

-- 2. Mise à jour des données (` + Object.keys(grouped).length + ` pharmacies concernées)`);

console.log(`-- Début de la transaction pour assurer l'intégrité
BEGIN;

-- Création d'une table temporaire pour les mises à jour en masse (plus performant)
CREATE TEMP TABLE tmp_cip_updates (id_nat text, cip_list text);

INSERT INTO tmp_cip_updates (id_nat, cip_list) VALUES`);

const entries = Object.entries(grouped);
entries.forEach(([id_nat, cips], index) => {
    const cipString = Array.from(cips).join(', ');
    const isLast = index === entries.length - 1;
    console.log(`('${id_nat}', '${cipString}')${isLast ? ';' : ','}`);
});

console.log(`
-- Appliquer les mises à jour
UPDATE data_pharmacy
SET cip = tmp.cip_list
FROM tmp_cip_updates tmp
WHERE data_pharmacy.id_nat = tmp.id_nat;

-- Nettoyage
DROP TABLE tmp_cip_updates;

COMMIT;

-- Vérification
SELECT id_nat, name, cip FROM data_pharmacy WHERE cip IS NOT NULL LIMIT 5;
`);
