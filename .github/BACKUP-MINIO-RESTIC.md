# Backup MongoDB : MinIO + Restic

## Ce qui est en place (automatique au push)

| Exigence | Implémentation |
|----------|----------------|
| **Backups quotidiens production** | CronJob à 18h (heure Paris) tous les jours sur **prod** |
| **Backups hebdomadaires dev/preprod** | CronJob le **dimanche à 18h** (heure Paris) sur dev et preprod |
| **Stockage chiffré via MinIO (S3)** | Restic envoie les backups vers MinIO ; dépôt **chiffré** avec `RESTIC_PASSWORD` |
| **Sauvegardes incrémentales versionnées** | Restic : incrémental + rétention **7 quotidiens**, **4 hebdomadaires** |
| **Tests de restauration mensuels en sandbox** | CronJob le **1er de chaque mois à 7h** (heure Paris) ; restaure dans un volume temporaire, ne modifie pas la base |
| **Automatisation (CronJobs)** | Tout déployé par le CD au push ; pas de commande manuelle |
| **Console MinIO accessible par URL** | Ingress Traefik → nginx (réécrit les redirections) → MinIO ; 1 URL par env |

---

## Ce que tu dois faire (une seule fois)

### 1. GitHub – 5 secrets

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Nom du secret | Valeur |
|---------------|--------|
| `RESTIC_MINIO_ENDPOINT` | `http://minio.minio.svc.cluster.local:9000` |
| `RESTIC_MINIO_BUCKET` | Un nom de bucket, ex. `backups` |
| `RESTIC_PASSWORD` | Un mot de passe fort pour chiffrer le dépôt Restic — **à noter en lieu sûr** |
| `RESTIC_S3_ACCESS_KEY_ID` | Identifiant MinIO (ex. `minioadmin`) — sert aussi pour la console |
| `RESTIC_S3_SECRET_ACCESS_KEY` | Mot de passe MinIO — sert aussi pour la console |

### 2. DNS (OVH ou autre)

Créer **3 enregistrements A** pour la console MinIO (chaque host pointe vers l’IP du Load Balancer du **bon** cluster) :

| Sous-domaine | Type | Cible (IP du cluster) |
|--------------|------|------------------------|
| `minio.dev` | A | IP du LB du cluster **dev** (ex. `kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'`) |
| `minio.preprod` | A | IP du LB du cluster **preprod** |
| `minio` | A | IP du LB du cluster **prod** |

Zone DNS : `thetiptop-jeu.fr`.

### 3. Déploiement

Un **push** sur `dev`, puis `preprod`, puis `prod` déploie MinIO, le secret Restic et les CronJobs. Aucune commande à taper.

---

## URLs console MinIO (après déploiement)

- **Dev** : https://minio.dev.thetiptop-jeu.fr  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr  
- **Prod** : https://minio.thetiptop-jeu.fr  

**Connexion** : identifiant = `RESTIC_S3_ACCESS_KEY_ID`, mot de passe = `RESTIC_S3_SECRET_ACCESS_KEY`.

---

## Vérifier dans le cluster (dev)

```bash
# MinIO
kubectl get pods -n minio
kubectl get svc -n minio

# Health depuis le cluster
kubectl run curl-minio --rm -it --restart=Never --image=curlimages/curl -- \
  curl -s -o /dev/null -w "%{http_code}\n" http://minio.minio.svc.cluster.local:9000/minio/health/live
# Attendu : 200

# CronJobs backup
kubectl get cronjobs -n thetiptop-dev
```

---

## Récap

1. Créer les **5 secrets** GitHub.  
2. Créer les **3 enregistrements A** DNS (minio.dev, minio.preprod, minio → IP du LB de chaque cluster).  
3. **Push** sur dev (puis preprod, prod).  
4. Après 2–3 min, tester https://minio.dev.thetiptop-jeu.fr en navigation privée.  
5. Les backups et le test de restauration tournent automatiquement selon les plannings ci‑dessus.
