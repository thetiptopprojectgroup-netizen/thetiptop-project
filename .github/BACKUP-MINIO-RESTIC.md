# Backup MongoDB : MinIO + Restic

## Ce qui est en place (automatique au push)

| Exigence | Implémentation |
|----------|----------------|
| **Backups quotidiens production** | CronJob à 18h00 (heure française) tous les jours sur **prod** |
| **Backups hebdomadaires dev/preprod** | CronJob le **dimanche à 18h00** (heure française) sur dev et preprod |
| **Stockage chiffré via MinIO (S3)** | Restic envoie les backups vers MinIO ; dépôt **chiffré** avec `RESTIC_PASSWORD` |
| **Sauvegardes incrémentales versionnées** | Restic : incrémental + rétention **7 quotidiens** et **4 hebdomadaires** |
| **Tests de restauration mensuels en sandbox** | CronJob le **1er de chaque mois à 7h00** (heure française) ; restaure dans un volume temporaire (sandbox), ne modifie pas la base |
| **Automatisation (cron + conteneurs)** | CronJobs Kubernetes (images Docker mongo + restic) ; tout déployé par le CD au push |

---

## Ce que tu dois faire (une seule fois)

### 1. GitHub – 5 secrets

Aller dans le dépôt : **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Créer **5 secrets** (nom exact, une valeur par secret) :

| Nom du secret | Valeur à mettre |
|---------------|-----------------|
| `RESTIC_MINIO_ENDPOINT` | `http://minio.minio.svc.cluster.local:9000` |
| `RESTIC_MINIO_BUCKET` | Un nom de bucket, ex. `backups` |
| `RESTIC_PASSWORD` | Un mot de passe fort (pour chiffrer le dépôt Restic) — **à noter en lieu sûr** |
| `RESTIC_S3_ACCESS_KEY_ID` | Identifiant MinIO, ex. `minioadmin` |
| `RESTIC_S3_SECRET_ACCESS_KEY` | Mot de passe MinIO (même que la console MinIO) |

Tu ne peux plus revoir la valeur après enregistrement.

### 2. OVH (DNS)

C’est déjà fait avec les 3 enregistrements A :

- `minio.dev.thetiptop-jeu.fr` → 129.212.168.6  
- `minio.preprod.thetiptop-jeu.fr` → 146.190.206.155  
- `minio.thetiptop-jeu.fr` → 164.92.132.29  

Rien à modifier côté OVH.

### 3. Déploiement

Faire un **push** sur `dev`, puis `preprod`, puis `prod`. Le CD déploie MinIO, les CronJobs et le secret Restic. Aucune commande à taper.

---

## URLs console MinIO (après déploiement)

- **Dev** : https://minio.dev.thetiptop-jeu.fr  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr  
- **Prod** : https://minio.thetiptop-jeu.fr  

Connexion : **Username** = valeur de `RESTIC_S3_ACCESS_KEY_ID`, **Password** = valeur de `RESTIC_S3_SECRET_ACCESS_KEY`.

---

## Récap

- **À faire** : créer les 5 secrets GitHub (étape 1).  
- **Déjà fait** : DNS OVH.  
- **Ensuite** : push sur chaque branche pour déployer.  
- Le reste (quotidien/hebdo, chiffrement, incrémental, test mensuel, cron) est déjà dans le code et le CD.
