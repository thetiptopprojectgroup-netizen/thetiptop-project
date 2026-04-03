# MongoDB en Kubernetes (preprod / prod)

## L’URI MongoDB est-elle générée ?

**Non.** L’URI n’est pas générée automatiquement. Tu dois la **construire toi-même** et la renseigner dans les secrets GitHub (`MONGODB_URI_DEV`, `MONGODB_URI_PREPROD`, `MONGODB_URI_PROD`). Le CD utilise ensuite cette valeur pour remplir le secret K8s `backend-secret` (clé `mongodb-uri`).

---

## Exemple concret pour ce projet (copy‑paste)

En preprod, le backend et le job seed se connectent au service **`mongodb`** dans le namespace **`thetiptop-preprod`**. Le nom DNS interne est :

`mongodb.thetiptop-preprod.svc.cluster.local:27017`

**Exemple complet** (remplace `TON_MOT_DE_PASSE` par la même valeur que le secret `MONGO_ROOT_PASSWORD`) :

| Environnement | Secret GitHub à créer | Valeur (exemple) |
|---------------|------------------------|------------------|
| **dev** | `MONGODB_URI_DEV` | `mongodb://root:TON_MOT_DE_PASSE@mongodb.thetiptop-dev.svc.cluster.local:27017/thetiptop?authSource=admin` |
| **preprod** | `MONGODB_URI_PREPROD` | `mongodb://root:TON_MOT_DE_PASSE@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin` |
| **prod** | `MONGODB_URI_PROD` | `mongodb://root:TON_MOT_DE_PASSE@mongodb.thetiptop-prod.svc.cluster.local:27017/thetiptop?authSource=admin` |

**Exemple concret utilisé pour preprod** (mot de passe `TheTipTop_Mongo2026!`) :  
Dans l’URI, encode le `!` en `%21` pour éviter les soucis avec les caractères spéciaux :

```
mongodb://root:TheTipTop_Mongo2026%21@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin
```

Tu dois aussi avoir dans GitHub **`MONGO_ROOT_USERNAME`** = `root` et **`MONGO_ROOT_PASSWORD`** = `TheTipTop_Mongo2026!` (la vraie valeur, sans encodage). Le CD utilise ces deux secrets pour créer le `mongodb-secret` K8s qui démarre MongoDB ; l’URI doit utiliser le **même** user/password (avec `%21` pour `!` dans l’URI uniquement).

---

## Configuration GitHub Actions pour preprod (avec cette URI)

Pour que le déploiement preprod fonctionne avec l’URI ci‑dessus, configure les **secrets** suivants dans le dépôt :

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valeur (exemple pour preprod) |
|--------|--------------------------------|
| **MONGO_ROOT_USERNAME** | `root` |
| **MONGO_ROOT_PASSWORD** | `TheTipTop_Mongo2026!` (sans encodage) |
| **MONGODB_URI_PREPROD** | `mongodb://root:TheTipTop_Mongo2026%21@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin` |
| **JWT_SECRET_PREPROD** | Une clé secrète forte (ex. générée avec `openssl rand -base64 32`) |
| **KUBECONFIG_PREPROD** | Contenu de ton kubeconfig preprod encodé en base64 : `base64 -w0 ~/.kube/config-preprod` |
| **HARBOR_REGISTRY** | URL du registry Harbor (ex. `harbor.ton-domaine.fr`) |
| **HARBOR_USERNAME** | Utilisateur Harbor |
| **HARBOR_PASSWORD** | Mot de passe Harbor |

**À faire :**

1. Créer ou mettre à jour les 8 secrets ci‑dessus.
2. Pour **MONGODB_URI_PREPROD** : utiliser exactement l’URI avec `%21` pour le `!` du mot de passe.
3. **MONGO_ROOT_USERNAME** et **MONGO_ROOT_PASSWORD** doivent correspondre à l’utilisateur et au mot de passe utilisés dans l’URI (root / TheTipTop_Mongo2026!).

Sans **KUBECONFIG_PREPROD**, **HARBOR_*** et **JWT_SECRET_PREPROD**, le déploiement preprod ne pourra pas se connecter au cluster ni publier les images.

---

## Connexion backend → MongoDB

