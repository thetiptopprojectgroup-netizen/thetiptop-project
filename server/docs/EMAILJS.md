# EmailJS — Emails Thé Tip Top

L’API envoie les messages via **EmailJS** (REST `POST /api/v1.0/email/send`) : newsletter (bienvenue / désinscription), **attestation de remise de lot** après validation employé.

## 1. Compte et service

1. Créer un compte sur [emailjs.com](https://www.emailjs.com/) (quota gratuit mensuel).
2. **Email Services** : ajouter un service (Gmail, Outlook, etc.) et le connecter.
3. **Email Templates** :
   - **Newsletter — bienvenue** : **`docs/emailjs-template-welcome.html`**. Variables : `{{user_email}}`, `{{to_email}}`, `{{unsubscribe_url}}`.
   - **Newsletter — au revoir** (optionnel) : `{{user_email}}`.
   - **Lot remis — attestation** (optionnel) : **`docs/emailjs-template-prize-delivered.html`**. Variables : `{{to_email}}`, `{{recipient_name}}`, `{{prize_name}}`, `{{prize_description}}`, `{{ticket_code}}`, `{{store_location}}`, `{{date_remise}}`, `{{site_url}}`, etc.
4. **Account → API keys** : **Public Key** et **Private Key** (appels serveur).
5. **Account → Security** : autoriser l’API **hors navigateur** — [réglages](https://dashboard.emailjs.com/admin/account/security).

Chaque template : champ **To Email** = `{{to_email}}` (ou `{{user_email}}`).

## 2. Variables d’environnement (serveur)

```env
CLIENT_URL=https://votre-domaine.fr

EMAILJS_SERVICE_ID=service_xxxx
EMAILJS_PUBLIC_KEY=votre_public_key
EMAILJS_PRIVATE_KEY=votre_private_key

EMAILJS_TEMPLATE_NEWSLETTER_WELCOME=template_xxxx
EMAILJS_TEMPLATE_NEWSLETTER_GOODBYE=template_yyyy
EMAILJS_TEMPLATE_PRIZE_DELIVERED=template_zzzz
```

- Si un `EMAILJS_TEMPLATE_*` est absent, la fonction associée **ne envoie pas** d’email (le reste de l’app continue).
- **Attestation lot** : envoyée au **gagnant** quand un employé confirme la remise (`PUT /api/tickets/:code/claim`), uniquement si `EMAILJS_TEMPLATE_PRIZE_DELIVERED` est défini.

## 3. Test

1. Renseigner le `.env` du serveur.
2. Redémarrer l’API.
3. Newsletter : inscription pied de page. Lot remis : compte employé → remise physique avec code ticket valide.

## 4. Dépannage

| Problème | Piste |
|----------|--------|
| 403 *non-browser environments disabled* | [Account → Security](https://dashboard.emailjs.com/admin/account/security) — API hors navigateur. |
| 401 / 403 (autres) | `EMAILJS_PUBLIC_KEY` / `EMAILJS_PRIVATE_KEY`. |
| Template introuvable | IDs `template_…` et `service_…`. |
| 400 *The template ID not found* | Vérifier que l’ID est **exactement** celui du tableau de bord (ex. `template_keszo9j`), **sans guillemets** dans le `.env`, même compte EmailJS que `EMAILJS_SERVICE_ID`. Sur le VPS : `docker exec thetiptop-vdev-api-1 env \| grep EMAILJS_TEMPLATE_PRIZE` — la valeur doit être identique caractère par caractère. Après modification du secret GitHub, **redéployer** pour réécrire `vdev.env` et recréer le conteneur. |
| 422 *recipients address is empty* | **To Email** = `{{to_email}}` dans le modèle EmailJS. |
| Email non reçu | Spam ; quota ; variables du template. |
