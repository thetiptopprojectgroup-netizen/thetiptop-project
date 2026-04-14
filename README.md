# 🍵 Thé Tip Top - Jeu-Concours

Application web pour le jeu-concours Thé Tip Top célébrant l'ouverture de la 10ème boutique à Nice.

## 📋 Fonctionnalités

### Visiteurs
- Présentation du jeu-concours et des lots à gagner
- Inscription via formulaire ou OAuth (Google/Facebook)
- Connexion sécurisée

### Participants
- Validation des codes tickets (10 caractères)
- Découverte instantanée du lot gagné
- Historique des participations et gains
- Gestion du profil

### Employés boutique
- Recherche des gains d'un client par email
- Validation et remise des lots
- Marquage des lots comme "récupérés"

### Administrateurs
- Dashboard avec statistiques complètes
- Gestion des utilisateurs
- Export des emails pour emailing (RGPD compliant)
- Tirage au sort du gros lot final

## 🏗️ Architecture

```
thetiptop/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── store/         # State management (Zustand)
│   │   ├── services/      # Services API
│   │   └── styles/        # Styles CSS (Tailwind)
│   └── ...
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── config/        # Configuration (DB, Passport)
│   │   ├── controllers/   # Contrôleurs API
│   │   ├── middlewares/   # Middlewares (auth, validation)
│   │   ├── models/        # Modèles Mongoose
│   │   ├── routes/        # Routes API
│   │   ├── scripts/       # Scripts utilitaires
│   │   └── utils/         # Utilitaires
│   └── ...
├── docker-compose.yml      # Orchestration Docker
└── README.md
```

## 🛠️ Technologies

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Framer Motion** - Animations
- **React Hook Form** - Gestion des formulaires
- **Axios** - Client HTTP

### Backend
- **Node.js 20** - Runtime
- **Express** - Framework web
- **MongoDB** - Base de données
- **Mongoose** - ODM
- **JWT** - Authentification
- **Passport.js** - OAuth (Google, Facebook)
- **bcryptjs** - Hachage des mots de passe

### DevOps
- **Docker & Docker Compose** - Conteneurisation
- **Nginx** - Reverse proxy (production)

## 🚀 Installation

### Prérequis
- Node.js 20+
- MongoDB 7+ (ou Docker)
- npm ou yarn

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/your-repo/thetiptop.git
cd thetiptop

# Configuration des variables d'environnement
cp server/.env.example server/.env
# Éditer server/.env avec vos valeurs

# Installation des dépendances
cd server && npm install
cd ../client && npm install

# Génération des 500 000 tickets et création des utilisateurs admin/employé
cd ../server && npm run seed:all

# Démarrage en développement (2 terminaux)
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Installation avec Docker

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Démarrer les services
docker-compose up -d

# À la première création de la base : générer les 500 000 tickets et créer admin/employé
docker-compose exec api npm run seed:all

