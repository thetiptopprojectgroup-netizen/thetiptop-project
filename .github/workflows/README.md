# Documentation des workflows CI/CD

## Architecture globale

Le projet utilise **trois pipelines visibles** dans Actions + **workflows manuels** :

1. **`ci-backend.yml` — CI — Backend** : **push / PR** (`vdev`, `vpreprod`, `vprod`) — jobs serveur + image **`api`**.
2. **`ci-frontend.yml` — CI — Frontend** : déclenché par **`workflow_run`** après une exécution **réussie** de **CI — Backend** sur la même branche ; appelle **`ci-frontend-reusable.yml`** (jobs client + image **`client`**). Si le backend échoue, le workflow frontend échoue au job « Backend requis ».
3. **CD VPS** (`deploy-vdev.yml`, etc.) : déclenché par **`workflow_run`** après un run **réussi** de **CI — Frontend** sur la branche cible (plus de **push** parallèle à la CI).
4. **`create-promotion-pr.yml`** : secours manuel si besoin.

**Contrainte GitHub** : les workflows utilisant `workflow_run` (`ci-frontend.yml`, CD) doivent exister sur la **branche par défaut** du dépôt pour être actifs.

**Harbor (CI)** : secret **`HARBOR_REGISTRY_BASE`**, projets **`vdev` / `vpreprod` / `vprod`**, images **`api`** et **`client`** taguées par le SHA du commit.

**Scan Trivy dans Harbor** : si l’API renvoie `no available scanner` / `PRECONDITION`, configure un scanner sous **Harbor → Administration → Scanners** (ou ignore l’étape) — la CI reste verte.

### Conventions Git

- **Messages de commit** : en **français**, forme claire.

---

## Flux par branche (`vdev` / `vpreprod` / `vprod`)

### Branche `vdev` (développement)

**Déclenchement** : `git push origin vdev`

**Pipeline** : **CI — Backend** → **CI — Frontend** → **CD / vdev** (chaque étape après succès de la précédente).

**Résultat** : les trois workflows verts sur le même commit ; si le **CD / vdev** est vert → **PR brouillon** `vdev` → `vpreprod` (job final du workflow CD).

---

### Branche `vpreprod`

**Déclenchement** : push ou merge sur `vpreprod`

**Résultat** : **CI — Backend** → **CI — Frontend** → **CD / vpreprod** ; si le CD est vert → **PR brouillon** `vpreprod` → `vprod`.

---

### Branche `vprod`

**Déclenchement** : push sur `vprod`

**Résultat** : **CI — Backend** → **CI — Frontend** → **CD / vprod** ; **aucune** PR de promotion automatique (fin du flux).

---

## Détail des jobs CI

| Fichier | Rôle |
|--------|------|
| `ci-backend.yml` | `server/` : lint, tests, build, image **`api`** |
| `ci-frontend.yml` | Déclencheur `workflow_run` → appelle **`ci-frontend-reusable.yml`** |
| `ci-frontend-reusable.yml` | `client/` : lint, tests, build, image **`client`** |

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

Checks requis : **`CI — Backend`** et **`CI — Frontend`**.

---

## Utilisation quotidienne

### Développement (`vdev`)

```bash
git checkout vdev
git pull
git commit -am "feat: …"
git push origin vdev
# → CI Backend → CI Frontend → CD vdev ; si CD vert : PR brouillon vdev → vpreprod
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
