# 🏗️ Standards de Développement — ApoData Genesis

> **INSTRUCTION SYSTÈME** : Ce document définit les règles absolues pour tout développement sur ce projet. À respecter sans exception.

---

## 1. Méthodologie de Travail (Obligatoire)

### 📂 Analyse du Contexte Avant Tout Code
Avant d'écrire la moindre ligne de code :
1. **Explorer les fichiers existants** du projet pour comprendre :
   - La structure et les conventions de nommage
   - Les patterns utilisés (hooks, composants, API routes)
   - Les noms exacts des tables/colonnes en BDD
   - Les types et interfaces déjà définis
2. **Identifier les composants réutilisables** existants avant d'en créer de nouveaux
3. **Vérifier les hooks similaires** pour maintenir la cohérence

### ✅ Validation Systématique
- **Toujours exécuter `npm run build`** après chaque modification pour garantir :
  - Aucune erreur TypeScript
  - Aucun warning bloquant
  - Build production fonctionnel
- Ne jamais livrer de code sans build réussi

### 🚫 Règles de Communication
- **Ne jamais deviner** : noms de colonnes, règles métier, sources de données
- **Demander explicitement** si une information manque
- **Valider avant de coder** si un doute persiste

---

## 2. Fonctionnalités UI Obligatoires

Tout tableau ou affichage analytique **doit inclure** :

| Fonctionnalité | Exigence |
|----------------|----------|
| **Recherche** | Barre de recherche réactive avec debounce |
| **Tri** | Colonnes triables avec indicateurs visuels (↑↓) |
| **Ctrl + Clic** | Filtrage rapide sur éléments interactifs (charts, lignes) + tooltip d'indication |
| **Évolutions** | Badges colorés N vs N-1 (vert/rouge/gris) |
| **Comparaisons** | Contexte "Moi vs Groupe" ou "Moi vs Objectif" |

---

## 3. Standards de Code

### 📏 Contraintes Strictes
- **Maximum 100 lignes par fichier** → Découper en sous-composants ou extraire hooks
- **TypeScript strict** → Pas de `any`, interfaces exportées
- **DRY absolu** → Réutiliser `TableHeaderCell`, `ValueCell`, `EvolutionBadge`, hooks existants

### ⚡ Performance
- `useMemo` / `useCallback` pour opérations coûteuses
- Server-side sorting/filtering pour gros volumes
- Architecture modulaire et extensible

---

## 4. Stack Technique

| Domaine | Technologie |
|---------|-------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript strict |
| Styling | TailwindCSS + variants (`variant="purple"`) |
| État filtres | URL params (shareable URLs) |
| État local | Custom hooks |

---

## 5. Checklist Avant Livraison

- [ ] Fichiers existants analysés et patterns respectés
- [ ] Composants/hooks existants réutilisés
- [ ] Aucun fichier > 100 lignes
- [ ] Pas de `any` TypeScript
- [ ] `npm run build` réussi sans erreur
- [ ] Tri, recherche, Ctrl+Clic implémentés (si tableau)