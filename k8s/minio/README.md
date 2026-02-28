# MinIO (backups Restic)

MinIO est déployé automatiquement par le **CD** à chaque push (namespace, secret, Deployment, Service, Ingress). Un seul host par cluster pour un **certificat HTTPS Let's Encrypt valide**.

**Guide unique (prérequis, secrets, DNS, HTTPS, backup)** : [.github/BACKUP-MINIO-RESTIC.md](../../.github/BACKUP-MINIO-RESTIC.md)

- **URLs** : https://minio.dev.thetiptop-jeu.fr | https://minio.preprod.thetiptop-jeu.fr | https://minio.thetiptop-jeu.fr  
- **Connexion** : identifiant = `RESTIC_S3_ACCESS_KEY_ID`, mot de passe = `RESTIC_S3_SECRET_ACCESS_KEY` (secrets GitHub).