# L'application est accessible sur:
# - Frontend: http://localhost:3000
# - API: http://localhost:5000
```

## 📦 Scripts disponibles

### Server
```bash
npm run dev        # Démarrage en mode développement
npm run start      # Démarrage en production
npm run seed       # Génération des 500 000 tickets (codes du jeu)
npm run seed:admin # Création des comptes admin/employé de test
npm run seed:all   # Les deux : 500k tickets + admin/employé (à lancer une fois à la création de la BD)
```

### Client
```bash
npm run dev        # Démarrage en mode développement
npm run build      # Build de production
npm run preview    # Prévisualisation du build
npm run lint       # Vérification ESLint
```

## 🔐 Comptes de test

Après avoir exécuté `npm run seed:admin` :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@thetiptop.fr | Admin123! |
| Employé | employe@thetiptop.fr | Employe123! |

## 📊 API Endpoints

### Authentification
```
POST   /api/auth/register          # Inscription
POST   /api/auth/login             # Connexion
GET    /api/auth/me                # Profil utilisateur
PUT    /api/auth/me                # Mise à jour profil
PUT    /api/auth/password          # Changement mot de passe
POST   /api/auth/forgot-password   # Mot de passe oublié
POST   /api/auth/reset-password/:token
GET    /api/auth/google            # OAuth Google
GET    /api/auth/facebook          # OAuth Facebook
```

### Tickets & Participations
```
GET    /api/tickets/prizes         # Liste des lots
GET    /api/tickets/check/:code    # Vérifier un ticket (public)
POST   /api/tickets/validate       # Valider un ticket (auth)
GET    /api/tickets/my-participations # Mes participations
GET    /api/tickets/code/:code     # Détails ticket (employé)
PUT    /api/tickets/:code/claim    # Remettre un lot (employé)
GET    /api/tickets/customer/:email # Gains d'un client (employé)
```

### Administration
```
GET    /api/admin/stats            # Statistiques complètes
GET    /api/admin/users            # Liste des utilisateurs
PUT    /api/admin/users/:id/role   # Modifier rôle utilisateur
GET    /api/admin/users/emailing   # Utilisateurs pour emailing
GET    /api/admin/users/export     # Export CSV emails
GET    /api/admin/grand-prize      # Résultat gros lot
POST   /api/admin/grand-prize/draw # Tirage au sort gros lot
```

## 🎮 Mécanisme du jeu

### Règles
- **Période** : 30 jours (1-30 mars 2026)
- **Réclamation** : 30 jours supplémentaires (jusqu'au 29 avril 2026)
- **Condition** : Achat ≥ 49€ = 1 ticket avec code unique
- **100% gagnants** : Chaque ticket donne droit à un lot

### Distribution des lots (500 000 tickets)
| Lot | Quantité | Pourcentage | Valeur |
|-----|----------|-------------|--------|
| Infuseur à thé | 300 000 | 60% | 10€ |
| Thé détox/infusion 100g | 100 000 | 20% | 15€ |
| Thé signature 100g | 50 000 | 10% | 25€ |
| Coffret découverte 39€ | 30 000 | 6% | 39€ |
| Coffret découverte 69€ | 20 000 | 4% | 69€ |

### Gros lot final
- **Prix** : 1 an de thé (valeur 360€)
- **Tirage** : Parmi tous les participants
- **Huissier** : Maître Arnaud Rick

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Hachage bcrypt des mots de passe
- Rate limiting sur les endpoints sensibles
- Validation des entrées avec express-validator
- Protection CSRF
- Headers de sécurité (Helmet)
- CORS configuré

## 📱 Responsive Design

L'application est optimisée pour :
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## ♿ Accessibilité

- Conformité WCAG 2.1 AA
- Navigation au clavier
- Labels ARIA
- Contraste des couleurs optimisé
- Textes alternatifs pour les images

## 🌱 RSE & Green IT

- Optimisation des assets (images, fonts)
- Lazy loading des composants
- Mise en cache intelligente
- Réduction des requêtes réseau
- Code splitting automatique

## 🧪 CI/CD & Plan de travail

### Intégration continue (GitHub Actions)

- **` .github/workflows/ci-backend.yml`**, **`ci-frontend.yml`** (+ **`ci-frontend-reusable.yml`**) — **CI — Backend** puis **CI — Frontend** (`workflow_run`, pas d’API dispatch) ; push / PR sur **`vdev`**, **`vpreprod`**, **`vprod`** ; images **`api`** / **`client`**.
- **` .github/workflows/deploy-vdev.yml`** (et **`deploy-vpreprod.yml`**, **`deploy-vprod.yml`**) — déploiement VPS après un run **vert** de **CI — Frontend** sur la branche cible ; PR de promotion après CD vert.
- **` .github/workflows/create-promotion-pr.yml`** — création manuelle d’une PR de promotion si besoin.

Détails : **` .github/workflows/README.md`**.

> Les scripts `npm` (`lint`, `test`, `test:e2e`, `build`) dans `client` et `server` sont consommés par les workflows CI lorsqu’ils sont présents.

## 🚀 Installation

### Prérequis
- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (optionnel)

### Installation locale

1. **Cloner le repository**
```bash
git clone https://github.com/votre-repo/thetiptop.git
cd thetiptop
```

2. **Configuration du backend**
```bash
cd server
cp .env.example .env
# Éditer .env avec vos configurations
npm install
```

3. **Configuration du frontend**
```bash
cd ../client
npm install
```

4. **Démarrer MongoDB**
```bash
# Avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Ou installation locale
mongod --dbpath /path/to/data
```

5. **Générer les tickets (500 000)**
```bash
cd server
npm run seed
```

6. **Créer les comptes admin/employé**
```bash
npm run create-admin
```

7. **Démarrer l'application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Installation avec Docker

```bash
# Développement
docker-compose up -d

