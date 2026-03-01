# Backup MongoDB : MinIO + Restic

## Analyse du système backup / restauration

| Composant | Rôle | Détail |
|-----------|------|--------|
| **MongoDB** | Source | StatefulSet dans chaque namespace (dev/preprod/prod). |
| **CronJob backup** | `mongodb-backup` | Init: `mongodump` (gzip) → volume emptyDir. Conteneur: `restic backup` vers S3 (MinIO). Rétention: 7 daily, 4 weekly. Prod = quotidien 18h FR, dev/preprod = dimanche 18h FR. |
| **Secret** | `restic-s3-secret` | Créé par le CD : `restic-repository` (s3:.../bucket/mongodb-{env}), `restic-password`, `access-key-id`, `secret-access-key`. |
| **MinIO** | Stockage S3 | Déployé dans le namespace `minio`. Restic envoie les snapshots chiffrés dans un bucket. Console exposée en HTTPS via Traefik. |
| **CronJob restauration** | `mongodb-restore-test` | 1er de chaque mois : `restic restore latest` dans un volume temporaire (sandbox), ne modifie pas la base. |

Tout est appliqué au push (CD) : pas de `kubectl` manuel.

---

## Harbor et MinIO : même port ?

**Oui.** Harbor et MinIO utilisent le **même** Traefik (LoadBalancer) sur le **port 443** (entrypoint `websecure`). Il n’y a pas de conflit : chaque service a son propre **host** (ex. `harbor.thetiptop-jeu.fr`, `minio.dev.thetiptop-jeu.fr`). Traefik route selon le host.

Le **42215** que tu voyais dans l’URL venait du fait que MinIO, derrière le proxy, voyait la connexion entrante sur le **NodePort** du Service Traefik (Kubernetes expose 443 via un NodePort en interne). MinIO mettait ce port dans ses redirections. Ce n’est pas Harbor qui “prend” le port : c’est MinIO qui ne connaissait pas sa vraie URL publique.

**Reconfig appliquée** : MinIO est aligné sur le même schéma que les autres services (Harbor, thetiptop) :
- **MINIO_SERVER_URL** = URL publique HTTPS avec slash final (ex. `https://minio.dev.thetiptop-jeu.fr/`), injectée par le CD.
- Ingress avec les **mêmes middlewares** que le reste : `traefik-security-headers` + `minio-forwarded-headers` (X-Forwarded-Port: 443, X-Forwarded-Proto: https).

Comme ça, MinIO génère les redirections avec la bonne URL et le bon port, comme pour Harbor.

---

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

### Console MinIO (accès navigateur)

L’accès à la console se fait via un **proxy nginx** dans le même pod que MinIO. Nginx réécrit l’en-tête `Location` des redirections pour enlever le port (ex. `:41011`) que MinIO ajoute derrière Traefik, ce qui évite à la fois la boucle de redirection (ERR_TOO_MANY_REDIRECTS) et le timeout (port non exposé). L’Ingress pointe sur le port 80 (nginx) ; Restic continue d’utiliser le port 9000 (MinIO) en interne.