Pour que le backend se connecte à MongoDB dans les namespaces preprod/prod, les secrets GitHub doivent être définis :

- `MONGODB_URI_DEV`
- `MONGODB_URI_PREPROD`
- `MONGODB_URI_PROD`

## Comment avoir la bonne MongoDB URI (preprod)

En preprod, le CD utilise le secret GitHub **`MONGODB_URI_PREPROD`**. L’URI doit pointer vers le service MongoDB **dans le cluster** (DNS interne Kubernetes).

**Formule (à mettre dans GitHub → Settings → Secrets and variables → Actions) :**

```
mongodb://<USER>:<PASSWORD>@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin
```

- **`<USER>`** et **`<PASSWORD>`** : mêmes valeurs que les secrets **`MONGO_ROOT_USERNAME`** et **`MONGO_ROOT_PASSWORD`** (utilisés par le CD pour créer le secret `mongodb-secret` et démarrer MongoDB).
- Si le mot de passe contient des caractères spéciaux (`@`, `:`, `/`, `#`, etc.), les **encoder en URL** (ex. `@` → `%40`, `:` → `%3A`).

**Exemple** (si root / MonMotDePasse123) :

```
mongodb://root:MonMotDePasse123@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin
```

**Récap des secrets GitHub à définir pour preprod :**

| Secret               | Exemple / remarque |
|----------------------|--------------------|
| `MONGO_ROOT_USERNAME`| `root` (ou votre user admin MongoDB) |
| `MONGO_ROOT_PASSWORD`| Mot de passe de cet utilisateur |
| `MONGODB_URI_PREPROD`| URI ci-dessus avec ces identifiants |

Le workflow CD injecte `MONGODB_URI_PREPROD` dans le secret K8s `backend-secret` (clé `mongodb-uri`), utilisé par le backend et le job seed. Si la valeur du secret GitHub est encodée en base64, le workflow la décode automatiquement avant de créer le secret K8s (sinon le backend recevrait la chaîne base64 et ne pourrait pas se connecter).

**Note :** On utilise bien **root** (pas `thetiptop`). Si tu as une URI encodée en Base64 qui pointe vers `thetiptop`/`thetiptop123`, ne l'utilise pas : mets à la place l'URI avec `root` et `MONGO_ROOT_PASSWORD`, et `authSource=admin` (voir exemples ci-dessus).

## Format de l’URI (référence)

Le service MongoDB est exposé dans le namespace sous le nom DNS :

`mongodb.<namespace>.svc.cluster.local:27017`

Exemples par environnement :

- **dev** : `mongodb://<USER>:<PASSWORD>@mongodb.thetiptop-dev.svc.cluster.local:27017/thetiptop?authSource=admin`
- **preprod** : `mongodb://<USER>:<PASSWORD>@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin`
- **prod** : `mongodb://<USER>:<PASSWORD>@mongodb.thetiptop-prod.svc.cluster.local:27017/thetiptop?authSource=admin`

Les identifiants doivent être ceux du secret Kubernetes `mongodb-secret` (créés par le CD à partir de `MONGO_ROOT_USERNAME` et `MONGO_ROOT_PASSWORD`).

## Utilisateur applicatif

Le `mongo-init.js` utilisé en Docker Compose n’est pas exécuté par le StatefulSet Kubernetes. **Ce projet utilise l'utilisateur `root`** (pas `thetiptop`). L'URI est donc `mongodb://root:<password>@...?authSource=admin`. Aucun Job d'init n'est nécessaire.

