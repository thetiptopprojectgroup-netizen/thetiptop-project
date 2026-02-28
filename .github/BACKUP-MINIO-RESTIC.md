# Backup MongoDB : MinIO + Restic (dev, preprod, prod)

## DNS (déjà configurés)

| URL | IP (A) |
|-----|--------|
| minio.dev.thetiptop-jeu.fr | 129.212.168.6 |
| minio.preprod.thetiptop-jeu.fr | 146.190.206.155 |
| minio.thetiptop-jeu.fr | 164.92.132.29 |

## Secrets GitHub (obligatoires)

Dans **Settings → Secrets and variables → Actions**, créer :

| Secret | Valeur |
|--------|--------|
| RESTIC_MINIO_ENDPOINT | `http://minio.minio.svc.cluster.local:9000` |
| RESTIC_MINIO_BUCKET | ex. `backups` |
| RESTIC_PASSWORD | mot de passe du dépôt Restic (à garder) |
| RESTIC_S3_ACCESS_KEY_ID | identifiant MinIO (ex. minioadmin) |
| RESTIC_S3_SECRET_ACCESS_KEY | mot de passe MinIO |

## Déploiement

Un **push** sur `dev`, `preprod` ou `prod` déploie automatiquement :

- MinIO (namespace, secret, Deployment, Service, Ingress avec **1 host** = certificat HTTPS valide)
- CronJobs backup (17h00 UTC et 18h15 UTC) + test restauration (dimanche 6h UTC)
- Secret `restic-s3-secret` dans le namespace thetiptop-*

Aucune commande manuelle.

## URLs console MinIO (HTTPS)

- **Dev** : https://minio.dev.thetiptop-jeu.fr  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr  
- **Prod** : https://minio.thetiptop-jeu.fr  

Connexion : **Username** = `RESTIC_S3_ACCESS_KEY_ID`, **Password** = `RESTIC_S3_SECRET_ACCESS_KEY`.

## Test manuel backup

**Actions** → **Trigger backup now** → choisir l’environnement → **Run workflow**.

## Vérifier le certificat

```bash
kubectl get certificate -n minio
kubectl get ingress -n minio
```

`minio-tls` doit être READY=True. L’ingress doit afficher **un seul** host (celui du cluster).
