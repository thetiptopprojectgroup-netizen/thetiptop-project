# Rapport d’analyse — Plateforme de jeu-concours Thé Tip Top

Document de synthèse : architecture applicative, infra, CI/CD, observabilité, sauvegardes, SEO et documentation du dépôt.

---

## 1. Synthèse exécutive

Le projet est un **monorepo** : **client React (Vite)**, **API Node (Express)**, **MongoDB**, avec **trois environnements** cibles (**vdev / vpreprod / vprod**) sur un **VPS** unique, derrière **Traefik** et **Harbor**, avec chaîne **CI/CD GitHub Actions**, **provisionnement Ansible** (Docker, pare-feu, Traefik, MinIO, Harbor, Restic), **observabilité** (Prometheus, Grafana, cAdvisor, node-exporter, métriques applicatives), **logs centralisés** (Filebeat, Elasticsearch, Kibana), **sauvegardes Restic** vers **MinIO**, et une couche **SEO / Search Console / GA4** côté front.

Un **docker-compose** à la racine sert au **développement local** (et un profil **nginx** pour un scénario proche de la prod locale).

---

## 2. Couche applicative

### 2.1 Frontend (`client/`)

| Élément | Rôle |
|--------|------|
| **React 18 + Vite** | SPA : pages publiques, espace joueur, employé, admin. |
| **React Router** | Routage côté client ; URLs indexables pour le SEO (avec `SeoHead`). |
| **Zustand** | État global (auth). |
| **Axios** | Appels HTTP vers `/api`. |
| **Tailwind + Framer Motion** | UI et animations. |
| **react-hot-toast** | Retours utilisateur. |
| **Jest + Testing Library** | Tests unitaires front. |
| **prebuild `generate-seo.js`** | Génère **sitemap.xml** et **robots.txt** à chaque build. |
| **`SeoHead` + `config/seo.js`** | Titres, descriptions, OG/Twitter, canonique, `noindex` sur zones sensibles. |
| **`analytics/gtag.js` + `GoogleAnalytics.jsx`** | GA4 après consentement cookies. |
| **PWA** | `manifest.webmanifest`, `sw.js` — installation « comme une app » (voir `.github/PWA-INSTALL.md`). |
| **CookieConsent** | Bandeau RGPD ; conditionne le chargement de GA. |

**Pages** (exemples) : accueil, lots, comment ça marche, règlement, FAQ, légal, CGU, confidentialité, jeu, dashboard, profil, employé, admin, connexion / inscription, mot de passe oublié / reset, désinscription newsletter, sitemap page, etc.

### 2.2 Backend (`server/`)

| Élément | Rôle |
|--------|------|
| **Express** | API REST sous `/api`. |
| **Helmet** | En-têtes HTTP de sécurité. |
| **CORS** | Origine `CLIENT_URL`. |
| **express-rate-limit** | Limitation : API globale, auth, newsletter. |
| **Morgan** | Logs HTTP → stdout → Docker → Filebeat. |
| **Passport** | OAuth Google (web + credential) et Facebook. |
| **JWT** | Sessions API après login. |
| **express-validator** | Validation des entrées. |
| **Mongoose** | Modèles métier. |
| **prom-client** | **`/metrics`** et **`/api/metrics`**. |
| **Nodemailer** | Mails selon configuration (voir `server/docs/EMAILJS.md`). |

**Regroupement des routes** :

- **`/api/auth`** : inscription, connexion, mot de passe oublié / reset, OAuth, profil, logout, suppression compte.
- **`/api/tickets`** : lots, vérification code, participations, réclamation (joueur / employé), recherche clients, remises boutique.
- **`/api/admin`** : statistiques, configuration concours, codes, utilisateurs (export emailing), tirage au sort, boutiques, employés, session de jeu.
- **`/api/newsletter`** : inscription / désinscription.
- **`/api/telemetry`** : événements produit (ex. bouton jouer).
- **`/api/health`** : santé de l’API.
- **`/api/contest-info`** : statut temporel du concours (`ContestConfig`, `MAX_TICKETS`).

**Tests** : unitaires, intégration, fonctionnels (Jest + Supertest).

---

## 3. Données et persistance

| Élément | Rôle |
|--------|------|
| **MongoDB 7** | Base métier. |
| **`mongo-init.js`** | Utilisateur applicatif, index **users**, **codes**, **participations** (premier démarrage du conteneur). |
| **Scripts seed** | Codes, admin, employé (`seedTickets.js`, `createAdmin.js`, etc.). |
| **`ContestConfig`** | Dates de concours modifiables depuis l’admin. |

---

## 4. Développement local vs production

| Élément | Rôle |
|--------|------|
| **`docker-compose.yml` (racine)** | Mongo + api + client en dev avec volumes ; **profil `production`** : **nginx** + `nginx/nginx.conf` (reverse proxy local, alternative au Traefik du VPS). |
| **`docker-compose.dev.yml`** | Variante de développement. |
| **`client/Dockerfile`** | Builder Vite + SEO, image **nginx** prod, stage **development**. |
| **`server/Dockerfile`** | Image API. |

---

## 5. Déploiement sur le VPS

| Élément | Rôle |
|--------|------|
| **`infra/deploy/docker-compose.stack.yml`** | Par env : Mongo, api, client ; labels **Traefik** ; réseaux **internal** + **traefik**. |
| **`infra/deploy/env/*.env`** | Secrets et URLs (non commités ; injectés via GitHub Secrets en CI). |
| **Traefik** | HTTPS, certificats **Let’s Encrypt** (`certresolver: le`). |
| **`infra/vps/traefik/dynamic/*.yml`** | Routage fichier pour Harbor, MinIO, monitoring, logging. |

