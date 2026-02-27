# 🏗️ Architecture CI/CD - ThéTipTop

## 📊 Vue d'ensemble

Le projet utilise **4 pipelines GitHub Actions distincts** pour garantir la qualité du code et automatiser les déploiements :

```
┌─────────────────────────────────────────────────────────────┐
│                      PUSH sur dev                           │
└─────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │  CI - Server (B)    │   │  CI - Client (F)    │
    │  ─────────────────  │   │  ─────────────────  │
    │  • Lint ✓           │   │  • Lint ✓           │
    │  • Tests ✓          │   │  • Tests ✓          │
    │  • Docker ✓         │   │  • E2E ✓            │
    │  • Scan ✓           │   │  • Docker ✓         │
    └─────────┬───────────┘   └─────────┬───────────┘
              │                         │
              └────────────┬────────────┘
                           │
                    ✅ Les 2 vertes ?
                           │
                           ▼
              ┌─────────────────────────┐
              │  CD - Server / Client   │
              │  ─────────────────────  │
              │  Créer PR dev→preprod   │
              └─────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  PR créée ✓    │
                  └────────────────┘
```

---

## 🎯 Principes de conception

### 1. **4 Pipelines distincts et visibles**
- ✅ CI - Server (Backend)
- ✅ CI - Client (Frontend)
- ✅ CD - Server (Backend)
- ✅ CD - Client (Frontend)

### 2. **Pipeline complet sur `dev`, allégé sur `preprod`/`prod`**
- **dev** : Lint + Tests + E2E + Build + Docker + Scan
- **preprod/prod** : Build + Docker + Scan uniquement

### 3. **Promotion automatique intelligente**
- Les CD vérifient que **les 2 CI** (Server + Client) ont réussi
- Une seule PR est créée (le premier CD qui termine)
- L'autre CD détecte la PR existante et se termine proprement

### 4. **Pas de polling, pas d'attente active**
- Les CD s'exécutent immédiatement après leur CI respective
- Ils vérifient l'état de l'autre CI via l'API GitHub
- Si l'autre CI n'est pas encore terminée, le CD se termine sans erreur
- Le second CD (celui qui termine en dernier) crée la PR

---

## 📁 Structure des workflows

```
.github/workflows/
├── ci-server.yml       # CI Backend (4 jobs)
│   ├── server-ci                      # Tests & qualité (dev only)
│   ├── server-docker-build-and-scan   # Build Docker (all branches)
│   ├── notify-server                  # Notification (all branches)
│   └── create-promotion-pr            # Création PR (dev, preprod)
│
├── ci-client.yml       # CI Frontend (4 jobs)
│   ├── client-ci                      # Tests & qualité (dev only)
│   ├── client-docker-build-and-scan   # Build Docker (all branches)
│   ├── notify-client                  # Notification (all branches)
│   └── create-promotion-pr            # Création PR (dev, preprod)
│
├── cd-server.yml       # CD Backend (1 job)
│   └── cd-server                      # Vérifier 2 CI + créer PR
│
├── cd-client.yml       # CD Frontend (1 job)
│   └── cd-client                      # Vérifier 2 CI + créer PR
│
└── README.md           # Documentation utilisateur
```

---

## 🔄 Flux détaillé par branche

### 🔵 Branche `dev` (Développement)

#### Déclenchement
```bash
git push origin dev
```

#### Exécution
1. **CI - Server** démarre (4 jobs)
   - `server-ci` : Lint ESLint + Tests Jest
   - `server-docker-build-and-scan` : Build + Push + Scan
   - `notify-server` : Notification
   - `create-promotion-pr` : Vérifie si CI Client est verte

2. **CI - Client** démarre (4 jobs)
   - `client-ci` : Lint + Tests Jest/RTL + E2E Playwright
   - `client-docker-build-and-scan` : Build + Push + Scan
   - `notify-client` : Notification
   - `create-promotion-pr` : Vérifie si CI Server est verte

3. **CD - Server** démarre après CI Server
   - Vérifie que CI Server ET CI Client sont vertes
   - Crée PR `dev` → `preprod` si les 2 sont OK

4. **CD - Client** démarre après CI Client
   - Vérifie que CI Server ET CI Client sont vertes
   - Crée PR `dev` → `preprod` si les 2 sont OK (ou détecte PR existante)

#### Résultat
- ✅ 4 pipelines visibles dans l'interface GitHub Actions
- ✅ PR automatique `dev` → `preprod` créée (draft: false)
- ✅ Pas de duplication (le second CD détecte la PR existante)

---

### 🟡 Branche `preprod` (Pré-production)

#### Déclenchement
```bash
# Merge de la PR dev→preprod sur GitHub
```

#### Exécution
1. **CI - Server** démarre (jobs allégés)
   - `server-ci` : **Skippé** (lint/tests uniquement sur dev)
   - `server-docker-build-and-scan` : Build + Push + Scan
   - `notify-server` : Notification
   - `create-promotion-pr` : Vérifie si CI Client est verte

