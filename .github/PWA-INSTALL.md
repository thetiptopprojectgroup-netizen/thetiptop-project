# Pourquoi le bouton « Installer » ou la proposition du navigateur n’apparaissent pas ?

## En bref

- **Le bouton « Installer »** dans notre bannière n’apparaît que lorsque le navigateur envoie l’événement `beforeinstallprompt`. C’est le navigateur qui décide quand le proposer.
- **L’icône d’installation** (⊕ ou « Installer ») dans la barre d’adresse de Chrome/Edge n’apparaît que si le site est considéré comme **installable** et que le navigateur a appliqué ses critères d’engagement.

## Critères techniques (obligatoires)

Pour que le site soit installable, il faut :

1. **HTTPS** (ou `localhost`) – pas d’installation en HTTP.
2. **Manifest** valide – `name`, `short_name`, `start_url`, `display`, icônes 192px et 512px (déjà configuré dans `vite.config.js`).
3. **Service worker** enregistré – généré par `vite-plugin-pwa` au build (et en dev si `devOptions.enabled: true`).

Si l’un de ces points manque, le navigateur ne proposera jamais l’installation.

## Critères d’engagement (Chrome / Edge)

Même quand tout est correct, **Chrome et Edge n’affichent pas tout de suite** l’icône d’installation ni l’événement `beforeinstallprompt`. Ils appliquent des règles internes, par exemple :

- **Temps passé** sur le site (ex. ~30 secondes).
- **Nombre de visites** (ex. 2 visites sur une période).
- **Interactions** (clics, navigation).
- **Pas déjà installé** – si l’app est déjà installée, plus de proposition.

On ne peut pas forcer le navigateur à afficher la proposition plus tôt. C’est volontaire pour éviter de proposer l’installation dès la première seconde.

## Ce qu’on fait dans l’app

- **Si le navigateur envoie `beforeinstallprompt`** : on affiche le bouton « Installer » dans notre bannière et l’utilisateur peut installer en un clic.
- **Sinon** : on affiche quand même la bannière avec les **instructions manuelles** :
  - Chrome/Edge : icône ⊕ ou « Installer » dans la barre d’adresse, ou menu ⋮ → « Installer Thé Tip Top ».
  - Mobile : menu ⋯ → « Ajouter à l’écran d’accueil ».
  - iOS : Safari → Partager → « Sur l’écran d’accueil ».

## Comment tester

1. **En production (HTTPS)** : déployer le client (build), ouvrir le site en HTTPS, naviguer un peu et revenir une 2ᵉ fois si besoin ; l’icône d’installation peut apparaître dans la barre d’adresse après quelques secondes ou à la 2ᵉ visite.
2. **Vérifier l’installabilité** : Chrome DevTools → onglet **Application** → **Manifest** (pas d’erreur) et **Service Workers** (SW enregistré).
3. **Installation manuelle** : même sans icône automatique, utiliser le menu du navigateur (⋮ → « Installer Thé Tip Top » ou équivalent) si l’app est reconnue comme installable.

## Résumé

| Élément | Raison |
|--------|--------|
| Pas de bouton « Installer » dans notre bannière | Le navigateur n’a pas encore envoyé `beforeinstallprompt` (critères d’engagement non remplis). |
| Pas d’icône ⊕ dans la barre d’adresse | Idem : le navigateur n’a pas encore considéré le site comme « engagé » ou un critère technique manque. |
| Solution | Utiliser les instructions manuelles (menu → Installer / Ajouter à l’écran d’accueil) ou revenir sur le site plus tard pour laisser le navigateur proposer l’installation. |
