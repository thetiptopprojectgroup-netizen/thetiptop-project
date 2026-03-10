# SendGrid – Newsletter Thé Tip Top

SendGrid est utilisé pour envoyer l’**email de bienvenue** lorsqu’un visiteur s’inscrit à la newsletter depuis le site.

## 1. Configuration

### Créer un compte SendGrid

1. Inscription sur [sendgrid.com](https://sendgrid.com) (offre gratuite : 100 emails/jour pendant 60 jours).
2. Vérifier votre adresse email pour activer le compte.

### Créer une clé API

1. Aller dans **Settings** → **API Keys** : [app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys).
2. **Create API Key** : nom (ex. `thetiptop-newsletter`), permission **Restricted** → activer uniquement **Mail Send** → **Create**.
3. Copier la clé (elle ne sera plus affichée ensuite).

### Vérifier l’expéditeur (obligatoire)

SendGrid n’envoie qu’à partir d’un expéditeur vérifié :

1. **Settings** → **Sender Authentication** : [app.sendgrid.com/settings/sender_auth](https://app.sendgrid.com/settings/sender_auth).
2. **Single Sender Verification** : ajouter un expéditeur (nom + email, ex. `noreply@thetiptop.fr` ou votre email perso pour les tests).
3. Cliquer sur le lien reçu par email pour vérifier.

### Variables d’environnement

Dans le fichier `.env` du serveur (à la racine de `server/`) :

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=votre_email_verifie@exemple.com
SENDGRID_FROM_NAME=Thé Tip Top
```

- `SENDGRID_FROM_EMAIL` doit être exactement l’email vérifié dans SendGrid (Single Sender).
- Si ces variables sont absentes, l’inscription à la newsletter fonctionne toujours (email en base) mais aucun email de bienvenue n’est envoyé.

## 2. Tester l’envoi

### Option A : Depuis le site (recommandé)

1. Démarrer l’API : `cd server && npm run dev`.
2. Démarrer le client : `cd client && npm run dev`.
3. Aller sur la page d’accueil, scroller jusqu’au footer.
4. Saisir **votre propre email** dans le formulaire « Newsletter » et valider.
5. Vérifier la boîte de réception (et les spams) : vous devez recevoir l’email « Bienvenue dans la newsletter Thé Tip Top ».

### Option B : Appel API direct (curl)

```bash
curl -X POST http://localhost:5000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"votre@email.com\", \"consent\": true}"
```

Réponse attendue : `201` avec `"success": true`. Vérifier ensuite la réception de l’email.

### Option C : PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/newsletter/subscribe" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"votre@email.com","consent":true}'
```

## 3. Dépannage

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| Pas d’email reçu | `SENDGRID_API_KEY` absente ou invalide | Vérifier `.env` et la clé dans SendGrid. |
| Erreur 403 / "Sender not verified" | Expéditeur non vérifié | Vérifier **Single Sender** dans SendGrid et utiliser exactement cet email dans `SENDGRID_FROM_EMAIL`. |
| Email en spam | Comportement normal en test | Vérifier le dossier spam ; en prod, configurer SPF/DKIM (Domain Authentication) dans SendGrid. |
| Inscription OK mais pas d’email | SendGrid désactivé (pas de clé) | L’app enregistre l’inscrit mais n’envoie pas. Ajouter `SENDGRID_API_KEY` pour activer l’envoi. |

Les erreurs d’envoi SendGrid sont loguées côté serveur (sans faire échouer l’inscription) :

```
[Newsletter] Échec envoi email bienvenue: ...
```

## 4. Dev / Preprod / Prod (Kubernetes) – à chaque push

Pour que l’email de bienvenue soit envoyé **en dev, preprod et prod** à chaque déploiement (push sur la branche) :

1. **GitHub** → **Settings** → **Secrets and variables** → **Actions**.
2. Créer les secrets :
   - **`SENDGRID_API_KEY`** : votre clé API SendGrid (ex. `SG.xxx...`).
   - **`SENDGRID_FROM_EMAIL`** : l’email vérifié dans SendGrid (ex. `thetiptopprojectgroup@gmail.com`).
   - **`SENDGRID_FROM_NAME`** (optionnel) : `Thé Tip Top`.

Le workflow CD (`cd-deploy.yml`) injecte ces valeurs dans le secret Kubernetes `backend-secret` à chaque déploiement. Les backends dev, preprod et prod utilisent alors la même clé et le même expéditeur (vous pouvez créer des clés ou expéditeurs différents plus tard si besoin).

- **Ne jamais** commiter la clé API dans le dépôt.
- Pour un domaine dédié (ex. `thetiptop.fr`), configurer **Domain Authentication** dans SendGrid pour améliorer la délivrabilité.
