# Documentation des workflows CI/CD

## Architecture globale

Le projet utilise **deux workflows CI** (Backend puis Frontend) + **déploiement VPS** + **workflows manuels** :

1. **`ci-backend.yml` — CI — Backend** : déclenché sur **push / PR** vers **`vdev`**, **`vpreprod`**, **`vprod`**. Jobs : qualité → unit → integration → functional → build → package image **`api`** (Harbor si configuré).
2. **`ci-frontend.yml` — CI — Frontend** : déclenché **uniquement après la fin** du workflow **`CI — Backend`** (`workflow_run`, types `completed`). Si le Backend est **vert**, enchaîne : qualité → unit → integration → functional → build → package image **`client`** ; commentaire PR en fin de chaîne si PR.
3. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — push (ou manuel). Le **`gate`** attend **les deux CI vertes** sur le même commit (Backend `event: push` + Frontend `event: workflow_run`). Les PR **[Promotion]** (brouillon) : job **`4 · PR promotion`** — `.github/scripts/open-promotion-pr-after-cd.cjs`.
4. **`create-promotion-pr.yml`** : secours manuel si besoin.

**Harbor (CI)** : secret **`HARBOR_REGISTRY_BASE`**, projets **`vdev` / `vpreprod` / `vprod`**, images **`api`** et **`client`** taguées par le SHA du commit.

**Scan Trivy dans Harbor** : si l’API renvoie `no available scanner` / `PRECONDITION`, configure un scanner sous **Harbor → Administration → Scanners** (ou ignore l’étape) — la CI reste verte.

### Conventions Git

- **Messages de commit** : en **français**, forme claire.

---

## Flux par branche (`vdev` / `vpreprod` / `vprod`)

### Branche `vdev` (développement)

**Déclenchement** : `git push origin vdev`

**Pipeline** : **CI Backend** puis **CI Frontend** ; images Docker `api` + `client` si Harbor configuré.

**Résultat** : les deux CI vertes, puis **CD / vdev** (déploiement). Si le CD est vert → **PR brouillon** `vdev` → `vpreprod` (job final du workflow CD).

---

### Branche `vpreprod`

**Déclenchement** : push ou merge sur `vpreprod`

**Résultat** : CI Backend + Frontend puis **CD / vpreprod** ; si le CD est vert → **PR brouillon** `vpreprod` → `vprod`.

---

### Branche `vprod`

**Déclenchement** : push sur `vprod`

**Résultat** : CI Backend + Frontend ; **CD / vprod** ; **aucune** PR de promotion automatique (fin du flux).

---

## Détail des jobs CI

| Fichier | Rôle |
|--------|------|
| `ci-backend.yml` | `server/` : lint, tests, build, image **`api`** |
| `ci-frontend.yml` | `client/` : lint, tests, build, image **`client`** (après Backend OK) |

**PR de promotion** : jobs **`open-promotion-pr`** dans **`deploy-vdev.yml`** et **`deploy-vpreprod.yml`** (après **`deploy-vps`**).

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

### Branch protection

Mettre à jour les **checks requis** : remplacer l’ancienne **CI Monorepo** par **`CI — Backend`** et **`CI — Frontend`** (les deux doivent être verts).

---

## Utilisation quotidienne

### Développement (`vdev`)

```bash
git checkout vdev
git pull
git commit -am "feat: …"
git push origin vdev
# → CI Backend puis CI Frontend ; CD vdev ; si CD vert : PR brouillon vdev → vpreprod
```

### Promotion vers `vpreprod` puis `vprod`

Merger les PR sur GitHub dans l’ordre : **vdev → vpreprod**, puis **vpreprod → vprod** (valider le draft).

---

## Dépannage

### Les CD ne créent pas de PR

1. Vérifier que **Backend** et **Frontend** sont verts sur le commit
2. Permissions GitHub Actions (création de PR)
3. Workflow manuel **Create promotion PR** si besoin

### Harbor non configuré

Les jobs Docker sont ignorés ; le reste de la CI peut rester vert.

---

## Bonnes pratiques

1. Éviter les pushes directs sur `vpreprod` / `vprod` si votre équipe impose les PR.
2. Attendre les deux CI vertes avant de merger les PR de promotion.
3. Revue de code pour `vpreprod` → `vprod`.

---

_Dernière mise à jour : 2026-04_
