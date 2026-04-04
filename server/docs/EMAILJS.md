# EmailJS — Newsletter Thé Tip Top

L’API backend envoie les emails via **EmailJS** (REST `POST /api/v1.0/email/send`) : bienvenue à l’inscription, optionnellement confirmation de désinscription.

## 1. Compte et service

1. Créer un compte sur [emailjs.com](https://www.emailjs.com/) (quota gratuit mensuel).
2. **Email Services** : ajouter un service (Gmail, Outlook, etc.) et le connecter.
3. **Email Templates** :
   - **Newsletter — bienvenue** : un modèle HTML prêt à l’emploi se trouve dans **`docs/emailjs-template-welcome.html`** (copier le contenu dans EmailJS → Templates → onglet HTML). Variables : `{{user_email}}`, `{{to_email}}`, `{{unsubscribe_url}}`.
   - **Newsletter — au revoir** (optionnel) : `{{user_email}}`.
4. **Account → API keys** : copier la **Public Key** et la **Private Key** (recommandée pour les appels serveur).
5. **Account → Security** : activer l’accès API pour les applications **non navigateur** (serveur / Docker). Sinon l’API renvoie **403** : *API access from non-browser environments is currently disabled* — [réglages sécurité](https://dashboard.emailjs.com/admin/account/security).

## 2. Variables d’environnement (serveur)

```env
CLIENT_URL=https://votre-domaine.fr

EMAILJS_SERVICE_ID=service_xxxx
EMAILJS_PUBLIC_KEY=votre_public_key
EMAILJS_PRIVATE_KEY=votre_private_key

EMAILJS_TEMPLATE_NEWSLETTER_WELCOME=template_xxxx
EMAILJS_TEMPLATE_NEWSLETTER_GOODBYE=template_yyyy
```

- Sans `EMAILJS_TEMPLATE_*` / clés manquantes, l’inscription en base fonctionne mais **aucun email** n’est envoyé.
- `EMAILJS_TEMPLATE_NEWSLETTER_GOODBYE` peut être omis : la désinscription ne déclenchera pas d’email de confirmation.

## 3. Test

1. Renseigner le `.env` du serveur.
2. Redémarrer l’API.
3. S’inscrire depuis le pied de page : vérifier la réception et les logs serveur en cas d’erreur.

## 4. Dépannage

| Problème | Piste |
|----------|--------|
| 403 *non-browser environments disabled* | Activer l’accès API hors navigateur dans [Account → Security](https://dashboard.emailjs.com/admin/account/security). |
| 401 / 403 (autres) | Vérifier `EMAILJS_PUBLIC_KEY` et `EMAILJS_PRIVATE_KEY`. |
| Template introuvable | Vérifier les IDs `template_…` et `service_…`. |
| Email non reçu | Spam ; quota EmailJS ; champs du modèle (destinataire = souvent `{{user_email}}` ou `{{to_email}}` selon la config du template). |
