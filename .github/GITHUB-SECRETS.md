# Configuration des secrets GitHub (Actions)

Les workflows CI/CD utilisent des **secrets** pour ne jamais exposer mots de passe, clés API ou kubeconfig dans le code. Voici où les configurer et quoi ajouter.

---

## Où configurer les secrets

1. Ouvre ton dépôt sur **GitHub**.
2. Va dans **Settings** (paramètres du dépôt).
3. Dans le menu de gauche : **Secrets and variables** → **Actions**.
4. Clique sur **New repository secret** pour ajouter un secret.

Chaque secret a un **nom** (ex. `GOOGLE_CLIENT_ID`) et une **valeur** (que tu colles une seule fois ; elle ne sera plus visible ensuite).

---

## Liste des secrets utilisés par le projet

### Connexion / inscription Google (OAuth)

| Nom du secret        | Description                                      | Exemple (ne pas commiter la valeur réelle) |
|----------------------|--------------------------------------------------|--------------------------------------------|
| `GOOGLE_CLIENT_ID`   | ID client OAuth « Application Web » (Google)     | `847397925440-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret client OAuth Google                    | `GOCSPX-xxx`                               |

- Utilisés par le **workflow CD** (`cd-deploy.yml`) pour remplir le secret Kubernetes `backend-secret` (clés `google-client-id` et `google-client-secret`).
- Le backend lit ces variables d’environnement ; si elles sont absentes, la connexion Google est simplement désactivée.

---

### Registry Docker (Harbor)

| Nom du secret      | Description              |
|--------------------|--------------------------|
| `HARBOR_REGISTRY`  | URL du registry (ex. `harbor.example.com`) |
| `HARBOR_USERNAME`  | Utilisateur Harbor       |
| `HARBOR_PASSWORD`  | Mot de passe Harbor      |

Utilisés par les CI (build + push des images) et le CD (imagePullSecrets).

---

### Kubernetes (accès aux clusters)

| Nom du secret     | Description |
|-------------------|-------------|
| `KUBECONFIG_DEV`     | Contenu du fichier kubeconfig du cluster **dev**, encodé en base64 |
| `KUBECONFIG_PREPROD` | Idem pour le cluster **preprod** |
| `KUBECONFIG_PROD`    | Idem pour le cluster **prod** |

Pour encoder un kubeconfig :  
`base64 -w0 ~/.kube/config-dev` (Linux) ou équivalent sur Windows (PowerShell : encoder le contenu du fichier en base64).

---

### Base de données et JWT (par environnement)

| Nom du secret          | Utilisé pour |
|------------------------|--------------|
| `MONGODB_URI_DEV`      | URI de connexion MongoDB pour l’environnement **dev** |
| `MONGODB_URI_PREPROD`  | URI MongoDB **preprod** |
| `MONGODB_URI_PROD`     | URI MongoDB **prod** |
| `JWT_SECRET_DEV`       | Clé secrète JWT **dev** |
| `JWT_SECRET_PREPROD`   | Clé secrète JWT **preprod** |
| `JWT_SECRET_PROD`      | Clé secrète JWT **prod** |
| `MONGO_ROOT_USERNAME`  | Utilisateur root MongoDB (ex. `root`) |
| `MONGO_ROOT_PASSWORD`  | Mot de passe root MongoDB |

Les URI MongoDB peuvent être en clair ou encodées en base64 ; le workflow CD gère le décodage si nécessaire (voir `.github/MONGODB-K8S.md`).

---

## Récapitulatif minimal pour Google uniquement

Pour que la **connexion / inscription avec Google** fonctionne en dev, preprod et prod :

1. **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** :
   - Name : `GOOGLE_CLIENT_ID`  
     Value : ton ID client (ex. `847397925440-gk56rm5l6g1bm8d6dehk00kvj23agopl.apps.googleusercontent.com`).
3. **New repository secret** :
   - Name : `GOOGLE_CLIENT_SECRET`  
     Value : ton secret client Google (ex. `GOCSPX-...`).

Après le prochain déploiement (push sur `dev` / `preprod` / `prod`), le backend déployé recevra ces variables et la connexion Google sera active pour cet environnement.

---

## Bonnes pratiques

- Ne jamais commiter les valeurs des secrets dans le dépôt.
- Ne pas mettre le **secret client** Google dans un fichier versionné (uniquement dans GitHub Secrets ou dans un `.env` local non commité).
- En cas de fuite d’un secret (ex. Google), le révoquer / régénérer dans la console concernée et mettre à jour le secret sur GitHub.
