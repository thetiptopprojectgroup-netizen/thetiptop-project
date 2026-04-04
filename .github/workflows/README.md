# 📋 Documentation des Workflows CI/CD

## 🎯 Architecture globale

Le projet utilise **CI** + **déploiement VPS** + **1 workflow manuel** :

1. **CI - Server (Backend)** : Tests, lint, build Docker backend + création PR de promotion en fin de run
2. **CI - Client (Frontend)** : Tests, lint, E2E, build Docker frontend + création PR de promotion en fin de run
3. **CD VPS** : `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` — build images, push Harbor, SSH + Docker Compose sur le VPS (Ansible / `infra/deploy`). **Pas de Kubernetes / kubectl.**
4. **Create promotion PR (manual)** : Création manuelle de la PR dev→preprod ou preprod→prod

---

## 🌳 Flux par branche

### 🔵 Branche `dev` (Développement)

**Déclenchement** : `git push origin dev`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline complet (lint, tests unitaires, build, Docker, scan) puis job « Créer PR promotion » si les 2 CI sont vertes
- ✅ **CI - Client** : Pipeline complet (lint, tests unitaires, E2E Playwright, build, Docker, scan) puis job « Créer PR promotion » si les 2 CI sont vertes

**Résultat** :
- Si les 2 CI passent → **PR automatique `dev` → `preprod`** (draft: false)
- La PR est créée par le job `create-promotion-pr` du premier pipeline CI qui termine (Server ou Client) une fois les 2 CI vertes

---

### 🟡 Branche `preprod` (Pré-production)

**Déclenchement** : Merge de la PR `dev` → `preprod`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline allégé (build, Docker, scan uniquement - **pas de lint/tests**) puis job « Créer PR promotion » si les 2 CI sont vertes
- ✅ **CI - Client** : Pipeline allégé (build, Docker, scan uniquement - **pas de lint/E2E**) puis job « Créer PR promotion » si les 2 CI sont vertes

**Résultat** :
- Si les **2 CI** passent sur `preprod` → **PR automatique `preprod` → `prod`** (draft: true)
- La PR est créée par le job `create-promotion-pr` du pipeline CI qui termine en dernier (il voit alors les 2 CI vertes)
- Si la PR n’apparaît pas : **Actions** → **Create promotion PR (manual)** → Run workflow → branche **preprod**

---

### 🔴 Branche `prod` (Production)

**Déclenchement** : Merge de la PR `preprod` → `prod`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline allégé (build, Docker, scan uniquement)
- ✅ **CI - Client** : Pipeline allégé (build, Docker, scan uniquement)
- Le job « Créer PR promotion » dans chaque CI ne fait rien sur `prod` (rien à promouvoir)

**Résultat** :
- Images Docker taguées avec le SHA du commit et `prod`
- Déploiement manuel ou automatique selon votre configuration

---

## 🔍 Détail des jobs CI

### CI - Server (Backend)

| Job | Branches | Description |
|-----|----------|-------------|
| `server-ci` | Toutes | Tests Jest, lint ESLint (dev uniquement) |
| `server-docker-build-and-scan` | Toutes | Build image, push Harbor, scan Trivy |
| `notify-server` | Toutes | Notification du statut global |
| `create-promotion-pr` | dev, preprod | Crée PR si les 2 CI sont vertes |

### CI - Client (Frontend)

| Job | Branches | Description |
|-----|----------|-------------|
| `client-ci` | Toutes | Lint, tests Jest/RTL, E2E Playwright (dev uniquement) |
| `client-docker-build-and-scan` | Toutes | Build image, push Harbor, scan Trivy |
| `notify-client` | Toutes | Notification du statut global |
| `create-promotion-pr` | dev, preprod | Crée PR si les 2 CI sont vertes |

---

## 🔄 Logique de promotion automatique

Le job **create-promotion-pr** (dans **CI - Server** et **CI - Client**) :

1. S’exécute en fin de chaque pipeline CI (Server et Client), uniquement sur les branches `dev` et `preprod`
2. **Vérifie** que les 2 CI (Server + Client) sont vertes pour le même commit
3. **Vérifie** qu’aucune PR ouverte n’existe déjà pour cette promotion
4. **Crée** la PR si tout est OK :
   - `dev` → `preprod` : PR normale (draft: false)
   - `preprod` → `prod` : PR en brouillon (draft: true)

### Gestion de la concurrence

- Les 2 pipelines CI s’exécutent en parallèle ; chacun a un job `create-promotion-pr` en fin de run
- Celui qui termine **après** que les 2 CI soient vertes crée la PR ; l’autre voit que les 2 CI ne sont pas encore vertes ou que la PR existe déjà
- Si la PR preprod→prod n’apparaît pas : **Actions** → **Create promotion PR (manual)** → Run workflow → branche **preprod**. Si le workflow indique « Aucun commit à promouvoir », faire un nouveau merge dev→preprod pour avoir des commits à promouvoir

---

## ⚙️ Configuration requise

### Secrets GitHub

```yaml
HARBOR_REGISTRY: registry.example.com
HARBOR_USERNAME: robot$thetiptop
HARBOR_PASSWORD: ***
```

### Permissions GitHub Actions

Dans **Settings → Actions → General → Workflow permissions** :
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

---

## 🚀 Utilisation quotidienne

### Développement normal

```bash
# Travailler sur dev
git checkout dev
git pull
# ... faire vos modifications ...
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin dev

# → CI Server + CI Client se lancent automatiquement
# → Si tout est vert, PR dev→preprod créée automatiquement
```

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
