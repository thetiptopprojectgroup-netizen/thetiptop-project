# MinIO pour backups Restic (MongoDB)

Stockage S3-compatible pour les sauvegardes Restic (MongoDB). **Accessible via un lien par environnement.** Tout se déploie au push (CD), sans commandes manuelles.

## Liens d'accès (console MinIO + API S3)

Après déploiement et configuration DNS + TLS :

| Environnement | URL (HTTPS) |
|---------------|-------------|
| **Dev**       | https://minio.dev.thetiptop-jeu.fr |
| **Preprod**   | https://minio.preprod.thetiptop-jeu.fr |
| **Prod**      | https://minio.thetiptop-jeu.fr |

Chaque environnement a sa propre instance MinIO (déployée sur son cluster). Les buckets/dossiers Restic sont séparés par env (`mongodb-dev`, `mongodb-preprod`, `mongodb-prod`).

## Déploiement

Lors d'un push, le CD applique namespace, secret (depuis GitHub Secrets), déploiement et Ingress. Aucune commande à taper.
À faire une seule fois : configurer le DNS pour que les 3 hostnames pointent vers le Load Balancer du cluster. TLS : cert-manager. **Guide détaillé** : [.github/MINIO-URL-DNS.md](../../.github/MINIO-URL-DNS.md).
(Détails manuels : voir le workflow CD - Deploy ; en pratique tout est appliqué au push.)




## Endpoint pour Restic (depuis les namespaces thetiptop-*)

- **In-cluster** : `http://minio.minio.svc.cluster.local:9000`
- Configurer dans les secrets GitHub : `RESTIC_MINIO_ENDPOINT=http://minio.minio.svc.cluster.local:9000`
- Bucket : créer un bucket (ex. `backups`) via la console MinIO ou laisser Restic le créer à la première sauvegarde (selon la config Restic).

## Accès à la console MinIO (optionnel)

Exposer le service (port 9000 = API, 9001 = console selon les versions). Pour la console, vérifier la doc MinIO (port 9001 ou intégré à 9000). Les CronJobs backup n’ont besoin que de l’API S3 (9000).

## Secrets GitHub pour le CD

Pour que le CD crée le secret `restic-s3-secret` et envoie les backups vers MinIO :

- `RESTIC_MINIO_ENDPOINT` = `http://minio.minio.svc.cluster.local:9000` (ou URL externe si MinIO est hors cluster)
- `RESTIC_MINIO_BUCKET` = nom du bucket (ex. `backups`)
- `RESTIC_PASSWORD` = mot de passe du dépôt Restic
- `RESTIC_S3_ACCESS_KEY_ID` = identifiant MinIO (ex. `minioadmin` ou root-user)
- `RESTIC_S3_SECRET_ACCESS_KEY` = mot de passe MinIO (ex. root-password)
