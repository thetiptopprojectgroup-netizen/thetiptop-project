# Phase 7 – Gestion des secrets (HashiCorp Vault)

- **Déploiement** : cluster Vault HA (Raft) + Vault Agent Injector.
- **Stockage** : credentials MongoDB et backend (JWT, OAuth) dans Vault KV v2.
- **Injection** : dynamique dans les Pods (backend + MongoDB) via annotations.
- **Rotation** : réécriture des secrets via CD ou CronJob + redémarrage des Pods.
- **Audit** : trail des accès Vault (audit device file, à activer une fois après unseal).

## Prérequis

- Helm 3 installé (le CD l’installe si besoin).
- Un secret GitHub **VAULT_TOKEN** (token root après `vault operator init`) pour que le CD déploie Vault et pousse les secrets.

## 1. Premier déploiement Vault (une fois par cluster)

Le CD déploie Vault lorsque **VAULT_TOKEN** est défini dans les secrets du dépôt. La première fois, Vault doit être **initialisé et désealé** à la main.

### 1.1 Déployer Vault avec le CD

1. Ajoute le secret **VAULT_TOKEN** dans GitHub (Settings → Secrets → Actions) : pour l’instant tu peux mettre une valeur factice (ex. `pending`) puis la remplacer après init.
2. Push sur `dev` (ou la branche du cluster cible) : le CD installe le namespace `vault`, le RBAC (auth-reviewer), et Helm installe Vault (HA Raft + injector).

### 1.2 Init et unseal (à faire une fois par cluster)

Une fois les pods Vault en place (`vault-0`, `vault-1`, `vault-2`) :

```bash
# Avec le kubeconfig du cluster concerné (dev / preprod / prod)

# Init (génère les clés et le root token)
kubectl exec -n vault vault-0 -- vault operator init -format=json > vault-keys.json

# Conserve vault-keys.json en lieu sûr. Récupère :
# - root_token → à mettre dans GitHub Secret VAULT_TOKEN
# - unseal_keys_b64 (5 clés) → pour désealer chaque nœud

# Désealer vault-0 (3 fois avec 3 clés différentes)
kubectl exec -n vault vault-0 -- vault operator unseal <KEY1>
kubectl exec -n vault vault-0 -- vault operator unseal <KEY2>
kubectl exec -n vault vault-0 -- vault operator unseal <KEY3>

# Rejoindre et désealer vault-1 et vault-2
kubectl exec -n vault vault-1 -- vault operator raft join http://vault-0.vault-internal:8200
kubectl exec -n vault vault-1 -- vault operator unseal <KEY1>
kubectl exec -n vault vault-1 -- vault operator unseal <KEY2>
kubectl exec -n vault vault-1 -- vault operator unseal <KEY3>

kubectl exec -n vault vault-2 -- vault operator raft join http://vault-0.vault-internal:8200
kubectl exec -n vault vault-2 -- vault operator unseal <KEY1>
kubectl exec -n vault vault-2 -- vault operator unseal <KEY2>
kubectl exec -n vault vault-2 -- vault operator unseal <KEY3>
```

Ensuite, mets à jour le secret GitHub **VAULT_TOKEN** avec la valeur `root_token` de `vault-keys.json`.

### 1.3 Activer l’audit (trail des accès)

Sur un pod Vault (ex. `vault-0`) :

```bash
kubectl exec -n vault vault-0 -- vault login
# Colle le root token

kubectl exec -n vault vault-0 -- vault audit enable file file_path=/vault/audit/audit.log
```

Les logs d’audit sont écrits dans le volume monté sous `/vault/audit` (PVC configuré dans `k8s/vault/values.yaml`).

## 2. Bootstrap et sync des secrets

À chaque déploiement (push sur dev / preprod / prod), si **VAULT_TOKEN** est défini, le CD :

1. Met à jour Vault (Helm) si besoin.
2. Crée/met à jour les secrets Kubernetes dans le namespace `vault` : `vault-bootstrap-token`, `vault-thetiptop-secrets`.
3. Lance le **Job de bootstrap** qui :
   - Active le secrets engine KV v2 (`secret/`),
   - Configure l’auth Kubernetes,
   - Crée les policies et rôles (`thetiptop-thetiptop-dev`, etc.),
   - Écrit les secrets applicatifs dans `secret/thetiptop/<env>/mongodb` et `secret/thetiptop/<env>/backend`.

Les Pods backend et MongoDB ont des **annotations Vault** : au démarrage, l’Agent Injector récupère les secrets depuis Vault et les écrit dans `/vault/secrets/` (backend : un fichier au format .env ; MongoDB : deux fichiers username/password). Le backend charge `/vault/secrets/backend` s’il existe (override des variables d’environnement). MongoDB utilise un wrapper qui exporte les valeurs lues depuis ces fichiers.

## 3. Rotation des secrets

- **Via le CD** : modifier les secrets dans GitHub (MONGODB_URI_*, JWT_SECRET_*, etc.) puis push. Le CD recrée `vault-thetiptop-secrets` et relance le Job de bootstrap, qui réécrit les chemins Vault. Ensuite **redémarrer les déploiements** pour que les Pods reprennent les nouvelles valeurs :
  - `kubectl rollout restart deployment/backend -n thetiptop-<env>`
  - `kubectl rollout restart statefulset/mongodb -n thetiptop-<env>` (si tu as fait tourner le mot de passe MongoDB).
- **CronJob de rotation** : appliquer `k8s/vault/rotation-cronjob.yaml` (en remplaçant `NAMESPACE_PLACEHOLDER` par le namespace cible). Il redémarre le backend le 1er de chaque mois à 4h UTC pour prendre en compte d’éventuelles mises à jour des secrets dans Vault. Tu peux l’activer depuis le CD si tu le souhaites.

## 4. Dépannage

- **Bootstrap job en erreur** : vérifier que Vault est bien init + unseal (`kubectl exec -n vault vault-0 -- vault status`). Vérifier les logs du job : `kubectl logs -n vault job/vault-bootstrap-<env>`.
- **Pods ne reçoivent pas les secrets** : vérifier que l’Agent Injector tourne (`kubectl get pods -n vault -l app.kubernetes.io/name=vault-agent-injector`), que le rôle Vault correspond au namespace (`thetiptop-thetiptop-dev` pour `thetiptop-dev`), et que les secrets existent dans Vault : `kubectl exec -n vault vault-0 -- vault kv get secret/thetiptop/dev/backend` (après login).
- **Fallback** : les Déploiements/StatefulSets gardent les `secretKeyRef` vers `backend-secret` et `mongodb-secret`. Si Vault n’est pas disponible, les applications utilisent ces secrets Kubernetes.
