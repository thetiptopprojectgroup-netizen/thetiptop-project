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

- Pour le déploiement **VPS** : à renseigner dans le fichier d’environnement du serveur (ex. secrets référencés par `V*_ENV_FILE` dans les workflows `deploy-vdev.yml` / `deploy-vpreprod.yml` / `deploy-vprod.yml`), ou variables équivalentes côté backend.
- Le backend lit ces variables d’environnement ; si elles sont absentes, la connexion Google est simplement désactivée.

---

### SendGrid (newsletter – email de bienvenue)

| Nom du secret         | Description |
|------------------------|-------------|
| `SENDGRID_API_KEY`     | Clé API SendGrid (créée dans Settings → API Keys) |
| `SENDGRID_FROM_EMAIL`  | Email expéditeur vérifié dans SendGrid (Single Sender) |
| `SENDGRID_FROM_NAME`  | Nom affiché (optionnel, ex. `Thé Tip Top`) |

- À injecter dans l’environnement du backend sur le VPS (fichier `.env` / compose), comme pour les autres variables applicatives.
- Après déploiement avec les bonnes valeurs, la newsletter envoie l’email de bienvenue aux inscrits.
- Si ces secrets sont absents, l’inscription à la newsletter fonctionne toujours (email en base) mais aucun email n’est envoyé.

---

### Registry Docker (Harbor)

| Nom du secret      | Description              |
|--------------------|--------------------------|
| `HARBOR_REGISTRY`  | URL du registry (ex. `harbor.example.com`) |
| `HARBOR_USERNAME`  | Utilisateur Harbor       |
| `HARBOR_PASSWORD`  | Mot de passe Harbor      |

Utilisés par les CI (build + push des images) et par les workflows de déploiement VPS (pull d’images depuis Harbor).

---

### Déploiement VPS (SSH, Ansible)

Pas de **kubeconfig**. Les secrets typiques sont décrits dans les workflows `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` (clés SSH, `V*_ENV_FILE`, registry Harbor, etc.). L’inventaire et les rôles Ansible sont sous `infra/ansible/`.

---

### Base de données et JWT (référence historique / variables serveur)

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

Sur le VPS, l’URI MongoDB est dans le fichier d’environnement utilisé par Docker Compose (voir `infra/deploy/env/`). Pour l’historique des anciennes URI Kubernetes, voir `.github/MONGODB-K8S.md` (conservé comme archive).

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

Après mise à jour du fichier d’environnement sur le VPS et redémarrage du backend (ou prochain déploiement via les workflows `deploy-v*`), la connexion Google sera active si les variables sont présentes côté serveur.

---

## Bonnes pratiques

- Ne jamais commiter les valeurs des secrets dans le dépôt.
- Ne pas mettre le **secret client** Google dans un fichier versionné (uniquement dans GitHub Secrets ou dans un `.env` local non commité).
- En cas de fuite d’un secret (ex. Google), le révoquer / régénérer dans la console concernée et mettre à jour le secret sur GitHub.