# Production
docker-compose --profile production up -d
```

## 🔑 Variables d'environnement

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/thetiptop

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d

# OAuth Google (voir .github/OAUTH-GOOGLE.md pour la configuration détaillée)
BACKEND_URL=http://localhost:5000
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret

# OAuth Facebook
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret

# Client URL
CLIENT_URL=http://localhost:3000

# Contest dates
CONTEST_START_DATE=2026-03-01
CONTEST_END_DATE=2026-03-30
CONTEST_CLAIM_END_DATE=2026-04-29
```

## 📡 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |
| PUT | `/api/auth/me` | Mise à jour profil |
| PUT | `/api/auth/password` | Changement mot de passe |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password/:token` | Réinitialisation |
| GET | `/api/auth/google` | OAuth Google |
| GET | `/api/auth/facebook` | OAuth Facebook |

### Tickets
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets/prizes` | Liste des lots |
| GET | `/api/tickets/check/:code` | Vérifier un ticket |
| POST | `/api/tickets/validate` | Valider un ticket |
| GET | `/api/tickets/my-participations` | Mes participations |
| GET | `/api/tickets/code/:code` | Détails ticket (employé) |
| PUT | `/api/tickets/:code/claim` | Marquer comme récupéré |
| GET | `/api/tickets/customer/:email` | Gains d'un client |

### Administration
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/stats` | Statistiques globales |
| GET | `/api/admin/users` | Liste utilisateurs |
| PUT | `/api/admin/users/:id/role` | Modifier rôle |
| GET | `/api/admin/users/emailing` | Utilisateurs emailing |
| GET | `/api/admin/users/export` | Export CSV |
| GET | `/api/admin/grand-prize` | Résultat gros lot |
| POST | `/api/admin/grand-prize/draw` | Tirage gros lot |

## 🎯 Lots à gagner

| Lot | Valeur | Probabilité | Quantité |
|-----|--------|-------------|----------|
| Infuseur à thé | 10€ | 60% | 300 000 |
| Thé détox/infusion 100g | 15€ | 20% | 100 000 |
| Thé signature 100g | 25€ | 10% | 50 000 |
| Coffret découverte 39€ | 39€ | 6% | 30 000 |
| Coffret découverte 69€ | 69€ | 4% | 20 000 |

**Gros lot final** : 1 an de thé (360€) - Tirage au sort parmi tous les participants

## 🛡️ Sécurité

- Authentification JWT avec refresh tokens
- Hash des mots de passe (bcrypt, 12 rounds)
- Rate limiting (100 req/15min, 10/h pour auth)
- Validation des entrées (express-validator)
- Headers de sécurité (Helmet)
- CORS configuré
- Protection XSS/CSRF

## 📊 Technologies

### Frontend
- React 18
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router DOM
- React Hook Form
- Framer Motion
- Lucide React (icônes)

### Backend
- Node.js 20
- Express 4
- MongoDB + Mongoose
- Passport.js (OAuth)
- JWT (jsonwebtoken)
- Bcrypt.js
- Express Validator

### DevOps
- Docker & Docker Compose
- MongoDB 7.0
- Nginx (reverse proxy)

## 📝 Scripts disponibles

### Backend
```bash
npm run dev        # Démarrage en développement
npm run start      # Démarrage en production
npm run seed       # Génération des 500 000 tickets
npm run create-admin # Création des comptes admin/employé
```

### Frontend
```bash
npm run dev        # Serveur de développement
npm run build      # Build de production
npm run preview    # Prévisualisation du build
npm run lint       # Vérification ESLint
```

## 👥 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@thetiptop.fr | Admin123! | Admin |
| employe@thetiptop.fr | Employe123! | Employé |

## 📄 Licence

Ce projet est un projet étudiant fictif réalisé dans le cadre de la formation Expert en Stratégie et Transformation Digitale (DSP5).

**Client fictif** : Thé Tip Top - SA au capital de 150 000€
**Agence fictive** : Furious Ducks

---

🍵 Développé avec ❤️ pour le projet Thé Tip Top
│   │   ├── middlewares/   # Middlewares (auth, validation)
│   │   ├── models/        # Modèles Mongoose
│   │   ├── routes/        # Routes API
│   │   ├── scripts/       # Scripts utilitaires
│   │   └── utils/         # Fonctions utilitaires
│   └── ...
├── docker-compose.yml      # Configuration Docker
└── README.md
```

## 🚀 Installation

### Prérequis
- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (optionnel)

### Installation locale

1. **Cloner le repository**
```bash
git clone https://github.com/your-repo/thetiptop.git
cd thetiptop
```

2. **Installer les dépendances du serveur**
```bash
cd server
npm install
cp .env.example .env
# Configurer les variables d'environnement
```

