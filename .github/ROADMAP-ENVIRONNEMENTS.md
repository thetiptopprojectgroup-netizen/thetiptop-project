# Feuille de route : environnements distincts (bonnes pratiques)

Objectif : **dev**, **preprod** et **prod** sont isolés à la fois dans **Harbor** (projets distincts) et dans les **clusters Kubernetes** (namespaces ou clusters distincts).

---

## Ordre recommandé

### 1. Harbor – Projets distincts par environnement (à faire en premier)

**Pourquoi en premier :** La CI pousse déjà vers Harbor. En séparant les projets, chaque branche alimente son propre espace (pas de mélange dev/preprod/prod).

**Actions :**
- Créer dans Harbor **3 projets** : `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`.
- Adapter la CI pour pousser selon la branche :
  - `dev` → `$HARBOR_REGISTRY/thetiptop-dev/frontend:$SHA` et `.../backend:$SHA`
  - `preprod` → `$HARBOR_REGISTRY/thetiptop-preprod/frontend:$SHA` et `.../backend:$SHA`
  - `prod` → `$HARBOR_REGISTRY/thetiptop-prod/frontend:$SHA` et `.../backend:$SHA`
- Les scans Trivy et les politiques de vulnérabilités peuvent être différents par projet (ex. blocage strict en prod).

**Résultat :** Images isolées par environnement, pas de risque de déployer une image dev en prod.

---

### 2. Kubernetes – Namespaces ou clusters distincts

**Option A (recommandée pour commencer) : 1 cluster, 3 namespaces**
- Un cluster (ex. DOKS) avec les namespaces : `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`.
- Chaque namespace a ses Deployments, Services, Secrets, ConfigMaps.
- Les déploiements (CD) pointent vers le namespace correspondant à la branche.

**Option B : 3 clusters**
- Un cluster par environnement (isolation maximale, coût plus élevé).
- Utile si exigences de conformité ou de sécurité imposent une séparation physique.

**Actions (après Harbor) :**
- Créer le(s) cluster(s) (ex. DigitalOcean DOKS, ou autre).
- Créer les namespaces `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`.
- Définir les manifests (Deployments, Services) ou Helm charts qui tirent les images depuis le **bon projet Harbor** (thetiptop-dev / thetiptop-preprod / thetiptop-prod).
- Configurer l’Ingress (Traefik ou autre) avec des hostnames ou chemins par environnement (ex. dev.thetiptop.fr, preprod.thetiptop.fr, thetiptop.fr).

---

### 3. CD / Déploiement vers les clusters

**Actions :**
- Après merge des PR (dev→preprod, preprod→prod), déclencher le déploiement vers le **bon namespace** (et le bon projet Harbor).
- Utiliser `kubectl set image` ou Helm upgrade avec les valeurs d’environnement (dev/preprod/prod) et l’image tag (SHA ou tag de release).

---

### 4. Secrets et configuration

- **Secrets** : un jeu par environnement (MongoDB, JWT, etc.), injectés dans le namespace correspondant (ou via Vault plus tard).
- **ConfigMaps** : variables d’environnement par env (URLs API, feature flags).

---

### 5. Monitoring et observabilité (ensuite)

- Prometheus / Grafana / Alertmanager par environnement ou avec labels `env=dev|preprod|prod`.
- Logs (ELK ou équivalent) pour tracer par environnement.

---

## Résumé

| Étape | Quoi | Quand |
|-------|------|--------|
| 1 | Harbor : 3 projets (thetiptop-dev, thetiptop-preprod, thetiptop-prod) + CI qui pousse au bon projet | **En premier** |
| 2 | K8s : 1 cluster + 3 namespaces (ou 3 clusters) | Après 1 |
| 3 | Manifests / Helm + déploiement CD vers le bon namespace | Après 2 |
| 4 | Secrets / ConfigMaps par env, Ingress (Traefik) | Avec 3 |
| 5 | Monitoring, backups | Ensuite |

---

## Prérequis côté Harbor

Dans l’interface Harbor, créer manuellement (ou via API) :

- Projet **thetiptop-dev** (visibilité privée, permissions équipe dev)
- Projet **thetiptop-preprod** (visibilité privée, permissions équipe preprod/QA)
- Projet **thetiptop-prod** (visibilité privée, permissions restreintes, politiques de scan strictes)

Les mêmes identifiants (HARBOR_USERNAME / HARBOR_PASSWORD) peuvent avoir des droits sur les 3 projets, ou des robots par projet pour plus de granularité.
