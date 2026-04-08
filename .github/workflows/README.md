# 📋 Documentation des Workflows CI/CD

## 🎯 Architecture globale

Le projet utilise **une CI monorepo** + **déploiement VPS** + **workflows manuels** :

1. **`ci.yml` — CI — Monorepo (server + client)** : **seul** workflow CI déclenché automatiquement sur push/PR pour **`vdev`**, **`vpreprod`**, **`vprod`** (namespaces alignés CD) ainsi que **`dev`**, **`preprod`**, **`prod`**. Ordre des jobs : **1** qualité backend · **1** qualité frontend (parallèle) → **2** image `api` · **2** image `client` + Harbor/Trivy (parallèle) → **3** commentaire PR / PR de promotion.
2. **`ci-server.yml` / `ci-client.yml`** : conservés en **`workflow_dispatch` uniquement** (relance manuelle ou debug), plus de doublon sur push.
3. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — se déclenchent **après** une exécution **réussie** de `CI — Monorepo` sur un **push** vers `vdev` / `vpreprod` / `vprod` (événement `workflow_run`), ou via **`workflow_dispatch`**. Plus de déploiement sur un simple push sans CI verte. **Important** : la version des fichiers workflow utilisée pour le `workflow_run` est celle de la **branche par défaut** du dépôt — gardez-y les mêmes définitions à jour.
4. **Create promotion PR (manual)** : secours si la PR automatique n’a pas été créée.

**Harbor (CI)** : même convention que les `deploy-v*.yml` — secret **`HARBOR_REGISTRY_BASE`** (hôte seul), projets **`vdev` / `vpreprod` / `vprod`** (ou équivalent pour `dev`/`preprod`/`prod`), images **`api`** et **`client`** taguées par le SHA du commit.

---

## 🌳 Flux par branche

### 🔵 Branches `vdev` ou `dev` (développement)

**Déclenchement** : `git push origin vdev` (ou `dev`)

**Pipeline** : **`CI — Monorepo`** — sur `vdev`/`dev` : lint/tests complets (si scripts présents), build client, puis images Docker `api` + `client`.

**Résultat** :
- Si tout est vert → **PR automatique** `vdev` → `vpreprod` ou `dev` → `preprod` (selon la branche).

---

### 🟡 Branches `vpreprod` ou `preprod`

**Déclenchement** : push ou merge sur `vpreprod` / `preprod`

**Pipeline** : suite qualité **allégée** (pas de lint/tests complets sauf sur `vdev`/`dev`), build + images Docker.

**Résultat** :
- Si tout est vert → **PR automatique** `vpreprod` → `vprod` ou `preprod` → `prod` (**brouillon** sauf promotion depuis `vdev`/`dev`).

---

### 🔴 Branches `vprod` ou `prod`

**Déclenchement** : push sur `vprod` / `prod`

**Pipeline** : même logique « allégée » + images ; **aucune** PR de promotion automatique (fin du flux).

---

## 🔍 Détail des jobs CI (`ci.yml`)

| Job | Rôle |
|-----|------|
| `server-quality` | `npm ci`, lint (`--if-present`), Jest + couverture sur `vdev`/`dev` (et PR vers ces bases) |
| `client-quality` | `npm ci`, lint/tests/E2E si présents dans `package.json`, build Vite |
| `server-docker` | Build/push **`{HARBOR_REGISTRY_BASE}/{projet}/api:SHA`**, scan Harbor |
| `client-docker` | Build/push **`…/client:SHA`** avec URLs Vite alignées CD |
| `notify-pr` | Commentaire de synthèse sur les PR |
| `create-promotion-pr` | PR `vdev→vpreprod`, `vpreprod→vprod`, `dev→preprod`, `preprod→prod` |

## 🔄 Promotion automatique

Un seul job **`create-promotion-pr`** dans **`ci.yml`**, après succès des jobs qualité + Docker. Plus de double workflow Server/Client.

---

## ⚙️ Configuration requise

### Secrets GitHub

```yaml
HARBOR_REGISTRY_BASE: harbor.example.com   # hôte seul, comme pour deploy-v*.yml
HARBOR_USERNAME: robot$thetiptop
HARBOR_PASSWORD: ***
# Optionnel (anciens dépôts) : HARBOR_REGISTRY si BASE absent
```

### Permissions GitHub Actions

Dans **Settings → Actions → General → Workflow permissions** :
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

---

## 🚀 Utilisation quotidienne

### Développement normal (branche `vdev`)

```bash
git checkout vdev
git pull
git commit -am "feat: …"
git push origin vdev

# → Workflow « CI — Monorepo (server + client) »
# → Si tout est vert : PR vdev → vpreprod (brouillon : non)
```

Même principe avec la branche **`dev`** (PR vers **`preprod`**).

### Promotion vers preprod

```bash
# Merger la PR dev→preprod sur GitHub
# → CI Server + CI Client se lancent (version allégée)
# → Si tout est vert, PR preprod→prod créée automatiquement (draft)
```

### Mise en production

```bash
# 1. Convertir la PR preprod→prod de draft à ready
# 2. Merger la PR preprod→prod sur GitHub
# → CI Server + CI Client se lancent (version allégée)
# → Images Docker taguées "prod"
```

---

## 🐛 Dépannage

### Les CD ne créent pas de PR

**Symptôme** : CI vertes mais pas de PR créée

**Solutions** :
1. Vérifier que les 2 CI (Server + Client) sont bien vertes
2. Vérifier les logs des workflows CD - Server et CD - Client
3. Vérifier les permissions GitHub Actions (voir Configuration)

### Les tests E2E prennent trop de temps

**Optimisations appliquées** :
- ✅ Cache des navigateurs Playwright
- ✅ Exécution Chromium uniquement en CI (au lieu de 3 navigateurs)
- ✅ Retries réduits à 1 en CI (au lieu de 2)

### Harbor non configuré

Si les secrets Harbor ne sont pas définis :
- Les jobs Docker sont skippés automatiquement
- Les CI restent vertes
- Aucun impact sur les promotions

---

## 📊 Temps d'exécution moyens

| Pipeline | dev | preprod/prod |
|----------|-----|--------------|
| CI - Server | ~3-5 min | ~2-3 min |
| CI - Client | ~5-8 min | ~2-3 min |
| CD - Server | ~30 sec | ~30 sec |
| CD - Client | ~30 sec | ~30 sec |

---

## 🎯 Bonnes pratiques

1. **Ne jamais push directement sur `preprod` ou `prod`**
   - Toujours passer par les PR automatiques

2. **Attendre que les 2 CI soient vertes avant de merger**
   - Les PR sont créées automatiquement quand c'est le cas

3. **Revue de code obligatoire pour preprod→prod**
   - La PR est en draft pour forcer une validation manuelle

4. **Tester en preprod avant prod**
   - Environnement identique à la production

---

_Dernière mise à jour : 2026-02-25_
