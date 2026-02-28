# Backup MongoDB : MinIO + Restic (guide unique)

Une seule instance MinIO par cluster (dev / preprod / prod). Chaque cluster a son URL HTTPS et ses backups Restic. Tout est déployé au **push** via le CD.

---

## 1. Prérequis (à faire une fois)

### 1.1 DNS (OVH ou autre)

Chaque hostname doit pointer vers l’**IP du Load Balancer du cluster** correspondant :

| URL finale | Enregistrement DNS | Pointe vers |
|------------|--------------------|-------------|
| https://minio.dev.thetiptop-jeu.fr | `minio.dev` (A) | IP LB cluster **dev** (même que dev.thetiptop-jeu.fr) |
| https://minio.preprod.thetiptop-jeu.fr | `minio.preprod` (A) | IP LB cluster **preprod** |
| https://minio.thetiptop-jeu.fr | `minio` (A) | IP LB cluster **prod** |

Récupérer l’IP : `kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'` (sur le bon cluster).

### 1.2 Secrets GitHub (Settings → Secrets and variables → Actions)

Les **5 secrets** suivants doivent être définis :

| Secret | Valeur | Exemple |
|--------|--------|---------|
| `RESTIC_MINIO_ENDPOINT` | URL MinIO dans le cluster | `http://minio.minio.svc.cluster.local:9000` |
| `RESTIC_MINIO_BUCKET` | Nom du bucket | `backups` |
| `RESTIC_PASSWORD` | Mot de passe du dépôt Restic (à choisir, à garder en lieu sûr) | — |
| `RESTIC_S3_ACCESS_KEY_ID` | Identifiant MinIO (admin) | `minioadmin` |
| `RESTIC_S3_SECRET_ACCESS_KEY` | Mot de passe MinIO (admin) | — |

Les deux derniers servent aussi à la connexion à la **console MinIO** (HTTPS).

---

## 2. Ce que fait le CD à chaque push

Sur **push** vers `dev`, `preprod` ou `prod`, le workflow **CD - Deploy** :

1. Applique le **ClusterIssuer** Let's Encrypt (cert-manager).
2. Crée le namespace **minio**, le secret **minio-credentials**, déploie MinIO (PVC + Deployment + Service).
3. Applique l’**Ingress MinIO** avec **un seul host** pour l’environnement courant :
   - dev → `minio.dev.thetiptop-jeu.fr`
   - preprod → `minio.preprod.thetiptop-jeu.fr`
   - prod → `minio.thetiptop-jeu.fr`
4. Supprime le certificat **minio-tls** s’il existe pour que cert-manager le recrée (aligné sur cet Ingress).
5. Applique les **CronJobs** backup MongoDB (Restic) et test de restauration.
6. Crée le secret **restic-s3-secret** dans le namespace thetiptop-* avec le dépôt `s3:.../BUCKET/mongodb-ENV`.

Aucune commande manuelle. Un seul host par Ingress garantit un **certificat HTTPS Let's Encrypt valide** (pas d’erreur de type « connexion non privée »).

---

## 3. URLs MinIO (HTTPS)

Après déploiement et propagation DNS + certificat (1–2 min) :

| Environnement | URL console MinIO |
|---------------|--------------------|
| Dev | https://minio.dev.thetiptop-jeu.fr |
| Preprod | https://minio.preprod.thetiptop-jeu.fr |
| Prod | https://minio.thetiptop-jeu.fr |

**Connexion** : identifiant = `RESTIC_S3_ACCESS_KEY_ID`, mot de passe = `RESTIC_S3_SECRET_ACCESS_KEY`.

---

## 4. Backups MongoDB (Restic)

- **Planification** : 18h00 heure française (17h00 UTC) et 18h15 UTC (2 CronJobs).
- **Contenu** : `mongodump` puis envoi vers MinIO via Restic (rétention 7 jours + 4 semaines).
- **Test manuel** : GitHub Actions → **Trigger backup now** → choisir l’environnement.

---

## 5. Vérifier le certificat HTTPS

Sur le cluster concerné :

```bash
kubectl get certificate -n minio
# minio-tls doit afficher READY=True après 1–2 min

kubectl get ingress -n minio
# minio-ingress doit afficher un seul HOST (ex. minio.dev.thetiptop-jeu.fr sur le cluster dev)
```

Si **READY** reste **False** : `kubectl describe certificate minio-tls -n minio` et regarder la section **Events**.

---

## 6. En cas de problème

- **« Connexion non privée » (ERR_CERT_AUTHORITY_INVALID)** : le CD applique désormais un Ingress avec un seul host et supprime le certificat pour forcer sa recréation. Faire un **nouveau push** (ou relancer le CD) et attendre 1–2 min.
- **Backup ne part pas** : vérifier que les 5 secrets GitHub sont bien définis et que le CD a bien créé **restic-s3-secret** dans le namespace (e.g. `kubectl get secret restic-s3-secret -n thetiptop-dev`).
- **MinIO inaccessible** : vérifier DNS (ping ou `nslookup minio.dev.thetiptop-jeu.fr`) et Ingress (`kubectl get ingress -n minio`).

---

## 7. Récapitulatif

| Élément | Source |
|---------|--------|
| DNS dev/preprod/prod | Configuré chez OVH (ou autre) |
| 5 secrets | GitHub → Settings → Secrets |
| MinIO + Ingress + TLS | CD au push (un host par env) |
| Backups Restic | CronJobs + secret restic-s3-secret (CD) |
| Restauration manuelle | Voir `.github/DISASTER-RECOVERY.md` |

Tout est cohérent : un host par cluster → un certificat valide par URL → pas d’erreur HTTPS.
