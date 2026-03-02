# Google Analytics – Création de compte et événements (GA4)

Ce guide explique étape par étape comment créer un compte Google Analytics 4 (GA4) pour le projet TheTipTop et comment suivre les **clics CTA**, **vues de page** et **soumissions de formulaire**.

---

## Partie 1 – Créer un compte Google Analytics (GA4)

### Étape 1 : Accéder à Google Analytics

1. Va sur [analytics.google.com](https://analytics.google.com).
2. Connecte-toi avec ton compte Google (celui qui gérera les données du projet).

### Étape 2 : Créer un compte

1. Clique sur **Admin** (engrenage en bas à gauche).
2. Dans la colonne **Compte**, clique sur **Créer un compte**.
3. **Nom du compte** : ex. `TheTipTop` ou `Mon entreprise`.
4. Coche ou décoche les options de partage de données avec Google (selon tes préférences).
5. Clique sur **Suivant**.

### Étape 3 : Créer une propriété (property)

1. **Nom de la propriété** : ex. `TheTipTop – Production` ou `thetiptop-jeu.fr`.
2. Choisis le **fuseau horaire** (ex. France).
3. Choisis la **devise** (ex. Euro).
4. Clique sur **Suivant**.
5. **Secteur d’activité** : ex. Jeux / Loisirs.
6. **Taille de l’entreprise** : selon ton cas.
7. Clique sur **Créer**.
8. Accepte les **Conditions d’utilisation** si demandé.

### Étape 4 : Configurer un flux de données (Data Stream)

1. Choisis la **plateforme** : **Web**.
2. **URL du site** : ex. `https://thetiptop-jeu.fr` (ou ton domaine dev/preprod pour tester).
3. **Nom du flux** : ex. `TheTipTop Production`.
4. Clique sur **Créer le flux**.

### Étape 5 : Récupérer l’identifiant de mesure (Measurement ID)

1. Sur la page du flux Web, tu vois **Identifiant de mesure** : format `G-XXXXXXXXXX`.
2. **Note-le** : tu en auras besoin dans le frontend pour initialiser GA4.
3. Optionnel : active **Amélioration des mesures** (défilement, clics sortants, etc.) si tu veux des événements automatiques en plus des tiens.

Tu as maintenant un **compte GA4**, une **propriété** et un **flux Web** avec un **Measurement ID**. On passe aux événements.

---

## Partie 2 – Comprendre les événements dans GA4

Dans GA4, presque tout est un **événement** :

- Une **vue de page** = événement `page_view` (souvent envoyé automatiquement).
- Un **clic sur un CTA** = événement personnalisé (ex. `click_cta` ou `cta_click`).
- Une **soumission de formulaire** = événement personnalisé (ex. `form_submit` ou `generate_tickets`).

Tu peux envoyer ces événements depuis ton application (frontend) avec la librairie **gtag.js** ou **Google Analytics 4 + gtag**.

---

## Partie 3 – Intégrer GA4 dans le frontend (React)

### Étape 1 : Charger le script GA4

Dans ton app React (ex. `index.html` ou composant racine), ajoute le script Google avec ton **Measurement ID** :

```html
<!-- Dans public/index.html, dans <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Remplace `G-XXXXXXXXXX` par ton identifiant de mesure.

### Étape 2 : Envoyer les événements depuis le code

Une fois `gtag` chargé, tu peux envoyer des événements depuis n’importe quel composant (après connexion, clic, soumission, etc.) :

**Vue de page (déjà souvent automatique, mais tu peux le forcer)**  
À faire au changement de page (ex. dans ton routeur React) :

```javascript
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href,
  page_path: window.location.pathname
});
```

**Clic sur un CTA (bouton)**  
Au clic sur le bouton (ex. « Générer des tickets », « Jouer », « S’inscrire ») :

```javascript
gtag('event', 'click_cta', {
  cta_name: 'generer_tickets',   // nom du CTA
  cta_location: 'home_page',      // où il se trouve
  cta_text: 'Générer des tickets' // optionnel : texte du bouton
});
```

**Soumission d’un formulaire**  
À la soumission réussie du formulaire (login, inscription, génération, etc.) :

```javascript
gtag('event', 'form_submit', {
  form_name: 'login',           // ou 'inscription', 'generation_tickets'
  form_destination: 'dashboard' // où ça mène après succès
});
```

Tu peux utiliser des noms d’événements et des paramètres cohérents avec ton app (ex. `generate_tickets`, `login_success`, etc.).

---

## Partie 4 – Où créer / voir les événements dans l’interface GA4

- **Les événements ne se “créent” pas d’abord dans GA4** : ils sont **envoyés par ton site**. Dès que ton front envoie `gtag('event', 'click_cta', { ... })`, GA4 enregistre l’événement `click_cta`.
- Pour les **voir** :
  1. **Rapports** → **Engagement** → **Événements** : liste de tous les événements (dont `page_view`, `click_cta`, `form_submit`).
  2. **Admin** → **Propriété** → **Événements** : liste des événements reçus ; tu peux marquer certains comme “à afficher en recommandé” ou les utiliser dans les rapports personnalisés.

Pour les **clics CTA**, **vues de page** et **soumissions de formulaire**, il suffit donc d’envoyer les bons appels `gtag('event', ...)` depuis ton code, puis de consulter **Engagement → Événements** (et éventuellement créer des rapports ou explorations avec ces événements).

---

## Partie 5 – Récapitulatif des étapes côté “création de compte”

| Étape | Action |
|-------|--------|
| 1 | Aller sur analytics.google.com et se connecter |
| 2 | Admin → Créer un compte (ex. TheTipTop) |
| 3 | Créer une propriété (ex. thetiptop-jeu.fr) |
| 4 | Créer un flux de données **Web** avec l’URL du site |
| 5 | Noter le **Measurement ID** (G-XXXXXXXXXX) |

Ensuite : intégrer le script GA4 dans le frontend, puis envoyer les événements (page_view, click_cta, form_submit) comme ci-dessus. Les “création” d’événements se font donc **dans le code** du projet, et leur consultation dans **Rapports → Engagement → Événements** (et Admin → Événements) dans GA4.
