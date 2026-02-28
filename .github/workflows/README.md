# 📋 Documentation des Workflows CI/CD

## 🎯 Architecture globale

Le projet utilise **4 pipelines distincts** pour orchestrer le cycle de vie du code :

1. **CI - Server (Backend)** : Tests, lint, build Docker backend
2. **CI - Client (Frontend)** : Tests, lint, E2E, build Docker frontend  
3. **CD - Server (Backend)** : Promotion automatique (création PR)
4. **CD - Client (Frontend)** : Promotion automatique (création PR)

---

## 🌳 Flux par branche

### 🔵 Branche `dev` (Développement)

**Déclenchement** : `git push origin dev`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline complet (lint, tests unitaires, build, Docker, scan)
- ✅ **CI - Client** : Pipeline complet (lint, tests unitaires, E2E Playwright, build, Docker, scan)
- 🔄 **CD - Server** : Attend que CI Server ET CI Client soient verts
- 🔄 **CD - Client** : Attend que CI Server ET CI Client soient verts

**Résultat** :
- Si les 2 CI passent → **PR automatique `dev` → `preprod`** (draft: false)
- La PR est créée par le premier CD qui termine (Server ou Client)
- L'autre CD détecte la PR existante et se termine avec succès

---

### 🟡 Branche `preprod` (Pré-production)

**Déclenchement** : Merge de la PR `dev` → `preprod`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline allégé (build, Docker, scan uniquement - **pas de lint/tests**)
- ✅ **CI - Client** : Pipeline allégé (build, Docker, scan uniquement - **pas de lint/E2E**)
- 🔄 **CD - Server** : Attend que CI Server ET CI Client soient verts
- 🔄 **CD - Client** : Attend que CI Server ET CI Client soient verts

**Résultat** :
- Si les **2 CI** passent sur `preprod` → **PR automatique `preprod` → `prod`** (draft: true)
- La PR est créée par le **dernier** des deux CD qui termine (car il voit alors les 2 CI vertes)
- **Important** : après le merge, attendre que **CI - Server** et **CI - Client** soient toutes les deux vertes sur la branche `preprod` ; la PR preprod→prod apparaît ensuite (ou relancer manuellement le workflow CD avec « Promouvoir »)

---

### 🔴 Branche `prod` (Production)

**Déclenchement** : Merge de la PR `preprod` → `prod`

**Pipelines exécutés** :
- ✅ **CI - Server** : Pipeline allégé (build, Docker, scan uniquement)
- ✅ **CI - Client** : Pipeline allégé (build, Docker, scan uniquement)
- ⏹️ **CD - Server** : Ne s'exécute pas (rien à promouvoir)
- ⏹️ **CD - Client** : Ne s'exécute pas (rien à promouvoir)

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

Les workflows **CD - Server** et **CD - Client** :

1. **Attendent** que les 2 CI (Server + Client) soient terminées avec succès
2. **Vérifient** qu'aucune PR n'existe déjà pour cette promotion
3. **Créent** la PR automatiquement :
   - `dev` → `preprod` : PR normale (draft: false)
   - `preprod` → `prod` : PR en brouillon (draft: true)

### Gestion de la concurrence

- Les 2 CD (Server et Client) s'exécutent en parallèle (déclenchés par la fin de chaque CI). Chaque CD attend jusqu'à 60 s et réessaie une fois si l'autre CI n'est pas encore marquée succès.
- Les jobs « Créer PR promotion » dans les CI (Server et Client) attendent aussi 60 s et réessaient une fois si l'autre CI n'est pas verte, pour limiter les cas où aucune PR n'est créée.
- Celui qui voit les 2 CI vertes crée la PR ; l'autre voit que la PR existe déjà ou que les 2 CI ne sont pas encore vertes.
- **Important** : quand le CD est déclenché par `workflow_run`, GitHub exécute le workflow depuis la **branche par défaut** du dépôt. Pour que la PR preprod→prod soit créée, les fichiers des workflows CD (et CI) doivent être à jour sur la branche par défaut (souvent `main` ou `dev`).
- Si la PR preprod→prod n'apparaît pas : vérifier que les 2 CI sont vertes sur `preprod`, puis relancer **Actions** → **CD - Server** ou **CD - Client** → **Run workflow** (branche `preprod`, option Promouvoir).

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