2. **CI - Client** démarre (jobs allégés)
   - `client-ci` : **Skippé** (lint/tests/E2E uniquement sur dev)
   - `client-docker-build-and-scan` : Build + Push + Scan
   - `notify-client` : Notification
   - `create-promotion-pr` : Vérifie si CI Server est verte

3. **CD - Server** et **CD - Client** créent la PR `preprod` → `prod`

#### Résultat
- ✅ Pipeline allégé (pas de lint/tests/E2E)
- ✅ PR automatique `preprod` → `prod` créée (draft: **true**)
- ⚠️ PR en mode brouillon pour forcer une revue manuelle

---

### 🔴 Branche `prod` (Production)

#### Déclenchement
```bash
# 1. Convertir la PR preprod→prod de draft à ready
# 2. Merger la PR preprod→prod sur GitHub
```

#### Exécution
1. **CI - Server** et **CI - Client** exécutent les builds Docker
2. **CD - Server** et **CD - Client** ne font rien (branche prod)

#### Résultat
- ✅ Images Docker taguées `prod`
- ✅ Prêt pour déploiement

---

## 🛠️ Logique de création de PR

### Dans les CI (jobs `create-promotion-pr`)

```javascript
// 1. Vérifier que notre propre CI a réussi (via needs)
if (needs.server-ci.result !== 'success') return;

// 2. Récupérer les workflows CI via l'API
const serverCi = workflows.find(w => w.name === 'CI - Server (Backend)');
const clientCi = workflows.find(w => w.name === 'CI - Client (Frontend)');

// 3. Récupérer les runs pour ce commit (head_sha)
const allRuns = await github.rest.actions.listWorkflowRunsForRepo({
  owner, repo, head_sha, per_page: 50
});

// 4. Vérifier que les 2 CI ont réussi
if (serverRun?.conclusion !== 'success') return; // Attend CI Server
if (clientRun?.conclusion !== 'success') return; // Attend CI Client

// 5. Vérifier qu'aucune PR n'existe déjà
const pulls = await github.rest.pulls.list({ owner, repo, state: 'open', base, head });
if (pulls.length > 0) return; // PR déjà créée

// 6. Créer la PR
await github.rest.pulls.create({ owner, repo, head, base, title, body, draft });
```

### Dans les CD (jobs `cd-server` / `cd-client`)

Logique identique, mais déclenchée par `push` au lieu de `needs`.

---

## 🔐 Permissions requises

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

### Permissions dans les workflows
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
  actions: read
```

---

## ⚡ Optimisations appliquées

### 1. **Cache Playwright**
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('client/package-lock.json') }}
```

### 2. **E2E Chromium uniquement en CI**
```yaml
- run: npx playwright install chromium --with-deps
  env:
    E2E_BROWSER: chromium
```

### 3. **Retries réduits en CI**
```javascript
// playwright.config.cjs
retries: process.env.CI ? 1 : 0
```

### 4. **Build Docker avec retry**
```bash
for attempt in 1 2 3; do
  if docker build ...; then exit 0; fi
  sleep 45
done
```

---

## 📊 Temps d'exécution estimés

| Pipeline | dev | preprod/prod |
|----------|-----|--------------|
| CI - Server | ~3-5 min | ~2-3 min |
| CI - Client | ~5-8 min | ~2-3 min |
| CD - Server | ~30 sec | ~30 sec |
| CD - Client | ~30 sec | ~30 sec |
| **Total** | ~8-13 min | ~4-6 min |

---

## 🐛 Dépannage

### Les CD ne créent pas de PR

**Symptôme** : CI vertes mais pas de PR créée

**Solutions** :
1. Vérifier les logs des jobs `create-promotion-pr` dans les CI
2. Vérifier les logs des CD
3. Vérifier que les permissions GitHub Actions sont activées
4. Vérifier que les 2 CI (Server + Client) sont bien vertes pour le même commit

### Les 2 CD créent 2 PR

**Symptôme** : Duplication de PR

**Cause** : Race condition (les 2 CD terminent exactement en même temps)

**Solution** : GitHub retourne une erreur 422 "already exists" pour le second, qui est ignorée

### Les tests E2E prennent trop de temps

**Solutions appliquées** :
- ✅ Cache Playwright
- ✅ Chromium uniquement en CI
- ✅ Retries réduits

---

## 📝 Checklist de validation

- [x] 4 pipelines distincts visibles dans GitHub Actions
- [x] Pipeline complet sur `dev` (lint, tests, E2E)
- [x] Pipeline allégé sur `preprod`/`prod` (pas de lint/tests/E2E)
- [x] PR automatique `dev` → `preprod` créée quand les 2 CI sont vertes
- [x] PR automatique `preprod` → `prod` créée quand les 2 CI sont vertes
- [x] Pas de duplication de PR
- [x] Pas de polling/attente active
- [x] Permissions GitHub Actions configurées
- [x] Secrets Harbor configurés
- [x] Documentation complète

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

5. **Monitorer les scans Harbor**
   - Vérifier les vulnérabilités avant de merger

---

_Architecture validée le 2026-02-25_
