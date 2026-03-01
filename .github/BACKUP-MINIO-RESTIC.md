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

Créer **3 enregistrements A** (ou les modifier si ça ne marchait pas) :

| Nom / Sous-domaine | Type | Cible (IP) |
|--------------------|------|------------|
| `minio.dev` | A | **129.212.168.6** (cluster dev) |
| `minio.preprod` | A | **146.190.206.155** (cluster preprod) |
| `minio` | A | **157.230.79.158** (cluster prod) |

Créer ces 3 enregistrements A dans la zone DNS du domaine `thetiptop-jeu.fr` (OVH ou autre). Chaque hostname pointe vers le Load Balancer du cluster correspondant.

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

- **À faire** : 5 secrets GitHub + 3 enregistrements DNS OVH (chaque minio.* vers l’IP du LB du cluster correspondant).  
- **Ensuite** : push sur dev, preprod, prod pour déployer.  
- Après changement DNS : attendre quelques minutes (propagation) puis réessayer l’URL MinIO ; le certificat HTTPS sera émis par Let’s Encrypt.
