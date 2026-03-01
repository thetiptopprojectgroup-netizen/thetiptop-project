# Backup MongoDB : MinIO + Restic

**Tout est déployé automatiquement par un push sur la branche concernée** (dev, preprod ou prod). Aucune commande manuelle ni script à lancer en conditions normales.

## Ce qui est en place (automatique au push)

| Exigence | Implémentation |
|----------|----------------|
| **Backups quotidiens production** | CronJob à 18h (heure Paris) tous les jours sur **prod** |
| **Backups hebdomadaires dev/preprod** | CronJob le **dimanche à 18h** (heure Paris) sur dev et preprod |
| **Stockage chiffré via MinIO (S3)** | Restic envoie les backups vers MinIO ; dépôt **chiffré** avec `RESTIC_PASSWORD` |
| **Sauvegardes incrémentales versionnées** | Restic : incrémental + rétention **7 quotidiens**, **4 hebdomadaires** |
| **Tests de restauration mensuels en sandbox** | CronJob le **1er de chaque mois à 7h** (heure Paris) ; restaure dans un volume temporaire, ne modifie pas la base |
| **Automatisation (CronJobs)** | Tout déployé par le CD au push ; pas de commande manuelle |
| **Interface MinIO (comme Harbor)** | Connexion sur https://minio.*.thetiptop-jeu.fr**/console/** ; API à la racine |

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

Un **push** sur une branche (y compris le **merge d’une PR**) déclenche le CD pour le cluster de cette branche. MinIO est déployé à chaque fois.

| Événement | Cluster déployé | URL MinIO |
|-----------|-----------------|-----------|
| Push ou merge vers `dev` | Dev | https://minio.dev.thetiptop-jeu.fr/console/ |
| **Merge PR dev → preprod** | Preprod | https://minio.preprod.thetiptop-jeu.fr/console/ |
| **Merge PR preprod → prod** | Prod | https://minio.thetiptop-jeu.fr/console/ |

Quand tu fais ta **promotion dev → preprod** (merge de la PR), le push sur `preprod` déclenche le CD qui déploie tout, **y compris MinIO**, sur le cluster preprod. Idem pour preprod → prod : merge de la PR = déploiement MinIO sur prod.

**Si tu as encore 502 en preprod ou prod après le merge :**
1. **Actions** → workflow « CD - Deploy » → vérifier qu’un run s’est lancé pour la branche `preprod` (ou `prod`) et qu’il est vert.
2. Vérifier que l’étape **« Déployer MinIO »** a bien été exécutée (pas de message « Secrets MinIO absents »).
3. Secrets **KUBECONFIG_PREPROD** et **KUBECONFIG_PROD** présents (Settings → Secrets → Actions).
4. DNS : `minio.preprod.thetiptop-jeu.fr` (resp. `minio.thetiptop-jeu.fr`) pointe vers l’IP du LB du cluster preprod (resp. prod).
5. Dans le cluster : `kubectl get pods -n minio` → pod en **2/2 Running**. Si CrashLoopBackOff (ex. « xl meta version 3 ») : utiliser le workflow **Reset MinIO volume** (voir ci‑dessous).

---

## Interface MinIO (connexion comme Harbor)

- **Dev** : https://minio.dev.thetiptop-jeu.fr/console/  
- **Preprod** : https://minio.preprod.thetiptop-jeu.fr/console/  
- **Prod** : https://minio.thetiptop-jeu.fr/console/  

Ouvre l’URL (avec `/console/`) dans le navigateur → **écran de connexion MinIO**.  
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

## Dépannage : « Unknown xl meta version 3 »

Si les logs MinIO affichent `FATAL Unable to initialize backend: decodeXLHeaders: Unknown xl meta version 3`, le volume a été créé par une **version plus récente** de MinIO (ex. `minio:latest` 2025) et l’image actuelle (2024) ne lit pas ce format.

**Solution (exceptionnelle) :** supprimer le PVC pour repartir avec un volume vide.

- **Preprod ou prod** (sans toucher à kubectl) : **Actions** → workflow **« Reset MinIO volume (preprod / prod) »** → Run workflow → choisir `preprod` ou `prod`. Le workflow arrête MinIO, supprime le volume, redéploie MinIO. Ensuite les PR / push gèrent le déploiement normalement.
- **Dev** (ou manuel) : commandes ci‑dessous, puis push sur `dev` ou script `scripts/minio-reset-dev.ps1`.

```powershell
# 1. Mettre à l’échelle le déploiement à 0 pour libérer le volume
kubectl scale deployment minio -n minio --replicas=0

# 2. Attendre que le pod soit terminé
kubectl get pods -n minio -w
# Ctrl+C quand plus de pod minio

# 3. Supprimer le PVC (efface la revendication ; le PV peut être recréé selon le StorageClass)
kubectl delete pvc minio-data -n minio

# 4. Réappliquer le déploiement (recrée le PVC + pods)
# Remplacer MINIO_PUBLIC_HOST_PLACEHOLDER par le host (ex. minio.dev.thetiptop-jeu.fr pour dev)
# Sous PowerShell, depuis la racine du repo :
$env:MINIO_HOST = "minio.dev.thetiptop-jeu.fr"
(Get-Content k8s/minio/deployment.yaml) -replace 'MINIO_PUBLIC_HOST_PLACEHOLDER', $env:MINIO_HOST | kubectl apply -f -

# 5. Vérifier (l’apply du deployment remet replicas à 1)
kubectl get pods -n minio -w
# Attendre 2/2 Running
```

Puis **push sur `dev`** : le CD recrée le PVC et relance MinIO. Option : script `scripts/minio-reset-dev.ps1` pour recréer sans attendre le push.

---

## Récap

1. Créer les **5 secrets** GitHub.  
2. Créer les **3 enregistrements A** DNS (minio.dev, minio.preprod, minio → IP du LB de chaque cluster).  
3. **Push** sur dev (puis preprod, prod).  
4. Après 2–3 min, tester https://minio.dev.thetiptop-jeu.fr/console/ en navigation privée.  
5. Les backups et le test de restauration tournent automatiquement selon les plannings ci‑dessus.