Référence (option 1 = ce qu'on utilise) :

1. **Utiliser le compte root** (recommandé pour ce projet) : `authSource=admin` dans l’URI ci-dessus.
2. **Créer l’utilisateur `thetiptop`** : ajouter un Job Kubernetes qui s’exécute après le StatefulSet et exécute un script équivalent à `mongo-init.js` (création de l’utilisateur + index).

## Comptes admin par environnement

Le job de seed (`npm run seed:all`) crée un admin par environnement avec des identifiants distincts :

| Environnement | Email admin              | Mot de passe |
|---------------|--------------------------|--------------|
| **dev**       | `admin@thetiptop.fr`     | Admin123!    |
| **preprod**   | `preprodadmin@thetiptop.fr` | Admin123! |
| **prod**      | `prodadmin@thetiptop.fr`   | Admin123! |

L’employé de test reste `employe@thetiptop.fr` / `Employe123!` dans tous les environnements.

## Backups MongoDB (quotidien à 5h00 Paris)

Les backups sont planifiés **chaque jour à 5h00 (heure de Paris)** via un CronJob Kubernetes `mongodb-backup`. Le dump est envoyé vers MinIO (S3) via Restic (chiffré, incrémental). Rétention : 7 sauvegardes quotidiennes, 4 hebdomadaires.

### Où voir si le backup a été fait ?

1. **Dans Kubernetes** (avec `kubectl` sur le cluster) :
   ```bash
   # Remplacer thetiptop-dev par thetiptop-preprod ou thetiptop-prod selon l’env
   kubectl get cronjobs -n thetiptop-dev
   kubectl get jobs -n thetiptop-dev
   ```
   Les jobs créés par le CronJob ont des noms du type `mongodb-backup-28345678`. Un job **Completed** = backup réussi.

   ```bash
   # Derniers jobs et statut
   kubectl get jobs -n thetiptop-dev --sort-by=.metadata.creationTimestamp | tail -10
   # Logs du dernier job de backup
   kubectl logs -n thetiptop-dev job/mongodb-backup-XXXXX --tail=100
   ```

2. **Console MinIO** : les sauvegardes Restic sont stockées dans le bucket configuré (secret `RESTIC_MINIO_BUCKET`). Tu peux vérifier dans la console MinIO que de nouveaux objets/snapshots apparaissent après 5h00.

3. **Lancer un backup à la main** : **Actions** → **Run Backup MongoDB** → Run workflow (choisir l’environnement). À la fin du workflow, les logs indiquent si le backup a réussi et rappellent de vérifier le bucket MinIO.

---

## Vérification

Après déploiement :

```bash
kubectl get pods -n thetiptop-preprod
kubectl logs deployment/backend -n thetiptop-preprod | grep -i mongo
```

Si le backend affiche `MongoDB connecté`, la connexion est correcte.

## Dépannage : MongoDB reste 0/1 Ready ou bloqué en Init:0/1

### Pod bloqué en Init:0/1 (timeout après 5 min)

1. **Vérifier le PVC** : si le volume ne se monte pas, le pod reste bloqué :
   ```bash
   kubectl get pvc -n thetiptop-dev
   ```
   Le PVC `mongodb-data-mongodb-0` doit être **Bound**. S’il est **Pending**, le cluster n’a peut‑être pas de StorageClass par défaut.

2. **Recréer le pod** pour prendre la config actuelle du StatefulSet (avec startupProbe) :
   ```bash
   kubectl delete pod mongodb-0 -n thetiptop-dev
   ```
   Remplacer `thetiptop-dev` par `thetiptop-preprod` ou `thetiptop-prod` selon l’env.

3. **Réappliquer le StatefulSet** puis supprimer le pod si besoin :
   ```bash
   kubectl apply -f k8s/dev/mongodb-statefulset.yaml
   kubectl delete pod mongodb-0 -n thetiptop-dev
   ```

### Pod en Running mais jamais Ready

Si le pod `mongodb-0` reste en `Running` mais jamais `Ready` (timeout après 5 min) :

1. **Cause** : La sonde **tcpSocket** (port 27017) peut échouer tant que MongoDB n’a pas fini d’initialiser (auth, volume lent). Le pod est donc considéré “non prêt” et le rollout attend indéfiniment.

2. **Solution dans ce repo** : La readiness utilise une sonde **exec** avec `mongosh ... db.adminCommand('ping')` pour vérifier que MongoDB accepte vraiment les connexions, pas seulement que le port est ouvert. La startup probe laisse jusqu’à ~5 min à MongoDB pour ouvrir le port.

3. **Après mise à jour du StatefulSet** : recréer le pod pour prendre la nouvelle config :
   ```bash
   kubectl delete pod mongodb-0 -n thetiptop-preprod
   ```

4. **URI preprod** : L’URI doit pointer vers `mongodb.thetiptop-**preprod**.svc.cluster.local` (pas `thetiptop-prod`). Si ton secret contient par erreur le host “prod”, le workflow CD remplace automatiquement par “preprod” lors du déploiement sur la branche preprod.
