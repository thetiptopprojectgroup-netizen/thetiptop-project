# Vault – Tout faire étape par étape

Guide pour activer la gestion des secrets avec HashiCorp Vault sur ton projet (dev, puis preprod/prod si tu veux).

---

## Étape 1 – Croiser que le code Vault est bien sur la branche

- Tu as les dossiers/fichiers : `k8s/vault/` (namespace, values, bootstrap-job, auth-reviewer-rbac, etc.).
- La branche où tu travailles (ex. `dev`) contient bien ces fichiers (push si besoin).

---

## Étape 2 – Créer un secret GitHub pour que le CD déploie Vault

Sans ce secret, le CD ne fera pas l’étape Vault.

1. Ouvre ton dépôt sur **GitHub**.
2. Va dans **Settings** → **Secrets and variables** → **Actions**.
3. Clique sur **New repository secret**.
4. **Name** : `VAULT_TOKEN`
5. **Value** : mets une valeur temporaire, par ex. `pending` (on la remplacera après l’init).
6. Enregistre.

Comme ça, au prochain déploiement, le CD va installer Vault (Helm) sur le cluster.

---

## Étape 3 – Déclencher le déploiement sur le cluster (ex. dev)

1. Fais un **push sur la branche** du cluster ciblé (ex. `dev`), **ou**
2. Va dans **Actions** → workflow **CD - Deploy (Kubernetes)** → **Run workflow** → choisis la branche (ex. `dev`) → **Run workflow**.

Attends que le job soit **vert**. À ce stade, Vault est installé mais **pas encore initialisé** (les pods peuvent être en attente ou redémarrer).

---

## Étape 4 – Vérifier que les pods Vault sont là

Avec ton **kubeconfig** pointant vers le bon cluster (dev) :

```bash
kubectl get pods -n vault
```

Tu dois voir au moins **vault-0** (et idéalement vault-1, vault-2). Si vault-0 est en `Running` ou en `CrashLoopBackOff`, on peut passer à l’init.

---

## Étape 5 – Initialiser Vault (une seule fois par cluster)

Toujours avec le kubeconfig du **même** cluster :

```bash
kubectl exec -n vault vault-0 -- vault operator init -format=json > vault-keys.json
```

- Le fichier **vault-keys.json** est créé sur ta machine.
- **Ne le commite jamais.** Garde-le en lieu sûr (et supprime-le après avoir noté le token et les clés si tu veux).

---

## Étape 6 – Récupérer le root token

**Sous Linux / macOS :**

```bash
cat vault-keys.json | jq -r '.root_token'
```

**Sous PowerShell (sans jq) :**

```powershell
(Get-Content vault-keys.json | ConvertFrom-Json).root_token
```

Copie la valeur affichée (le **token Vault**). Tu en auras besoin pour GitHub et pour désealer.

---

## Étape 7 – Désealer vault-0 (3 fois avec 3 clés différentes)

Dans **vault-keys.json**, il y a un tableau **unseal_keys_b64** (5 clés). Tu en utilises **3** pour désealer un nœud.

**Récupérer une clé (ex. la 1ère) :**

- Linux/macOS : `cat vault-keys.json | jq -r '.unseal_keys_b64[0]'`
- PowerShell : `(Get-Content vault-keys.json | ConvertFrom-Json).unseal_keys_b64[0]`

Puis exécute (remplace `<KEY1>` par la vraie clé) :

```bash
kubectl exec -n vault vault-0 -- vault operator unseal <KEY1>
```

Répète avec une **2e** puis une **3e** clé (indices 1 et 2). Après 3 unseal, vault-0 doit être désealé (tu peux vérifier avec `vault status` dans le pod).

---

## Étape 8 – Faire rejoindre et désealer vault-1 et vault-2

**vault-1 :**

```bash
kubectl exec -n vault vault-1 -- vault operator raft join http://vault-0.vault-internal:8200
kubectl exec -n vault vault-1 -- vault operator unseal <KEY1>
kubectl exec -n vault vault-1 -- vault operator unseal <KEY2>
kubectl exec -n vault vault-1 -- vault operator unseal <KEY3>
```

**vault-2 :**

```bash
kubectl exec -n vault vault-2 -- vault operator raft join http://vault-0.vault-internal:8200
kubectl exec -n vault vault-2 -- vault operator unseal <KEY1>
kubectl exec -n vault vault-2 -- vault operator unseal <KEY2>
kubectl exec -n vault vault-2 -- vault operator unseal <KEY3>
```

Utilise les **mêmes** 3 clés que pour vault-0. À la fin, les 3 pods Vault sont désealés et en cluster Raft.

