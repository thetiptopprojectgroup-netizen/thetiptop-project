# Architecture CI/CD — ThéTipTop

> **Branches Git** : le dépôt utilise **`vdev` → `vpreprod` → `vprod`** pour la CI/CD (Harbor, déploiement VPS). Les anciennes branches **`dev`**, **`preprod`**, **`prod`** ne sont plus référencées par les workflows.

## Vue d’ensemble

```
push sur vdev / vpreprod / vprod
            │
            ├──────────────────────────┐
            ▼                          ▼
   ┌────────────────────┐     ┌─────────────────────────────┐
   │ CI — Monorepo      │     │ CD — deploy-vdev /          │
   │ (ci.yml)           │     │     deploy-vpreprod / vprod │
   │ qualité + images   │     │ gate → build → deploy-vps   │
   └────────────────────┘     └──────────────┬──────────────┘
                                             │ succès
                                             ▼
                              ┌──────────────────────────────┐
                              │ PR promotion (brouillon)      │
                              │ vdev→vpreprod ou vpreprod→vprod│
                              └──────────────────────────────┘
```

Les PR de promotion sont créées **uniquement après** un déploiement CD réussi, pas à la seule fin de la CI.

## Fichiers principaux

| Fichier | Rôle |
|--------|------|
| `ci.yml` | CI monorepo automatique sur `vdev`, `vpreprod`, `vprod` |
| `deploy-vdev.yml` / `deploy-vpreprod.yml` / `deploy-vprod.yml` | CD vers le VPS |
| `create-promotion-pr.yml` | Ouverture manuelle de PR de promotion |

## Principes

1. **Qualité complète** surtout sur **`vdev`** (lint, tests) ; jobs allégés sur `vpreprod` / `vprod` selon `RUN_FULL_QUALITY` dans `ci.yml`.
2. **PR de promotion** : jobs `promotion-pr` dans les workflows **CD** (`deploy-vdev.yml`, `deploy-vpreprod.yml`), après **`deploy-vps`**.

## Permissions

- **Settings → Actions → Workflow permissions** : lecture/écriture, autoriser la création de PR par Actions.
- Secrets Harbor : voir `workflows/README.md` et `GITHUB-SECRETS.md`.

## Bonnes pratiques

- Flux de promotion : **PR** `vdev` → `vpreprod` → `vprod` plutôt que push direct sur `vpreprod` / `vprod` si l’équipe impose les revues.
- Aligner la **branche par défaut** du dépôt avec les workflows attendus pour les `workflow_run` éventuels.

---

_Document réaligné sur les branches `vdev` / `vpreprod` / `vprod` — 2026-04_
