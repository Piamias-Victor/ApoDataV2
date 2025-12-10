// src/services/FilterResolutionService.ts
import { FilterState } from '@/types/filters';

/**
 * Service PUR (Pure function) qui prend l'état des filtres et retourne la liste des codes produits.
 * Ne dépend pas du store ni de l'UI.
 */
export const resolveProductCodes = (state: FilterState): string[] => {
    // 1. Collecte des codes par source (Scope)
    const manualCodes = new Set(state.products.map(p => p.code));

    const labProducts = new Set<string>();
    state.laboratories.forEach(lab => lab.productCodes.forEach(code => labProducts.add(code)));

    const categoryProducts = new Set<string>();
    state.categories.forEach(cat => cat.productCodes.forEach(code => categoryProducts.add(code)));

    const groupProducts = new Set<string>();
    state.groups.forEach(group => group.productCodes.forEach(code => groupProducts.add(code)));

    // 2. Intersection ou Union (Logic)
    let finalCodes = new Set<string>();
    const activeSets: Set<string>[] = [];

    if (manualCodes.size > 0) activeSets.push(manualCodes);
    if (labProducts.size > 0) activeSets.push(labProducts);
    if (categoryProducts.size > 0) activeSets.push(categoryProducts);
    if (groupProducts.size > 0) activeSets.push(groupProducts);

    if (activeSets.length === 0) {
        // Aucun filtre de scope, on retourne vide (ou TOUT selon la spec, ici vide = pas de restriction scope)
        // Mais attention, si on a juste un filtre TVA, on veut peut-être TOUS les produits ?
        // Pour l'instant, si aucun scope n'est défini, on considère qu'on cible TOUT.
        // La logique exacte dépendra de si on veut afficher "Tout le catalogue" par défaut.
        // Simulons un retour vide pour dire "Pas de sélection spécifique". 
        // L'API backend interprétera [] comme ALL si nécessaire, ou on gère ça ici.
        return [];
    }

    if (state.logicOperator === 'OR') {
        // Union
        activeSets.forEach(set => {
            set.forEach(code => finalCodes.add(code));
        });
    } else {
        // Intersection (AND)
        // On prend le premier set comme base et on filtre
        const [firstSet, ...restSets] = activeSets;

        if (firstSet) {
            firstSet.forEach(code => {
                if (restSets.every(set => set.has(code))) {
                    finalCodes.add(code);
                }
            });
        }
    }

    // 3. Exclusion
    state.excludedProductCodes.forEach(code => finalCodes.delete(code));

    // Note: Le filtrage par attributs (TVA, Prix, etc.) se fait souvent côté SERVEUR 
    // car le client ne connaît pas les attributs de TOUS les produits du monde.
    // Ce service résout donc le "Scope" (ID produits explicitement ciblés).
    // Les attributs (settings) seront passés en paramètre à l'API.

    return Array.from(finalCodes);
};
