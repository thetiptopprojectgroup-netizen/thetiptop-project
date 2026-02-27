# Inscription / Connexion avec Google

L’application permet de s’inscrire et de se connecter avec un compte Google (OAuth 2.0). Le flux est géré côté backend avec Passport.js et `passport-google-oauth20`.

## 1. Créer un projet et des identifiants Google

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Crée un projet ou sélectionne un projet existant.
3. Menu **APIs et services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth**.
4. Si demandé, configure l’**écran de consentement OAuth** :
   - Type d’application : **Externe** (ou Interne si G Suite).
   - Renseigne le nom de l’application, l’email d’assistance, etc.
5. Type d’application : **Application Web**.
6. Nom : par ex. « Thé Tip Top ».
7. **URI de redirection autorisés** : ajoute l’URL de callback de ton backend :
   - En local : `http://localhost:5000/api/auth/google/callback`
   - En preprod : `https://preprod.thetiptop-jeu.fr/api/auth/google/callback` (ou l’URL publique de ton API + `/api/auth/google/callback`)
   - En prod : `https://ton-domaine.fr/api/auth/google/callback`
8. Enregistre. Copie l’**ID client** et le **Secret client**.

## 2. Configuration en local

Dans le dossier `server`, crée ou édite le fichier `.env` à partir de `.env.example` :

```env
BACKEND_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

GOOGLE_CLIENT_ID=ton_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton_secret_client_google
```

- **BACKEND_URL** : URL publique du backend. En local, `http://localhost:5000`. C’est cette URL qui est utilisée pour construire l’URI de callback (`BACKEND_URL/api/auth/google/callback`).
- **CLIENT_URL** : URL du frontend (redirection après connexion).
- **GOOGLE_CLIENT_ID** et **GOOGLE_CLIENT_SECRET** : identifiants obtenus à l’étape 1.

Redémarre le serveur. Les boutons « Continuer avec Google » sur les pages Connexion et Inscription enverront l’utilisateur vers Google puis, après autorisation, vers ton backend puis ton frontend avec un token JWT.

## 3. Configuration en preprod / prod (Kubernetes)

1. **ConfigMap** : `BACKEND_URL` est dérivé de la même URL que le frontend (clé `client-url` dans la ConfigMap `backend-config`). Si ton API est exposée sous le même domaine (ex. `https://preprod.thetiptop-jeu.fr/api`), c’est déjà cohérent.

2. **Secrets GitHub** (Settings → Secrets and variables → Actions) :
   - `GOOGLE_CLIENT_ID` : ID client OAuth Google.
   - `GOOGLE_CLIENT_SECRET` : Secret client OAuth Google.

Le workflow CD injecte ces secrets dans le secret Kubernetes `backend-secret` (clés `google-client-id` et `google-client-secret`). Le déploiement backend les lit en variables d’environnement. S’ils sont absents, la connexion Google est simplement désactivée (pas d’erreur).

3. **URI de redirection dans Google Cloud** : pour chaque environnement (preprod, prod), ajoute l’URI de redirection correspondante, par ex. :
   - `https://preprod.thetiptop-jeu.fr/api/auth/google/callback`
   - `https://ton-domaine-prod.fr/api/auth/google/callback`

## 4. Comportement côté application

- **Première connexion avec Google** : un utilisateur est créé avec `type_authentification: 'google'`, pas de mot de passe stocké. Il est redirigé vers le frontend avec un JWT.
- **Connexion suivante** : l’utilisateur est reconnu par `googleId` ou email, un JWT est émis.
- **Lien avec un compte existant** : si un compte avec le même email existe déjà (inscription classique), il est rattaché au `googleId` et peut ensuite se connecter avec Google.

## 5. Vérification

- En local : après avoir configuré `.env`, clique sur « Continuer avec Google » sur la page de connexion ou d’inscription. Tu dois être redirigé vers Google puis revenir sur l’app avec un token (ex. redirection vers `/dashboard` ou `/play`).
- En preprod : après avoir ajouté les secrets GitHub et redéployé, le même flux doit fonctionner avec l’URL preprod configurée dans Google Cloud.
