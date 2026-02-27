# Manifests Kubernetes – TheTipTop
# Architecture : 3 clusters distincts (un par environnement)

## Structure

```
k8s/
├── namespaces.yaml               # Namespace par cluster
├── secrets-template.yaml         # Modèle de secrets (ne pas commiter avec de vraies valeurs)
├── dev/
│   ├── configmap.yaml            # Variables non-sensibles (URLs, dates concours)
│   ├── mongodb-statefulset.yaml  # MongoDB 7.0 (5 Gi)
│   ├── backend-deployment.yaml   # 1 replica, image thetiptop-dev
│   └── frontend-deployment.yaml  # 1 replica, image thetiptop-dev
├── preprod/
│   ├── configmap.yaml
│   ├── mongodb-statefulset.yaml  # MongoDB 7.0 (10 Gi)
│   ├── backend-deployment.yaml   # 2 replicas, image thetiptop-preprod
│   └── frontend-deployment.yaml  # 2 replicas, image thetiptop-preprod
└── prod/
    ├── configmap.yaml
    ├── mongodb-statefulset.yaml  # MongoDB 7.0 (20 Gi)
    ├── backend-deployment.yaml   # 3 replicas + HPA 3→10, image thetiptop-prod
    └── frontend-deployment.yaml  # 3 replicas + HPA 3→8, image thetiptop-prod
```

---

## Prérequis : Secrets GitHub à configurer

Dans **Settings → Secrets and variables → Actions** de votre dépôt GitHub, créer :

| Secret | Description |
|--------|-------------|
| `KUBECONFIG_DEV` | kubeconfig base64 du cluster **dev** |
| `KUBECONFIG_PREPROD` | kubeconfig base64 du cluster **preprod** |
| `KUBECONFIG_PROD` | kubeconfig base64 du cluster **prod** |
| `MONGODB_URI_DEV` | URI MongoDB du cluster dev (ex. `mongodb://user:pass@mongodb:27017/thetiptop?authSource=thetiptop`) |
| `MONGODB_URI_PREPROD` | URI MongoDB preprod |
| `MONGODB_URI_PROD` | URI MongoDB prod |
| `JWT_SECRET_DEV` | Clé JWT dev |
| `JWT_SECRET_PREPROD` | Clé JWT preprod |
| `JWT_SECRET_PROD` | Clé JWT prod (longue et aléatoire) |
| `MONGO_ROOT_USERNAME` | Utilisateur root MongoDB |
| `MONGO_ROOT_PASSWORD` | Mot de passe root MongoDB |
| `HARBOR_REGISTRY` | Déjà configuré |
| `HARBOR_USERNAME` | Déjà configuré |
| `HARBOR_PASSWORD` | Déjà configuré |

### Encoder un kubeconfig en base64

```bash
# Linux/Mac
base64 -w0 ~/.kube/config-dev > kubeconfig-dev-b64.txt

# PowerShell (Windows)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config-dev"))
```

---

## Déploiement automatique (CD)

Le workflow **`.github/workflows/cd-deploy.yml`** se déclenche automatiquement à chaque push sur `dev`, `preprod` ou `prod` **une fois les 2 CI vertes**.

| Push sur | Cluster ciblé | Namespace |
|----------|---------------|-----------|
| `dev` | Cluster Dev | `thetiptop-dev` |
| `preprod` | Cluster Preprod | `thetiptop-preprod` |
| `prod` | Cluster Prod | `thetiptop-prod` |

Le workflow gère automatiquement :
1. Création du namespace si absent
2. Création/mise à jour du secret Harbor (imagePullSecret)
3. Création/mise à jour des secrets MongoDB et JWT
4. Application des ConfigMaps
5. Déploiement MongoDB (StatefulSet)
6. Déploiement Backend + Frontend avec la bonne image Harbor
7. Vérification du rollout (`kubectl rollout status`)

---

## Déploiement manuel (première fois ou debug)

### Récupérer les kubeconfigs (DigitalOcean DOKS)

```bash
# Via doctl
doctl kubernetes cluster kubeconfig save <cluster-id-dev>    --set-current-context
doctl kubernetes cluster kubeconfig save <cluster-id-preprod> --set-current-context
doctl kubernetes cluster kubeconfig save <cluster-id-prod>    --set-current-context
```

### Appliquer pour un environnement

```bash
ENV=dev   # ou preprod, prod
NS=thetiptop-$ENV

# 1. Namespace
kubectl create namespace $NS --dry-run=client -o yaml | kubectl apply -f -

# 2. Secret Harbor
kubectl create secret docker-registry harbor-secret \
  --docker-server=harbor.thetiptop-jeu.fr \
  --docker-username=<HARBOR_USERNAME> \
  --docker-password=<HARBOR_PASSWORD> \
  -n $NS

# 3. Secrets applicatifs
kubectl create secret generic mongodb-secret \
  --from-literal=root-username=<USER> \
  --from-literal=root-password=<PASS> \
  -n $NS

kubectl create secret generic backend-secret \
  --from-literal=mongodb-uri=<URI> \
  --from-literal=jwt-secret=<JWT> \
  -n $NS

# 4. Manifests
kubectl apply -f k8s/$ENV/configmap.yaml
kubectl apply -f k8s/$ENV/mongodb-statefulset.yaml

# 5. Remplacer les placeholders et déployer
IMAGE_BACKEND=harbor.thetiptop-jeu.fr/thetiptop-$ENV/backend:<SHA>
IMAGE_FRONTEND=harbor.thetiptop-jeu.fr/thetiptop-$ENV/frontend:<SHA>

sed "s|HARBOR_REGISTRY/thetiptop-.*/backend:IMAGE_TAG|$IMAGE_BACKEND|g" \
  k8s/$ENV/backend-deployment.yaml | kubectl apply -f -

sed "s|HARBOR_REGISTRY/thetiptop-.*/frontend:IMAGE_TAG|$IMAGE_FRONTEND|g" \
  k8s/$ENV/frontend-deployment.yaml | kubectl apply -f -

# 6. Vérifier
kubectl get pods -n $NS
kubectl rollout status deployment/backend  -n $NS
kubectl rollout status deployment/frontend -n $NS
```

---

## Ressources par cluster

| Cluster | Backend replicas | Frontend replicas | MongoDB storage | HPA |
|---------|-----------------|-------------------|-----------------|-----|
| dev     | 1               | 1                 | 5 Gi            | Non |
| preprod | 2               | 2                 | 10 Gi           | Non |
| prod    | 3 → 10          | 3 → 8             | 20 Gi           | Oui (CPU 70%, RAM 80%) |
