# Architecture CI/CD — ThéTipTop

> **Branches Git** : le dépôt utilise **`vdev` → `vpreprod` → `vprod`** pour la CI/CD (Harbor, déploiement VPS). Les anciennes branches **`dev`**, **`preprod`**, **`prod`** ne sont plus référencées par les workflows.

## Vue d’ensemble

```
push sur vdev / vpreprod / vprod
            │
            ▼
   ┌────────────────────────────┐
   │  CI — Monorepo (ci.yml)    │
   │  · qualité server + client │
   │  · images api + client      │
   │     (Harbor)                │
   └─────────────┬──────────────┘
                 │ succès (push)
                 ▼
   ┌────────────────────────────┐
   │  create-promotion-pr        │
   │  vdev→vpreprod, vpreprod→vprod │
   └────────────────────────────┘

Déploiement VPS : deploy-vdev.yml, deploy-vpreprod.yml, deploy-vprod.yml
(se déclenchent sur la branche correspondante selon chaque fichier).
```

## Fichiers principaux

| Fichier | Rôle |
|--------|------|
| `ci.yml` | CI monorepo automatique sur `vdev`, `vpreprod`, `vprod` |
| `deploy-vdev.yml` / `deploy-vpreprod.yml` / `deploy-vprod.yml` | CD vers le VPS |
| `create-promotion-pr.yml` | Ouverture manuelle de PR de promotion |

## Principes

1. **Qualité complète** surtout sur **`vdev`** (lint, tests) ; jobs allégés sur `vpreprod` / `vprod` selon `RUN_FULL_QUALITY` dans `ci.yml`.
2. **Une** PR de promotion automatique dans `ci.yml` après succès des jobs qualité + Docker.

## Permissions

- **Settings → Actions → Workflow permissions** : lecture/écriture, autoriser la création de PR par Actions.
- Secrets Harbor : voir `workflows/README.md` et `GITHUB-SECRETS.md`.

## Bonnes pratiques

- Flux de promotion : **PR** `vdev` → `vpreprod` → `vprod` plutôt que push direct sur `vpreprod` / `vprod` si l’équipe impose les revues.
- Aligner la **branche par défaut** du dépôt avec les workflows attendus pour les `workflow_run` éventuels.

---

_Document réaligné sur les branches `vdev` / `vpreprod` / `vprod` — 2026-04_