3. **Installer les dépendances du client**
```bash
cd ../client
npm install
```

4. **Générer les tickets**
```bash
cd ../server
npm run seed
```

5. **Démarrer l'application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Installation avec Docker

```bash
# Développement
docker-compose up -d

# Production
docker-compose --profile production up -d
```

## 🔧 Configuration

### Variables d'environnement (server/.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/thetiptop

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Client URL
CLIENT_URL=http://localhost:3000

# Contest dates
CONTEST_START_DATE=2026-03-01T00:00:00.000Z
CONTEST_END_DATE=2026-03-30T23:59:59.999Z
CLAIM_END_DATE=2026-04-29T23:59:59.999Z
```

## 📡 API Endpoints

### Authentication
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |
| PUT | `/api/auth/me` | Mise à jour profil |
| PUT | `/api/auth/password` | Changement mot de passe |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password/:token` | Réinitialisation |
| GET | `/api/auth/google` | OAuth Google |
| GET | `/api/auth/facebook` | OAuth Facebook |

### Tickets
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets/prizes` | Liste des lots |
| GET | `/api/tickets/check/:code` | Vérifier un ticket |
| POST | `/api/tickets/validate` | Valider un ticket |
| GET | `/api/tickets/my-participations` | Mes participations |
| GET | `/api/tickets/code/:code` | Détails ticket (employé) |
| PUT | `/api/tickets/:code/claim` | Marquer lot récupéré |
| GET | `/api/tickets/customer/:email` | Lots d'un client |

### Administration
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/stats` | Statistiques |
| GET | `/api/admin/users` | Liste utilisateurs |
| PUT | `/api/admin/users/:id/role` | Modifier rôle |
| GET | `/api/admin/users/emailing` | Emails marketing |
| GET | `/api/admin/users/export` | Export CSV |
| GET | `/api/admin/grand-prize` | Résultat gros lot |
| POST | `/api/admin/grand-prize/draw` | Tirage au sort |

## 🎰 Distribution des lots

| Lot | Quantité | Pourcentage | Valeur |
|-----|----------|-------------|--------|
| Infuseur à thé | 300 000 | 60% | 10€ |
| Thé détox/infusion 100g | 100 000 | 20% | 15€ |
| Thé signature 100g | 50 000 | 10% | 25€ |
| Coffret découverte 39€ | 30 000 | 6% | 39€ |
| Coffret découverte 69€ | 20 000 | 4% | 69€ |
| **Total** | **500 000** | **100%** | - |

**Gros lot final** : 1 an de thé (360€) - Tirage au sort parmi tous les participants

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:coverage

# Tests E2E
npm run test:e2e
```

## 📦 Déploiement

### Production

1. Construire les images Docker
```bash
docker-compose -f docker-compose.prod.yml build
```

2. Déployer
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD (Jenkins)

Le projet utilise Jenkins pour l'intégration continue :
- Build automatique à chaque push
- Tests automatisés
- Déploiement en preprod/prod
- Métriques et rapports

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- OAuth 2.0 (Google, Facebook)
- Rate limiting
- Validation des entrées
- Protection CSRF
- Headers de sécurité (Helmet)
- Chiffrement des mots de passe (bcrypt)
- Conformité RGPD

## 📊 Technologies

### Frontend
- React 18
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router
- React Hook Form
- Framer Motion
- Lucide Icons

### Backend
- Node.js 20
- Express.js
- MongoDB + Mongoose
- Passport.js
- JWT
- Nodemailer

### DevOps
- Docker
- Docker Compose
- Jenkins
- Nginx
- Prometheus (métriques)

## 👥 Équipe

Projet réalisé dans le cadre du diplôme Expert en Stratégie et Transformation Digitale (DSP5).

**Client** : Thé Tip Top (SA)
- Gérant : Eric Bourdon
- Siège : 18 rue Léon Frot, 75011 Paris

**Agence** : Furious Ducks
- Directeur : Guido Brasletti

## 📄 Licence

Ce projet est un exercice pédagogique. Aucun achat réel n'est possible.

---

🍵 *Thé Tip Top - Le thé d'exception, 100% bio, 100% gagnant !*
│   │   ├── middlewares/   # Middlewares (auth, validation)
│   │   ├── models/        # Modèles Mongoose
│   │   ├── routes/        # Routes API
│   │   ├── scripts/       # Scripts utilitaires
│   │   └── utils/         # Utilitaires (JWT, etc.)
│   └── ...
├── docker-compose.yml      # Configuration Docker
└── README.md
```