---

## Étape 9 – Mettre le root token dans GitHub

1. GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Clique sur le secret **VAULT_TOKEN** → **Update**.
3. Colle la valeur du **root_token** (celle que tu as copiée à l’étape 6).
4. Enregistre.

Désormais, à chaque déploiement, le CD pourra lancer le **Job de bootstrap** qui configure Vault (KV, auth Kubernetes, policies, rôles) et y écrit les secrets (MongoDB, backend).

---

## Étape 10 – Relancer le déploiement pour lancer le bootstrap

1. Va dans **Actions** → **CD - Deploy (Kubernetes)** → **Run workflow**.
2. Choisis la branche (ex. `dev`) → **Run workflow**.

Quand le job est vert, le **bootstrap** a normalement tourné : les secrets sont dans Vault et les rôles/policies sont créés.

---

## Étape 11 – (Optionnel) Activer l’audit trail

Pour tracer les accès à Vault dans un fichier de log :

```bash
kubectl exec -n vault vault-0 -- vault login
# Colle le root_token quand demandé

kubectl exec -n vault vault-0 -- vault audit enable file file_path=/vault/audit/audit.log
```

Les logs sont écrits dans le volume monté sous `/vault/audit` (défini dans `k8s/vault/values.yaml`).

---

## Étape 12 – Activer l’injection Vault dans le namespace

Par défaut, l’injector Vault **n’injecte pas** (pour éviter de bloquer les pods si Vault n’est pas prêt). Une fois Vault init + unseal + bootstrap OK, ajoute le label :

```bash
kubectl label namespace thetiptop-dev vault-injection=enabled --overwrite
```

## Étape 13 – Vérifier que l’app reçoit bien les secrets

- Redémarre le backend et MongoDB pour forcer de nouveaux pods (avec injection Vault) :
  ```bash
  kubectl rollout restart deployment/backend -n thetiptop-dev
  kubectl rollout restart statefulset/mongodb -n thetiptop-dev
  ```
- Vérifie les logs du pod backend : pas d’erreur de connexion MongoDB, pas d’erreur Vault.
- Si tout est ok, le backend charge les secrets depuis **Vault** (fichier `/vault/secrets/backend`). Sinon il utilise toujours les secrets Kubernetes (fallback).

---

## Récap ordre des étapes

| # | Action |
|---|--------|
| 1 | Vérifier que le code Vault est sur la branche |
| 2 | Créer le secret GitHub `VAULT_TOKEN` (valeur temporaire `pending`) |
| 3 | Déclencher le déploiement (push ou Run workflow) |
| 4 | Vérifier les pods : `kubectl get pods -n vault` |
| 5 | Init : `kubectl exec -n vault vault-0 -- vault operator init -format=json > vault-keys.json` |
| 6 | Récupérer le root token depuis `vault-keys.json` |
| 7 | Désealer vault-0 avec 3 clés |
| 8 | Faire rejoindre et désealer vault-1 et vault-2 |
| 9 | Mettre le root token dans le secret GitHub `VAULT_TOKEN` |
| 10 | Relancer le déploiement (bootstrap) |
| 11 | (Optionnel) Activer l’audit : `vault audit enable file ...` |
| 12 | Activer l’injection : `kubectl label namespace thetiptop-dev vault-injection=enabled` |
| 13 | Redémarrer backend + MongoDB et vérifier que l’app fonctionne |

---

## Pour preprod et prod

Tu répètes les **mêmes étapes** sur chaque cluster (preprod, prod) :

- Changer de **kubeconfig** (cluster preprod ou prod).
- Utiliser la branche qui déploie sur ce cluster (`preprod` ou `prod`).
- Choisir : soit un **VAULT_TOKEN** commun (si tu utilises le même Vault), soit un token différent par cluster (un Vault par env = un init par cluster).

Si tu as **un cluster par env** (dev, preprod, prod), en général tu fais **un init par cluster** et tu peux utiliser **un secret VAULT_TOKEN** par environnement (ex. via GitHub Environments) ou un seul token si ton workflow ne distingue pas.

---

## En cas de problème

- **Bootstrap job en erreur** : vérifier que Vault est désealé (`kubectl exec -n vault vault-0 -- vault status`) et que le secret `VAULT_TOKEN` dans GitHub correspond bien au root token.
- **Backend ne démarre pas / erreur Vault** : vérifier les logs du pod backend et de l’init container Vault. Si Vault n’est pas dispo, le backend utilise les secrets K8s (fallback).
- Détails et dépannage : voir **.github/VAULT-SETUP.md**.
