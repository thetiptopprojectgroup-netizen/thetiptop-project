# Documentation des workflows CI/CD

## Architecture globale

Le projet utilise **une CI monorepo** + **déploiement VPS** + **workflows manuels** :

1. **`ci.yml` — CI — Monorepo (server + client)** : seul workflow CI déclenché automatiquement sur push/PR pour **`vdev`**, **`vpreprod`**, **`vprod`**. Ordre des jobs : **1** qualité backend · **1** qualité frontend (parallèle) → **2** image `api` · **2** image `client` + Harbor/Trivy (parallèle) → **3** commentaire PR / PR de promotion.
2. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — push sur la branche correspondante (ou `workflow_run` / manuel selon le fichier).
3. **Create promotion PR (manual)** : secours si la PR automatique n’a pas été créée (`vdev` → `vpreprod`, `vpreprod` → `vprod`).

**Harbor (CI)** : secret **`HARBOR_REGISTRY_BASE`**, projets **`vdev` / `vpreprod` / `vprod`**, images **`api`** et **`client`** taguées par le SHA du commit.

**Scan Trivy dans Harbor** : si l’API renvoie `no available scanner` / `PRECONDITION`, configure un scanner sous **Harbor → Administration → Scanners** (ou ignore l’étape) — la CI reste verte.

### Conventions Git

- **Messages de commit** : en **français**, forme claire.

---

## Flux par branche (`vdev` / `vpreprod` / `vprod`)

### Branche `vdev` (développement)

**Déclenchement** : `git push origin vdev`

**Pipeline** : **`CI — Monorepo`** — lint/tests complets (si scripts présents), build client, puis images Docker `api` + `client`.

**Résultat** : si tout est vert → **PR automatique** `vdev` → `vpreprod` (non brouillon).

---

### Branche `vpreprod`

**Déclenchement** : push ou merge sur `vpreprod`

**Pipeline** : suite qualité **allégée** (lint/tests complets surtout sur `vdev`), build + images Docker.

**Résultat** : si tout est vert → **PR automatique** `vpreprod` → `vprod` (**brouillon**).

---

### Branche `vprod`

**Déclenchement** : push sur `vprod`

**Pipeline** : même logique allégée + images ; **aucune** PR de promotion automatique (fin du flux).

---

## Détail des jobs CI (`ci.yml`)

| Job | Rôle |
|-----|------|
| `server-quality` | `npm ci`, lint (`--if-present`), Jest + couverture sur `vdev` (et PR vers `vdev`) |
| `client-quality` | `npm ci`, lint/tests/E2E si présents, build Vite |
| `server-docker` | Build/push **`{HARBOR_REGISTRY_BASE}/{projet}/api:SHA`**, scan Harbor |
| `client-docker` | Build/push **`…/client:SHA`** avec URLs Vite alignées CD |
| `notify-pr` | Commentaire de synthèse sur les PR |
| `create-promotion-pr` | PR `vdev→vpreprod`, `vpreprod→vprod` |

---

## Promotion automatique

Un seul job **`create-promotion-pr`** dans **`ci.yml`**, après succès des jobs qualité + Docker.

---

## Configuration requise

### Secrets GitHub

```yaml
HARBOR_REGISTRY_BASE: harbor.example.com
HARBOR_USERNAME: robot$thetiptop
HARBOR_PASSWORD: ***
```

### Permissions GitHub Actions

Dans **Settings → Actions → General → Workflow permissions** :

- Read and write permissions
- Allow GitHub Actions to create and approve pull requests

---

## Utilisation quotidienne

### Développement (`vdev`)

```bash
git checkout vdev
git pull
git commit -am "feat: …"
git push origin vdev
# → CI Monorepo ; si vert : PR vdev → vpreprod
```

### Promotion vers `vpreprod` puis `vprod`

Merger les PR sur GitHub dans l’ordre : **vdev → vpreprod**, puis **vpreprod → vprod** (valider le draft).

---

## Dépannage

### Les CD ne créent pas de PR

1. Vérifier que les jobs CI sont verts
2. Permissions GitHub Actions (création de PR)
3. Workflow manuel **Create promotion PR** si besoin

### Harbor non configuré

Les jobs Docker sont ignorés ; le reste de la CI peut rester vert.

---

## Bonnes pratiques

1. Éviter les pushes directs sur `vpreprod` / `vprod` si votre équipe impose les PR.
2. Attendre la CI verte avant de merger les PR de promotion.
3. Revue de code pour `vpreprod` → `vprod`.

---

_Dernière mise à jour : 2026-04_
