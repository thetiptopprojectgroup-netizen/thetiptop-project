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
| **URL MinIO (page d’info)** | Ingress → nginx sert une page fixe (plus de boucle 307) ; UI MinIO désactivée, accès S3 via API / mc |

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

## URLs MinIO (page d’info, après déploiement)

- **Dev** : https://minio.dev.thetiptop-jeu.fr  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr  
- **Prod** : https://minio.thetiptop-jeu.fr  

La page affiche un texte d’info (plus de boucle de redirection). Pour parcourir les buckets, utiliser le client **mc** (MinIO Client) ou l’API S3 avec les mêmes identifiants que `RESTIC_S3_ACCESS_KEY_ID` / `RESTIC_S3_SECRET_ACCESS_KEY`.

---

## Savoir si tout est OK avant de tester par URL

Tu peux tout valider **dans le cluster** (sans ouvrir l’URL MinIO dans le navigateur). Si tout est vert ci‑dessous, MinIO + Restic + backups sont opérationnels ; l’URL ne sert qu’à la console (optionnel).

### 1. MinIO tourne et répond

```bash
# Contexte cluster dev (adapter pour preprod/prod)
kubectl config use-context <ton-context-dev>

# Pods MinIO (2/2 = minio + nginx)
kubectl get pods -n minio
# Attendu : minio-xxx   2/2   Running

# Service
kubectl get svc -n minio
# Attendu : minio   ClusterIP   9000, 80

# Health depuis l’intérieur du cluster
kubectl run curl-minio --rm -it --restart=Never --image=curlimages/curl -- \
  curl -s -o /dev/null -w "%{http_code}\n" http://minio.minio.svc.cluster.local:9000/minio/health/live
# Attendu : 200
```

Si tu as **200**, MinIO est OK en interne. Restic pourra s’y connecter.

### 2. Secret Restic présent

```bash
kubectl get secret restic-s3-secret -n thetiptop-dev
# Attendu : restic-s3-secret   Opaque   4
```

S’il existe, le CD a bien créé le secret ; les CronJobs pourront faire les backups.

### 3. CronJobs backup et restauration présents

```bash
kubectl get cronjobs -n thetiptop-dev
# Attendu : mongodb-backup, mongodb-restore-test
```

### 4. Lancer un backup à la main (preuve que tout marche)

```bash
# Créer un job à partir du CronJob (une fois)
kubectl create job -n thetiptop-dev backup-manual --from=cronjob/mongodb-backup

# Suivre les logs (attendre 1–2 min)
kubectl logs -n thetiptop-dev job/backup-manual -f
# Attendu : "Dump terminé", "restic backup", "Backup Restic terminé."

# Vérifier que le job a réussi
kubectl get job backup-manual -n thetiptop-dev
# Attendu : COMPLETIONS 1/1
```

Si le job est **1/1** et les logs montrent « Backup Restic terminé », alors **backup + MinIO + Restic** sont OK. Tu n’as pas besoin de l’URL pour le confirmer.

### 5. (Optionnel) Vérifier les snapshots Restic

Après un backup réussi, tu peux lister les snapshots depuis le cluster (avec les mêmes secrets que le CronJob) ; ça confirme que le dépôt S3/MinIO est bien utilisé et lisible.

---

## Vérifier dans le cluster (rappel rapide)

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
