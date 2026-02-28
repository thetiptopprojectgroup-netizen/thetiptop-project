# Plan Disaster Recovery – MongoDB (Restic + MinIO)

## Vue d’ensemble

- **Sauvegarde** : CronJobs Kubernetes exécutent `mongodump` puis envoient le dump vers un dépôt Restic stocké sur MinIO (S3).
- **Rétention** : 7 sauvegardes quotidiennes, 4 hebdomadaires (via `restic forget`).
- **Test de restauration** : CronJob hebdomadaire (dimanche 6h UTC) qui vérifie que le dépôt est lisible et qu’un snapshot peut être restauré.

## RPO / RTO (objectifs)

| Objectif | Valeur |
|----------|--------|
| **RPO** (perte de données max) | ~24 h (dernier backup quotidien) |
| **RTO** (délai de remise en service) | 1–2 h (restauration manuelle depuis MinIO) |

## Prérequis

- MinIO déployé (dans le cluster : `k8s/minio/` ou externe).
- Secret Kubernetes `restic-s3-secret` dans le namespace (créé par le CD à partir des secrets GitHub).
- Bucket MinIO dédié par environnement (ex. `backups` avec préfixe `mongodb-dev`, `mongodb-preprod`, `mongodb-prod`).

## Accès à la console MinIO (par lien)

MinIO est exposé via Ingress avec une URL par environnement (TLS + cert-manager) :

| Environnement | Lien (HTTPS) |
|---------------|--------------|
| Dev           | https://minio.dev.thetiptop-jeu.fr |
| Preprod       | https://minio.preprod.thetiptop-jeu.fr |
| Prod          | https://minio.thetiptop-jeu.fr |

Depuis la console vous pouvez vérifier les buckets et les dépôts Restic (dossiers `mongodb-dev`, `mongodb-preprod`, `mongodb-prod`). Les CronJobs backup utilisent l’endpoint interne du cluster (`http://minio.minio.svc.cluster.local:9000`).

## Restauration complète (disaster recovery)

### 1. Accéder au cluster et au namespace

```bash
# Exemple : prod
export NS=thetiptop-prod
kubectl config use-context <votre-context-prod>
```

### 2. Restaurer le dernier snapshot Restic dans un répertoire local (dans un Pod)

Créer un Job one-shot qui fait un `restic restore` vers un volume, puis `mongorestore` :

```bash
# Créer un job de restauration (à adapter selon le snapshot voulu : latest ou snapshot ID)
kubectl create job mongodb-restore-manual -n $NS --image=restic/restic:0.16 -- \
  restic restore latest --target /restore
# (En pratique, on utilise un Job YAML qui monte un volume, fait restore + mongorestore.)
```

### 3. Job de restauration manuelle (recommandé)

Utiliser le fichier `k8s/mongodb-restore-manual-job.yaml` (voir ci-dessous) qui :

1. Restaure le dernier snapshot Restic vers un volume emptyDir.
2. Lance `mongorestore` depuis ce volume vers le service MongoDB du namespace.

Exemple d’exécution :

```bash
kubectl apply -f k8s/mongodb-restore-manual-job.yaml -n $NS
# Adapter le namespace dans le fichier ou avec sed.
kubectl wait --for=condition=complete job/mongodb-restore-manual -n $NS --timeout=1800s
kubectl logs job/mongodb-restore-manual -n $NS -f
```

### 4. Vérifications après restauration

- Vérifier les bases et collections dans MongoDB.
- Redémarrer les backends si besoin pour qu’ils se reconnectent proprement.
- Tester l’application (connexion, données critiques).

## Récupération d’un snapshot précis

Lister les snapshots :

```bash
kubectl run restic-list --rm -it --restart=Never -n $NS --image=restic/restic:0.16 -- \
  env RESTIC_REPOSITORY=$(kubectl get secret restic-s3-secret -n $NS -o jsonpath='{.data.restic-repository}' | base64 -d) \
  RESTIC_PASSWORD=$(kubectl get secret restic-s3-secret -n $NS -o jsonpath='{.data.restic-password}' | base64 -d) \
  AWS_ACCESS_KEY_ID=$(kubectl get secret restic-s3-secret -n $NS -o jsonpath='{.data.access-key-id}' | base64 -d) \
  AWS_SECRET_ACCESS_KEY=$(kubectl get secret restic-s3-secret -n $NS -o jsonpath='{.data.secret-access-key}' | base64 -d) \
  restic snapshots
```

Puis utiliser l’ID du snapshot dans la commande de restauration (ex. `restic restore <snapshot-id> --target /restore`).

## Secrets GitHub requis pour le backup (CD)

Pour que le CD crée le secret `restic-s3-secret` et déploie les CronJobs :

| Secret | Description |
|--------|-------------|
| `RESTIC_MINIO_ENDPOINT` | URL MinIO (ex. `http://minio.minio.svc.cluster.local:9000`) |
| `RESTIC_MINIO_BUCKET` | Nom du bucket (ex. `backups`) |
| `RESTIC_PASSWORD` | Mot de passe du dépôt Restic |
| `RESTIC_S3_ACCESS_KEY_ID` | Access key MinIO (ex. root user) |
| `RESTIC_S3_SECRET_ACCESS_KEY` | Secret key MinIO |

Le dépôt Restic est : `s3:<RESTIC_MINIO_ENDPOINT>/<RESTIC_MINIO_BUCKET>/mongodb-<ENV>`.

## Déploiement MinIO (optionnel, in-cluster)

```bash
kubectl apply -f k8s/minio/namespace.yaml
# Créer le secret minio-credentials (remplacer le mot de passe)
kubectl create secret generic minio-credentials -n minio \
  --from-literal=root-user=minioadmin \
  --from-literal=root-password=VOTRE_MOT_DE_PASSE
kubectl apply -f k8s/minio/deployment.yaml
```

Depuis les namespaces thetiptop-*, l’endpoint MinIO est : `http://minio.minio.svc.cluster.local:9000`.

## Workflows GitHub Actions

- **Trigger backup now** : lance un backup manuel (CronJob `mongodb-backup`).
- **Trigger restore test** : lance le job de test de restauration (`mongodb-restore-test`).

## Contact / responsabilités

À compléter selon l’équipe (qui décide d’une restauration, qui a accès au cluster, etc.).