## 🚀 Installation

### Prérequis

- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (optionnel)

### Installation locale

1. **Cloner le repository**
```bash
git clone https://github.com/votre-repo/thetiptop.git
cd thetiptop
```

2. **Configurer le backend**
```bash
cd server
cp .env.example .env
# Éditer .env avec vos configurations
npm install
```

3. **Configurer le frontend**
```bash
cd ../client
npm install
```

4. **Lancer MongoDB**
```bash
# Via Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Ou installation locale
mongod --dbpath /data/db
```

5. **Initialiser les données**
```bash
cd ../server
npm run seed        # Génère 500 000 tickets
npm run create-admin # Crée les comptes admin/employé
```

6. **Démarrer les serveurs**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Installation avec Docker

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 🔧 Configuration

### Variables d'environnement (Backend)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur API | 5000 |
| `NODE_ENV` | Environnement | development |
| `MONGODB_URI` | URI MongoDB | mongodb://localhost:27017/thetiptop |
| `JWT_SECRET` | Clé secrète JWT | - |
| `JWT_EXPIRES_IN` | Durée validité token | 7d |
| `CLIENT_URL` | URL du frontend | http://localhost:3000 |
| `GOOGLE_CLIENT_ID` | OAuth Google | - |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | - |
| `FACEBOOK_APP_ID` | OAuth Facebook | - |
| `FACEBOOK_APP_SECRET` | OAuth Facebook | - |
| `CONTEST_START_DATE` | Début concours | 2026-03-01 |
| `CONTEST_END_DATE` | Fin concours | 2026-03-30 |
| `CLAIM_END_DATE` | Fin réclamation | 2026-04-29 |

## 📡 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |
| PUT | `/api/auth/me` | Modifier profil |
| PUT | `/api/auth/password` | Changer mot de passe |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| GET | `/api/auth/google` | OAuth Google |
| GET | `/api/auth/facebook` | OAuth Facebook |

### Tickets
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tickets/prizes` | Liste des lots |
| GET | `/api/tickets/check/:code` | Vérifier un code |
| POST | `/api/tickets/validate` | Valider un ticket |
| GET | `/api/tickets/my-participations` | Mes participations |
| PUT | `/api/tickets/:code/claim` | Marquer récupéré |

### Administration
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/stats` | Statistiques |
| GET | `/api/admin/users` | Liste utilisateurs |
| PUT | `/api/admin/users/:id/role` | Modifier rôle |
| GET | `/api/admin/users/export` | Export CSV |
| POST | `/api/admin/grand-prize/draw` | Tirage au sort |

## 🎮 Règles du jeu

- **Durée** : 30 jours (1-30 mars 2026)
- **Réclamation** : +30 jours (jusqu'au 29 avril 2026)
- **Condition** : Achat ≥ 49€
- **Tickets** : 500 000 codes uniques
- **100% gagnants** avec distribution :
  - 60% : Infuseur à thé (10€)
  - 20% : Thé détox/infusion 100g (15€)
  - 10% : Thé signature 100g (25€)
  - 6% : Coffret découverte (39€)
  - 4% : Coffret prestige (69€)
- **Gros lot** : Tirage au sort final pour 1 an de thé (360€)

## 🔒 Sécurité

- Authentification JWT
- Hashage bcrypt des mots de passe
- Rate limiting sur les endpoints sensibles
- Validation des entrées (express-validator)
- Protection CORS
- Headers sécurisés (Helmet)
- OAuth 2.0 (Google, Facebook)

## 📊 Technologies

### Frontend
- React 18, Vite, TailwindCSS
- Zustand, React Router v6
- React Hook Form, Framer Motion
- Axios, Lucide React

### Backend
- Node.js, Express.js
- MongoDB + Mongoose
- Passport.js, JWT, bcrypt

### DevOps
- Docker & Docker Compose
- Nginx, GitHub Actions (CI/CD)

## 👥 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@thetiptop.fr | Admin123! | Admin |
| employe@thetiptop.fr | Employe123! | Employé |

## 📝 Scripts

```bash
# Backend
npm run dev          # Mode développement
npm run seed         # Générer les tickets
npm run create-admin # Créer comptes admin/employé

# Frontend
npm run dev      # Mode développement
npm run build    # Build production
```

## 📄 Licence

Projet étudiant fictif - Expert en Stratégie et Transformation Digitale (DSP5)

---

🍵 Développé avec ❤️ pour le diplôme DSP5
