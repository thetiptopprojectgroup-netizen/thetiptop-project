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

### EmailJS (newsletter – emails transactionnels)

| Nom du secret (exemple) | Description |
|-------------------------|-------------|
| `EMAILJS_SERVICE_ID` | ID du service email (EmailJS → Email Services) |
| `EMAILJS_PUBLIC_KEY` | Clé publique (Account → API keys) |
| `EMAILJS_PRIVATE_KEY` | Clé privée (recommandée pour les appels serveur) |
| `EMAILJS_TEMPLATE_NEWSLETTER_WELCOME` | ID du modèle « bienvenue » |
| `EMAILJS_TEMPLATE_NEWSLETTER_GOODBYE` | ID du modèle « désinscription » (optionnel) |

- Voir `server/docs/EMAILJS.md` pour la configuration des modèles et les variables (`{{user_email}}`, `{{unsubscribe_url}}`, etc.).
- À injecter dans l’environnement du backend (VPS / `.env`). Sans ces variables, l’inscription reste enregistrée en base mais aucun email n’est envoyé.

---

### Registry Docker (Harbor)

| Nom du secret           | Description |
|-------------------------|-------------|
| `HARBOR_REGISTRY_BASE`  | **Recommandé** : hôte du registry **sans** `https://` (ex. `harbor.example.com`), comme pour `deploy-vdev.yml` / `deploy-vpreprod.yml` / `deploy-vprod.yml`. Utilisé par **`ci.yml`** (CI Monorepo). |
| `HARBOR_REGISTRY`       | Ancien nom / secours : même idée (hôte seul). Lu par **`ci.yml`** si `HARBOR_REGISTRY_BASE` est vide. |
| `HARBOR_USERNAME`       | Utilisateur ou robot Harbor |
| `HARBOR_PASSWORD`       | Mot de passe / token |

Utilisés par la CI (build + push des images) et par les workflows de déploiement VPS (pull d’images depuis Harbor).

---

### Déploiement VPS (SSH, Ansible)

Pas de **kubeconfig**. Les secrets typiques sont décrits dans les workflows `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml` (clés SSH, `V*_ENV_FILE`, registry Harbor, etc.). L’inventaire et les rôles Ansible sont sous `infra/ansible/`.

---

### MinIO et Restic — **pas de secrets GitHub obligatoires** pour le CD actuel

Les workflows **`deploy-vdev` / `deploy-vpreprod` / `deploy-vprod`** ne lisent **aucun** secret nommé `MINIO_*` ou `RESTIC_*`.

| Sujet | Où sont les « secrets » ? |
|--------|----------------------------|
| **Routes Traefik** vers `minio.dsp5…` et `restic.dsp5…` | Fichier versionné **`infra/vps/traefik/dynamic/minio.yml`** + script **`infra/deploy/apply-traefik-minio-from-app.sh`** (exécuté sur le VPS **via SSH déjà configuré** avec `VPS_SSH_KEY`, etc.). |
| **Identifiants MinIO** (console, API S3) | Définis **sur le VPS** lors du premier déploiement (ex. Ansible `group_vars`, variables d’environnement du conteneur `thetiptop-minio`) — **pas** dans GitHub Actions pour cette chaîne. |
| **Restic** (mot de passe du dépôt, backups Mongo) | En pratique : **cron / systemd sur le VPS** ou variables locales ; l’ancienne doc `.github/BACKUP-MINIO-RESTIC.md` évoquait des secrets pour d’**anciens** workflows Kubernetes, pas pour les `deploy-v*` actuels. |

**Quand ajouter des secrets GitHub pour MinIO/Restic ?**  
Seulement si tu crées **un nouveau workflow** Actions qui, depuis les runners GitHub, appelle MinIO ou lance Restic (backup distant). Ce n’est **pas** le cas du déploiement décrit ci‑dessus.

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