**Fichiers Traefik dynamiques** :

- **`harbor.yml`** : UI Harbor (backend proxy Harbor).
- **`minio.yml`** : console MinIO (port 9001) et API S3 (port 9000) sur hosts distincts ; redirection legacy `/console`.
- **`monitoring.yml`** : Grafana et Prometheus.
- **`logging.yml`** : Kibana.

---

## 6. Registre d’images et livraison

| Élément | Rôle |
|--------|------|
| **Harbor** | Registry privé ; projets **vdev / vpreprod / vprod** dans les workflows. |
| **`infra/scripts/ensure-harbor-project.sh`** | Vérification / création de projet Harbor. |
| **`normalize-env-for-github.sh`** | Normalisation d’environnement pour les workflows. |
| **CI** | Build + push images **api** et **client** si secrets Harbor configurés (`VITE_*`, `SITE_URL`, etc.). |

**CD** (`deploy-vdev`, `deploy-vpreprod`, `deploy-vprod`) : gate CI (vprod), build & push, rsync, `docker compose`, scripts monitoring / logging / traefik-minio / Ansible **restic** selon configuration.

---

## 7. CI/CD GitHub Actions

| Workflow | Rôle |
|----------|------|
| **`ci.yml`** | Lint → unit → integration → functional → build ; jobs Harbor optionnels ; PR promotion automatique (vdev → vpreprod → vprod) si configuré. |
| **`deploy-v*.yml`** | Déploiement par branche ; environnements GitHub ; secrets `*_ENV_FILE`. |
| **`create-promotion-pr.yml`** | Promotion manuelle de branche si l’automatique n’a pas eu lieu. |

Référence secrets : `.github/GITHUB-SECRETS.md`, `DEPLOYMENT_CHECKLIST.md`.

---

## 8. Ansible

| Rôle | Rôle concret |
|------|----------------|
| **docker** | Moteur Docker. |
| **firewall** | **UFW** (SSH, 80, 443, ports Harbor/MinIO selon `group_vars`). |
| **traefik_network** | Réseau Docker **`traefik`**. |
| **traefik** | Déploiement Traefik. |
| **minio** | MinIO + buckets applicatifs et **\*-restic** pour Restic. |
| **harbor** | Installation Harbor. |
| **restic_client** | Restic, scripts de backup, crons, watch Mongo optionnel. |

**`infra/deploy/run-ansible-restic.sh`** : playbook avec `--tags restic` après déploiement.

---

## 9. Observabilité

| Composant | Rôle |
|-----------|------|
| **Prometheus** | TSDB ; scrape node-exporter, cAdvisor, `/api/metrics` HTTPS sur les FQDN vdev / vpreprod / vprod. |
| **Grafana** | Dashboards (ex. `thetiptop-overview.json` : CPU/RAM par stack `thetiptop-vdev|vpreprod|vprod`). |
| **cAdvisor** | Métriques par conteneur. |
| **node-exporter** | Métriques hôte VPS. |
| **`apply-monitoring-from-app.sh`** | Déploiement stack + copie règle Traefik monitoring. |

**Télémétrie** : `/api/telemetry/*` + compteurs `monitoring/metrics.js`.

---

## 10. Logs centralisés (ELK)

| Composant | Rôle |
|-----------|------|
| **Filebeat** | Logs conteneurs Docker → Elasticsearch. |
| **Elasticsearch** | Stockage. |
| **Kibana** | Recherche / visualisation. |
| **`apply-logging-from-app.sh`**, **`ci-write-remote-logging-env.sh`** | Déploiement et env depuis GitHub. |

---

## 11. Sauvegardes et stockage objet

| Élément | Rôle |
|--------|------|
| **MinIO** | API S3 ; buckets Restic (**\*-restic**) ; buckets applicatifs réservés aux futurs uploads si l’API les utilise. |
| **Restic** | Sauvegardes chiffrées, `mongodump` selon politique, planification Ansible. |
| **`.github/BACKUP-MINIO-RESTIC.md`**, **`DISASTER-RECOVERY.md`** | Procédures. |

---

## 12. SEO et acquisition

| Élément | Rôle |
|--------|------|
| **Meta / OG / JSON-LD** | Référencement et partages sociaux. |
| **Google Search Console** | Balise dans `index.html` ; suivi d’indexation. |
| **GA4** | Variable `VITE_GA_MEASUREMENT_ID` (souvent secret CI). |
| **Sitemap / robots** | Générés au build. |

---

## 13. Documentation du dépôt

- **`.github/`** : architecture CI/CD, OAuth, TLS, DNS, Harbor, PWA, Mongo, MinIO, etc.
- **`docs/`** : schémas, plans Trello, ce rapport.
- **`DEPLOYMENT_CHECKLIST.md`** : checklist opérationnelle.

---

## 14. Éléments périphériques

- **Newsletter** + **EmailJS** : `server/docs/EMAILJS.md`.
- **Nginx racine** (`nginx/nginx.conf`) : profil **production** du compose principal pour tests locaux type reverse proxy.
- **Scripts** : `diagnose-traefik-stack.sh`, `seed-app-users.sh`.

---

## 15. Fil chronologique du projet

1. **Développement** : local ou Docker Compose ; CI sur chaque PR/push.
2. **Promotion** : branches **vdev → vpreprod → vprod** (PR auto ou manuelle).
3. **Déploiement** : Harbor → rsync → Compose sur le VPS → Traefik.
4. **Exploitation** : Grafana/Prometheus, Kibana, Restic.
5. **Infra rejouable** : Ansible pour aligner ou reconstruire le serveur.

---

*Document généré pour servir de base mémoire / soutenance — à adapter si le dépôt évolue.*
