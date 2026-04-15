# Documentation des workflows CI/CD

## Architecture globale

Le projet utilise **deux workflows CI** (backend / frontend) + **déploiement VPS** + **workflows manuels** :

1. **`ci-server.yml` — CI — Server** : API Node (`server/`). Push/PR sur **`vdev`**, **`vpreprod`**, **`vprod`**. Jobs : qualité → tests → build → image Docker **`api`** (Harbor si configuré) → commentaire PR.
2. **`ci-client.yml` — CI — Client** : SPA React (`client/`). Mêmes branches. Jobs : qualité → tests → build Vite (+ SSR) → image **`client`** → commentaire PR.
3. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — push (ou manuel). Le **`gate`** attend uniquement **`CI — Client`** verte sur le commit : le workflow client commence par une **attente active** jusqu’à succès de **`CI — Server`**, puis enchaîne lint/tests/build ; quand **`CI — Client`** est entièrement verte, le CD peut démarrer (le backend a déjà été validé). Les PR **[Promotion]** (brouillon) sont ouvertes par le job **`4 · PR promotion`** à la fin du CD dès que **CI + CD** sont verts — `.github/scripts/open-promotion-pr-after-cd.cjs`.
4. **`create-promotion-pr.yml`** : secours manuel si besoin.

**Harbor (CI)** : secret **`HARBOR_REGISTRY_BASE`**, projets **`vdev` / `vpreprod` / `vprod`**, images **`api`** et **`client`** taguées par le SHA du commit.

**Scan Trivy dans Harbor** : si l’API renvoie `no available scanner` / `PRECONDITION`, configure un scanner sous **Harbor → Administration → Scanners** (ou ignore l’étape) — la CI reste verte.

### Conventions Git

- **Messages de commit** : en **français**, forme claire.

**Protection de branche GitHub** : si tu imposes des checks obligatoires, ajoute **`CI — Server`** et **`CI — Client`** (remplace l’ancien workflow monolithique unique).

---

## Flux par branche (`vdev` / `vpreprod` / `vprod`)

### Branche `vdev` (développement)

**Déclenchement** : `git push origin vdev`

**Pipeline** : **`CI — Server`** + **`CI — Client`** en parallèle — lint/tests, builds, images Docker `api` + `client`.

**Résultat** : les deux CI vertes, puis **CD / vdev** (déploiement). Si le CD est vert → **PR brouillon** `vdev` → `vpreprod` (job final du workflow CD, pas la CI seule).

---

### Branche `vpreprod`

**Déclenchement** : push ou merge sur `vpreprod`

**Pipeline** : même principe (deux workflows CI) + images Docker.

**Résultat** : CI puis **CD / vpreprod** ; si le CD est vert → **PR brouillon** `vpreprod` → `vprod`.

---

### Branche `vprod`

**Déclenchement** : push sur `vprod`

**Pipeline** : deux CI + images ; **aucune** PR de promotion automatique (fin du flux).

---

## Détail des jobs CI

### `ci-server.yml`

| Étapes | Rôle |
|--------|------|
| Backend Quality → … → Build | `server/` : lint, tests, validation bootstrap |
| Package API Image | Push **`{registry}/{projet}/api:SHA`** si Harbor configuré |
| PR Feedback (backend) | Commentaire synthèse sur les PR |

### `ci-client.yml`

| Étapes | Rôle |
|--------|------|
| Frontend Quality → … → Build | `client/` : lint, tests, `npm run build` (client + SSR) |
| Package Client Image | Push **`…/client:SHA`** avec build-args Vite |
| PR Feedback (frontend) | Commentaire synthèse sur les PR |

**PR de promotion** : jobs **`promotion-pr`** dans **`deploy-vdev.yml`** et **`deploy-vpreprod.yml`** (après **`deploy-vps`**), pas dans les fichiers CI.

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
# → CI Server + CI Client puis CD vdev ; si CD vert : PR brouillon vdev → vpreprod
```

### Promotion vers `vpreprod` puis `vprod`

Merger les PR sur GitHub dans l’ordre : **vdev → vpreprod**, puis **vpreprod → vprod** (valider le draft).

---

## Dépannage

### Les CD ne créent pas de PR

1. Vérifier que **les deux** workflows CI sont verts sur le commit
2. Permissions GitHub Actions (création de PR)
3. Workflow manuel **Create promotion PR** si besoin

### Harbor non configuré

Les jobs Docker sont ignorés ; le reste de la CI peut rester vert.

---

## Bonnes pratiques

1. Éviter les pushes directs sur `vpreprod` / `vprod` si votre équipe impose les PR.
2. Attendre **CI Server et CI Client** vertes avant de merger les PR de promotion.
3. Revue de code pour `vpreprod` → `vprod`.

---

_Dernière mise à jour : 2026-04_
