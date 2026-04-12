# Documentation des workflows CI/CD

## Architecture globale

Le projet utilise **une CI monorepo** + **déploiement VPS** + **workflows manuels** :

1. **`ci.yml` — CI — Monorepo (server + client)** : seul workflow CI déclenché automatiquement sur push/PR pour **`vdev`**, **`vpreprod`**, **`vprod`**. Ordre des jobs : qualité → tests → build → package (images Docker Harbor si configuré) → commentaire sur PR.
2. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — push sur la branche correspondante (ou manuel). Le job **`gate`** n’attend que le run CI **`event: push`** (pas un run `pull_request` sur une PR ouverte), pour éviter un CD alors que le run **push** est encore rouge. **PR de promotion** : après déploiement VPS réussi + contrôle des jobs CI/CD (voir workflows).
3. **`create-promotion-pr.yml`** : secours manuel si la PR automatique (post-CD) n’a pas été créée.

**Harbor (CI)** : secret **`HARBOR_REGISTRY_BASE`**, projets **`vdev` / `vpreprod` / `vprod`**, images **`api`** et **`client`** taguées par le SHA du commit.

**Scan Trivy dans Harbor** : si l’API renvoie `no available scanner` / `PRECONDITION`, configure un scanner sous **Harbor → Administration → Scanners** (ou ignore l’étape) — la CI reste verte.

### Conventions Git

- **Messages de commit** : en **français**, forme claire.

---

## Flux par branche (`vdev` / `vpreprod` / `vprod`)

### Branche `vdev` (développement)

**Déclenchement** : `git push origin vdev`

**Pipeline** : **`CI — Monorepo`** — lint/tests complets (si scripts présents), build client, puis images Docker `api` + `client`.

**Résultat** : CI verte, puis **CD / vdev** (déploiement). Si le CD est vert → **PR brouillon** `vdev` → `vpreprod` (job final du workflow CD, pas la CI seule).

---

### Branche `vpreprod`

**Déclenchement** : push ou merge sur `vpreprod`

**Pipeline** : suite qualité **allégée** (lint/tests complets surtout sur `vdev`), build + images Docker.

**Résultat** : CI puis **CD / vpreprod** ; si le CD est vert → **PR brouillon** `vpreprod` → `vprod`.

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

**PR de promotion** : jobs **`promotion-pr`** dans **`deploy-vdev.yml`** et **`deploy-vpreprod.yml`** (après **`deploy-vps`**), pas dans `ci.yml`.

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
# → CI puis CD vdev ; si CD vert : PR brouillon vdev → vpreprod
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
