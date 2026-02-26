# Installation Traefik + cert-manager (une seule fois par cluster)

Ces commandes sont à exécuter **une seule fois** pour chaque cluster (dev, preprod, prod).

---

## Prérequis

```bash
# Vérifier que kubectl pointe sur le bon cluster
kubectl config current-context

# Avoir Helm installé
helm version
```

---

## Étape 1 – Installer cert-manager (Let's Encrypt)

```bash
# Ajouter le repo Helm
helm repo add jetstack https://charts.jetstack.io --force-update

# Installer cert-manager avec les CRDs
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Vérifier (attendre que les pods soient Running)
kubectl get pods -n cert-manager
```

---

## Étape 2 – Installer Traefik

Remplacer `<ENV>` par `dev`, `preprod` ou `prod` selon le cluster courant :

```bash
# Ajouter le repo Traefik
helm repo add traefik https://helm.traefik.io/traefik --force-update

# Installer Traefik avec les valeurs de l'environnement
ENV=dev   # ← changer : dev | preprod | prod

helm upgrade --install traefik traefik/traefik \
  --namespace traefik \
  --create-namespace \
  --values k8s/traefik/values-$ENV.yaml

# Vérifier
kubectl get pods -n traefik
kubectl get svc  -n traefik    # noter l'IP externe du LoadBalancer
```

---

## Étape 3 – Appliquer les middlewares de sécurité

```bash
kubectl apply -f k8s/traefik/middleware-security.yaml -n traefik
```

---

## Étape 4 – Appliquer les ClusterIssuers Let's Encrypt

Éditer d'abord `k8s/traefik/letsencrypt-issuer.yaml` pour remplacer l'email :

```bash
kubectl apply -f k8s/traefik/letsencrypt-issuer.yaml
```

---

## Étape 5 – Configurer les DNS

Récupérer l'IP externe du LoadBalancer Traefik :

```bash
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Créer les enregistrements DNS **A** chez votre registrar (OVH, Gandi, etc.) :

| Cluster | Sous-domaine | → IP |
|---------|-------------|------|
| **dev** | `dev.thetiptop-jeu.fr` | IP du LoadBalancer dev |
| **dev** | `api.dev.thetiptop-jeu.fr` | IP du LoadBalancer dev |
| **preprod** | `preprod.thetiptop-jeu.fr` | IP du LoadBalancer preprod |
| **preprod** | `api.preprod.thetiptop-jeu.fr` | IP du LoadBalancer preprod |
| **prod** | `thetiptop-jeu.fr` | IP du LoadBalancer prod |
| **prod** | `www.thetiptop-jeu.fr` | IP du LoadBalancer prod |
| **prod** | `api.thetiptop-jeu.fr` | IP du LoadBalancer prod |

---

## Étape 6 – Vérifier les certificats TLS (après déploiement)

Après le premier déploiement (qui applique les Ingress), cert-manager génère automatiquement les certificats :

```bash
# Vérifier que le certificat est émis (READY=True)
kubectl get certificate -n thetiptop-dev
kubectl get certificate -n thetiptop-preprod
kubectl get certificate -n thetiptop-prod

# Détail en cas de problème
kubectl describe certificate thetiptop-dev-tls -n thetiptop-dev
```

---

## Récapitulatif des commandes par cluster

```bash
# Pour chaque cluster (changer ENV et pointer kubectl sur le bon cluster) :
ENV=dev   # ou preprod, prod

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --set installCRDs=true

helm upgrade --install traefik traefik/traefik \
  --namespace traefik --create-namespace \
  --values k8s/traefik/values-$ENV.yaml

kubectl apply -f k8s/traefik/middleware-security.yaml -n traefik
kubectl apply -f k8s/traefik/letsencrypt-issuer.yaml
```
