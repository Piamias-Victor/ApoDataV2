# 📋 Standards & Contexte de Développement (ApoData V2)

> **À INCLURE DANS CHAQUE NOUVEAU PROMPT POUR GARANTIR LA QUALITÉ DU CODE.**

## 1. Fonctionnalités Obligatoires (Non-négociables)
Tout nouveau tableau ou affichage de données analytiques doit **systématiquement** inclure :

- **🔍 Filtrage Avancé** : Barre de recherche réactive et filtres contextuels.
- **tas Tri (Sorting)** :
  - Tous les en-têtes de colonnes doivent être triables.
  - Implémentation cohérente (Server-side pour les gros volumes, Client-side pour les petits).
  - Indicateurs visuels clairs (Flèches, couleurs actives).
- **📈 Évolutions & Comparaisons** :
  - Affichage des variations (N vs N-1) avec badges de couleur (Vert/Rouge/Gris).
  - Toujours inclure le contexte comparatif ("Moi vs Groupe", "Moi vs Objectif").

## 2. Standards de Code & Architecture (Clean Code)
- **📏 Règle des 100 Lignes** : **Aucun fichier ne doit dépasser 100 lignes.**
  - Si > 100 lignes ➔ Découper en sous-composants atomiques ou extraire les hooks.
- **🧩 Réutilisabilité (DRY)** :
  - Ne jamais dupliquer de logique.
  - Utiliser les composants existants (`TableHeaderCell`, `ValueCell`, `EvolutionBadge`, etc.).
  - Extraire la logique métier dans des Custom Hooks (`useProductAnalysis`, `useClientTableSort`).
- **🚀 Scalabilité** :
  - Utiliser `useMemo` et `useCallback` pour les opérations coûteuses.
  - Architecture modulaire prête pour l'ajout de nouvelles features sans refonte.
- **🛡️ Typage Strict** : TypeScript strict. Pas de `any`. Interfaces claires et exportées.

## 3. Informations Techniques
- **Framework** : Next.js 14 (App Router), React, TypeScript.
- **Styling** : TailwindCSS (Utiliser les variants de couleurs : `variant="purple"`, `variant="blue"`, etc.).
- **État** : Gestion d'url pour les filtres (shoppable url), Hooks pour l'état local.

## 4. Checklist de Validation "Agent"
Avant de proposer du code, vérifie :
1. [ ] Le fichier est-il sous les 100 lignes ?
2. [ ] Le design est-il "Premium" et cohérent avec l'existant ?
3. [ ] Les tris et filtres sont-ils fonctionnels ?
4. [ ] Ai-je utilisé les composants partagés ?
