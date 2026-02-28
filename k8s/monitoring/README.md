# Monitoring – Prometheus, Grafana, Alertmanager

Mise en place du monitoring (Phase 8 du plan) **étape par étape**, en commençant par l’environnement **dev**.

---

## Vue d’ensemble

| Composant      | Rôle |
|----------------|------|
| **Prometheus** | Collecte des métriques (Pods, nœuds, services). |
| **Grafana**    | Tableaux de bord et visualisation. |
| **Alertmanager** | Gestion des alertes et notifications. |
| **Node Exporter** | Métriques des nœuds (CPU, RAM, disque). |
| **Kube State Metrics** | Métriques sur les objets Kubernetes (Pods, Deployments, etc.). |

---

## Prérequis

- Cluster Kubernetes **dev** accessible avec `kubectl`.
- **Helm 3** installé en local (`helm version`).
- Traefik et cert-manager déjà déployés sur le cluster (pour l’Ingress Grafana en HTTPS).

---

## Étape 0 – Vérifier le contexte Kubernetes

Assurez-vous de cibler le cluster **dev** :

```bash
kubectl config current-context
kubectl get nodes
```

Si vous utilisez DigitalOcean (doctl) : `doctl kubernetes cluster kubeconfig save <nom-du-cluster-dev>` puis sélectionnez ce contexte.

---

## Étape 1 – Créer le namespace `monitoring`

Sur le cluster **dev** :

```bash
kubectl apply -f k8s/monitoring/namespace.yaml
```

Vérifier :

```bash
kubectl get ns monitoring
```

---

## Étape 2 – Ajouter le dépôt Helm et installer le stack

### 2.1 Ajouter le dépôt Helm

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 2.2 Installer le stack dans le namespace `monitoring`

Depuis la **racine du projet** :

**PowerShell (Windows) – une seule ligne :**

```powershell
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f k8s/monitoring/values-dev.yaml
```

**Bash / Linux / Mac :**

```bash
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f k8s/monitoring/values-dev.yaml
```

- `monitoring` : nom de la release Helm.
- `prometheus-community/kube-prometheus-stack` : chart (Prometheus + Grafana + Alertmanager + node-exporter + kube-state-metrics).
- `-f k8s/monitoring/values-dev.yaml` : valeurs pour l’environnement dev (rétention, Ingress Grafana, ressources).

### 2.3 Vérifier les Pods

```bash
kubectl -n monitoring get pods
```

Attendre que tous les Pods soient `Running` (peut prendre 1 à 2 minutes).

---

## Étape 3 – Accéder à Grafana (HTTPS)

Une fois l’Ingress créé et le certificat TLS émis par cert-manager :

1. **DNS** : faire pointer `grafana.dev.thetiptop-jeu.fr` vers l’IP du Load Balancer Traefik du cluster dev (même IP que `dev.thetiptop-jeu.fr`).

2. **Connexion** :  
   - URL : `https://grafana.dev.thetiptop-jeu.fr`  
   - Utilisateur : `admin`  
   - Mot de passe : défini dans `values-dev.yaml` (par défaut `admin` — **à changer en prod**).

3. **Premiers pas** :  
   - Dans Grafana : **Explore** (icône boussole) → choisir la source de données **Prometheus** (déjà configurée par le chart).  
   - Importer un dashboard prédéfini : **Dashboards** → **Import** → ID `315` (Kubernetes cluster) ou `1860` (Node Exporter).

**Si le DNS n’est pas encore configuré** : accéder à Grafana en local via port-forward :

```bash
kubectl -n monitoring port-forward svc/monitoring-grafana 3000:80
```

Puis ouvrir http://localhost:3000 (utilisateur `admin`, mot de passe comme dans `values-dev.yaml`).

---

## Étape 4 – Vérifier Prometheus et les métriques

- **Prometheus** (interne au cluster) :  
  Port-forward temporaire si besoin :  
  `kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090`  
  Puis ouvrir http://localhost:9090 et exécuter une requête (ex. `up`).

- Les **ServiceMonitors** créés par le chart scrapent déjà les composants du stack (Prometheus, Alertmanager, node-exporter, kube-state-metrics, etc.). Les métriques de vos Pods (CPU, mémoire) sont disponibles via les métriques Kubernetes standard.

---

## Étape 5 – Alertmanager (optionnel pour commencer)

Alertmanager est déployé avec une config minimale (récepteur `null` = pas d’envoi d’email/Slack pour l’instant).

- Pour **ajouter des alertes** : éditer la config Alertmanager (ou la mettre dans `values-dev.yaml` sous `alertmanager.config`) et définir des **PrometheusRules** (déjà fournies en partie par le chart).
- Pour **recevoir des notifications** : configurer un récepteur (email, Slack, etc.) dans `alertmanager.config.receivers` et une route.

---

## Récapitulatif des commandes (dev)

**PowerShell (Windows) :**

```powershell
# Namespace
kubectl apply -f k8s/monitoring/namespace.yaml

# Helm (une seule ligne sous PowerShell)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f k8s/monitoring/values-dev.yaml

# Vérifications
kubectl -n monitoring get pods
kubectl -n monitoring get ingress
```

**Bash / Linux / Mac :** même chose, ou avec des `\` en fin de ligne pour couper la commande `helm upgrade --install`.

---

## Préprod / Prod (plus tard)

- Copier et adapter `values-dev.yaml` en `values-preprod.yaml` et `values-prod.yaml` (autres domaines Grafana, rétention plus longue, mot de passe Grafana via Secret, ressources plus élevées).
- Appliquer le même `namespace.yaml` et installer le stack avec le fichier de values correspondant sur chaque cluster.

---

## Dépannage

| Problème | Piste |
|----------|--------|
| Pods en `Pending` | Vérifier les ressources du cluster (`kubectl describe pod -n monitoring <pod>`). |
| Grafana inaccessible | Vérifier l’Ingress (`kubectl -n monitoring get ingress`), le certificat TLS et le DNS. |
| Pas de métriques dans Grafana | Vérifier que la source de données **Prometheus** pointe vers `http://monitoring-kube-prometheus-prometheus:9090`. |
