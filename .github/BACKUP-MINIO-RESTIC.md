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
| **Interface MinIO (comme Harbor)** | Connexion sur https://minio.*.thetiptop-jeu.fr avec identifiants MinIO ; console sur /, API sur /api |

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

## Interface MinIO (connexion comme Harbor)

- **Dev** : https://minio.dev.thetiptop-jeu.fr  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr  
- **Prod** : https://minio.thetiptop-jeu.fr  

Ouvre l’URL dans le navigateur → **écran de connexion MinIO**.  
**Identifiant** = valeur de `RESTIC_S3_ACCESS_KEY_ID`, **Mot de passe** = valeur de `RESTIC_S3_SECRET_ACCESS_KEY`.  
Après connexion tu peux parcourir les **buckets** et les **objets** (dont les backups Restic).

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

## Voir les sauvegardes (se connecter / lister les backups)

L’URL https://minio.dev.thetiptop-jeu.fr affiche une page d’info uniquement. Pour **voir les backups**, utilise l’une des méthodes suivantes (depuis le cluster).

### A. Lister les snapshots Restic (backups MongoDB)

Les backups sont des **snapshots Restic** (chiffrés) dans MinIO. Pour les lister, utilise le Job fourni :

**Dev (bash / WSL / Git Bash) :**
```bash
sed "s/NAMESPACE_PLACEHOLDER/thetiptop-dev/g" k8s/restic-list-snapshots-job.yaml | kubectl apply -f -
kubectl logs job/restic-list-snapshots -n thetiptop-dev -f
```

**Dev (PowerShell) :**
```powershell
(Get-Content k8s/restic-list-snapshots-job.yaml) -replace 'NAMESPACE_PLACEHOLDER','thetiptop-dev' | kubectl apply -f -
kubectl logs job/restic-list-snapshots -n thetiptop-dev -f
```

**Preprod :** remplacer `thetiptop-dev` par `thetiptop-preprod`.  
**Prod :** remplacer par `thetiptop-prod`.

Le job affiche la liste des snapshots (date, ID, tags). Une fois terminé, tu peux le supprimer :  
`kubectl delete job restic-list-snapshots -n thetiptop-dev`

### B. Parcourir les buckets MinIO avec mc (MinIO Client)

Pour voir les **buckets et objets** dans MinIO (stockage S3), utilise le client **mc** dans un pod, en te connectant à MinIO **en interne** (port 9000) :

```bash
# 1. Port-forward MinIO vers ta machine (dans un terminal)
kubectl port-forward -n minio svc/minio 9000:9000

# 2. Sur ta machine : installer mc (https://min.io/docs/minio/linux/reference/minio-mc.html) puis :
mc alias set myminio http://localhost:9000 <RESTIC_S3_ACCESS_KEY_ID> <RESTIC_S3_SECRET_ACCESS_KEY>
mc ls myminio
mc ls myminio/backups
# (adapter le nom du bucket si différent de "backups")
```

Les identifiants sont les mêmes que `RESTIC_S3_ACCESS_KEY_ID` et `RESTIC_S3_SECRET_ACCESS_KEY` (secrets GitHub / MinIO).

**Depuis un pod dans le cluster** (sans port-forward) :

```bash
kubectl run mc --rm -it --restart=Never -n thetiptop-dev --image=minio/mc -- \
  sh -c "
  mc alias set myminio http://minio.minio.svc.cluster.local:9000 \$MINIO_USER \$MINIO_PASSWORD
  mc ls myminio
  mc ls myminio/backups
  "
# Il faut passer MINIO_USER et MINIO_PASSWORD via secret (même valeurs que restic-s3-secret access-key-id et secret-access-key)
```

En pratique, le plus simple pour **voir les backups** est la commande **restic snapshots** (A) ; pour **voir les fichiers/buckets bruts** dans MinIO, utiliser **mc** (B) avec port-forward ou un pod.

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
