# Plan de migration : Clusters Kubernetes → VPS

Objectif : quitter les **3 clusters Kubernetes** (DigitalOcean DOKS) et faire tourner l’application sur **un ou plusieurs VPS** avec **Docker Compose**, en conservant dev / preprod / prod et la CI/CD.

---

## 1. Ce qui est en place aujourd’hui (à migrer)

| Élément | Actuel (clusters) |
|--------|---------------------|
| **Environnements** | 3 clusters : dev, preprod, prod (namespaces thetiptop-dev, thetiptop-preprod, thetiptop-prod) |
| **App** | Frontend (Nginx), Backend (Node/Express), MongoDB (StatefulSet) par env |
| **Images** | Build + push vers Harbor (thetiptop-dev/preprod/prod), tag = `$SHA` |
| **CD** | GitHub Actions → kubectl → apply manifests, secrets, rollout |
| **Réseau** | Traefik Ingress, cert-manager, Let’s Encrypt (TLS) |
| **Domaines** | dev.thetiptop-jeu.fr, api.dev… ; preprod ; thetiptop-jeu.fr / api.thetiptop-jeu.fr |
| **Secrets** | GitHub Secrets → backend-secret, mongodb-secret (K8s) |
| **Données** | MongoDB par cluster (PVC) ; backups Restic → MinIO (CronJobs) |
| **Monitoring** | Prometheus + Grafana + Alertmanager (Helm, namespace monitoring) |
| **Déjà prêt côté code** | Dockerfiles multi-stage, docker-compose (local), même logique applicative |

---

## 2. Cible : architecture VPS

Deux options possibles.

### Option A : 1 VPS par environnement (recommandé pour dev / preprod / prod)

- **3 VPS** (ex. DigitalOcean Droplet, OVH VPS, etc.) : un pour dev, un pour preprod, un pour prod.
- Chaque VPS : Docker + Docker Compose qui lance frontend, backend, MongoDB (et optionnellement Nginx/Traefik, MinIO).
- Avantages : isolation proche des clusters, même découpage dev/preprod/prod.
- Inconvénient : coût (3 serveurs).

### Option B : 1 seul VPS, 3 stacks Docker Compose

- **1 VPS** avec 3 “stacks” (3 dossiers ou 3 compose avec préfixes de projet : `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`).
- Chaque stack : frontend, backend, MongoDB sur des ports ou des hostnames différents ; un reverse proxy (Nginx ou Traefik) route selon le domaine.
- Avantages : un seul serveur, moins cher.
- Inconvénients : tout sur une machine, moins d’isolation.

**Recommandation** : Option A pour la prod (au moins 1 VPS dédié prod), Option B acceptable pour dev + preprod sur un même VPS si budget limité.

---

## 3. Plan de migration par étapes

### Phase 0 : Préparation (sans casser l’existant)

| # | Action | Détail |
|---|--------|--------|
| 0.1 | Choisir hébergeur VPS | DigitalOcean Droplet, OVH, Scaleway, etc. (2 vCPU, 4 Go RAM min par env, plus pour prod). |
| 0.2 | Créer 1 ou 3 VPS | SSH activé, firewall (22, 80, 443), Docker + Docker Compose installés. |
| 0.3 | DNS | Prévoir les enregistrements (ou les garder) : dev.thetiptop-jeu.fr, api.dev.thetiptop-jeu.fr, idem preprod, thetiptop-jeu.fr, api.thetiptop-jeu.fr. Pas encore pointer vers les VPS si vous migrez progressivement. |

---

### Phase 1 : Docker Compose “production” sur le VPS

| # | Action | Détail |
|---|--------|--------|
| 1.1 | Ajouter un `docker-compose.prod.yml` (ou par env) | Basé sur vos Dockerfiles actuels : services `frontend`, `backend`, `mongodb`. Utiliser les **images** du registry (Harbor ou Docker Hub) au lieu de `build:`. Variables d’environnement via fichier `.env` sur le VPS (ne pas commiter les secrets). |
| 1.2 | Reverse proxy sur le VPS | Nginx ou Traefik en conteneur : écoute 80/443, routage par host (dev.thetiptop-jeu.fr → frontend:80, api.dev… → backend:5000). |
| 1.3 | TLS sur le VPS | Certificats Let’s Encrypt avec **Certbot** (ou Traefik avec ACME) : plus de cert-manager. Renouvellement automatique (cron + certbot renew). |
| 1.4 | Fichiers à créer dans le repo | Ex. `deploy/vps/docker-compose.prod.yml`, `deploy/vps/nginx.conf` (ou traefik), `deploy/vps/.env.example` (liste des variables sans valeurs). |

Objectif : pouvoir lancer “prod” (ou un env) sur un VPS avec `docker compose -f docker-compose.prod.yml up -d`, derrière Nginx/Traefik et TLS.

---

### Phase 2 : Déploiement depuis GitHub Actions vers le VPS

| # | Action | Détail |
|---|--------|--------|
| 2.1 | Décider du registry | Garder **Harbor** si accessible depuis le VPS, sinon **Docker Hub** (ou GitHub Container Registry). La CI continue à build et push les images (déjà en place) ; on change seulement la cible du déploiement. |
| 2.2 | Accès du workflow au VPS | Créer un secret GitHub (ex. `VPS_HOST`, `VPS_SSH_KEY` ou `VPS_USER`) pour SSH. Le job CD se connecte en SSH au VPS concerné (selon la branche : dev → VPS dev, etc.). |
| 2.3 | Nouveau workflow CD “VPS” | Créer un workflow (ex. `cd-deploy-vps.yml`) qui : (1) vérifie les CI comme aujourd’hui, (2) se connecte en SSH au bon VPS, (3) fait `docker compose pull` (ou `docker pull` des images par env), (4) `docker compose up -d` (ou équivalent). Pas de `kubectl`. |
| 2.4 | Secrets applicatifs sur le VPS | Fichier `.env` sur chaque VPS (MONGODB_URI, JWT_SECRET, SENDGRID_*, etc.), rempli une fois à la main ou par un script sécurisé. Ne pas les mettre dans le dépôt. |

Objectif : push sur `dev` / `preprod` / `prod` déclenche un déploiement sur le(s) VPS correspondant(s) sans Kubernetes.

---

### Phase 3 : Données et backups

| # | Action | Détail |
|---|--------|--------|
| 3.1 | MongoDB sur le VPS | Volume Docker nommé (ex. `mongodb_data`) pour la persistance. Pas de StatefulSet. |
| 3.2 | Migration des données (optionnel) | Si vous devez repartir des données des clusters : export depuis l’ancien MongoDB (mongodump depuis un pod ou depuis un accès temporaire), import sur le MongoDB du VPS (mongorestore). À planifier en fenêtre de maintenance. |
| 3.3 | Backups sur le VPS | Restic + MinIO (ou S3) : même idée qu’aujourd’hui. Cron sur le VPS (ou conteneur dédié) : dump MongoDB + restic backup vers MinIO/S3. Pas de CronJob Kubernetes. |
| 3.4 | Restauration | Documenter une procédure de restauration (restic restore + mongorestore) et la tester une fois. |

---

### Phase 4 : Arrêt des clusters et nettoyage

| # | Action | Détail |
|---|--------|--------|
| 4.1 | Bascule DNS | Quand un environnement VPS est prêt et testé, pointer les DNS (dev, preprod ou prod) vers l’IP du VPS. |
| 4.2 | Vérifications | Smoke tests (frontend, API, newsletter, auth, etc.) sur chaque env. |
| 4.3 | Désactiver l’ancien CD K8s | Une fois les 3 env sur VPS : supprimer ou désactiver le workflow `cd-deploy.yml` (ou le garder en secours le temps de la transition). |
| 4.4 | Supprimer les clusters | Après une période de rollback (ex. 1–2 semaines), supprimer les clusters DigitalOcean (et les volumes si plus besoin) pour arrêter les coûts. |
| 4.5 | Nettoyage du repo | Supprimer ou déplacer dans un dossier `archive/` les dossiers `k8s/`, les références aux KUBECONFIG_* dans la doc, et mettre à jour la doc (README, ROADMAP, etc.) pour décrire l’architecture VPS. |

---

### Phase 5 (optionnel) : Monitoring et logs sur le VPS

| # | Action | Détail |
|---|--------|--------|
| 5.1 | Monitoring | Installer Prometheus + Grafana (ou un agent type Netdata) sur le VPS, ou utiliser un service managé (ex. Grafana Cloud). Plus de déploiement Helm dans un cluster. |
| 5.2 | Logs | Centraliser les logs (fichiers Docker, ou envoi vers un service) si besoin ; pas d’ELK dans le scope minimal. |

---

## 4. Ce qu’on garde / ce qu’on enlève

| Garder | Enlever / Remplacer |
|--------|----------------------|
| GitHub, branches dev/preprod/prod, PR de promotion | Déploiement vers les clusters (kubectl, KUBECONFIG_*) |
| CI (lint, tests, build images, push registry) | Workflow CD actuel `cd-deploy.yml` (ou le désactiver) |
| Dockerfiles, images (Harbor ou Docker Hub) | Manifests K8s (Deployments, Services, Ingress, StatefulSet, CronJobs, etc.) |
| Docker Compose (local + nouveau “prod” VPS) | cert-manager, Traefik dans le cluster → Certbot + Nginx/Traefik sur le VPS |
| Secrets dans GitHub (pour la CI et le déploiement SSH) | Secrets Kubernetes → fichier `.env` sur le VPS |
| SendGrid, logique newsletter, sitemap, etc. | Helm (monitoring) → même stack en Docker Compose ou service externe |
| Backups (concept Restic + S3/MinIO) | CronJobs K8s → cron système ou conteneur sur le VPS |

---

## 5. Ordre recommandé (résumé)

1. **Phase 0** : Créer 1 VPS (ex. dev), installer Docker + Docker Compose.
2. **Phase 1** : Mettre en place `docker-compose.prod.yml` + Nginx (ou Traefik) + Certbot sur ce VPS ; tester à la main (pull images, variables d’env, TLS).
3. **Phase 2** : Ajouter le workflow `cd-deploy-vps.yml` et les secrets GitHub (VPS_HOST, SSH key) ; déployer dev automatiquement sur ce VPS.
4. **Phase 3** : Configurer les backups (Restic + MinIO/S3) sur le VPS.
5. **Bascule** : Pointer dev.thetiptop-jeu.fr vers le VPS ; désactiver le déploiement K8s pour dev.
6. **Répéter** pour preprod puis prod (nouveaux VPS ou même VPS avec d’autres stacks).
7. **Phase 4** : Arrêt complet des clusters, nettoyage du repo et de la doc.

---

## 6. Fichiers à créer (suggestion)

```
deploy/
  vps/
    docker-compose.prod.yml    # ou docker-compose.dev.yml, .preprod, .prod
    .env.example               # MONGODB_URI, JWT_SECRET, SENDGRID_*, etc.
    nginx/
      nginx.conf               # reverse proxy par host
      ssl/                     # certbot y met les certs (ou traefik)
    scripts/
      deploy.sh                # script appelé en SSH par la CI (pull + up -d)
      backup-mongo.sh          # dump + restic
.github/
  workflows/
    cd-deploy-vps.yml          # déploiement SSH vers VPS
  docs/
    PLAN-MIGRATION-CLUSTERS-VERS-VPS.md  # ce document
```

---

## 7. Rollback possible

Tant que les clusters et les DNS d’origine existent, en cas de problème sur le VPS vous pouvez :

- Repointer les DNS vers les clusters (ou garder les anciens enregistrements).
- Réactiver le workflow `cd-deploy.yml` et refaire un déploiement sur les clusters.

Il est donc prudent de ne pas supprimer les clusters tout de suite après la bascule.

---

Ce plan s’appuie sur ce qui est déjà accompli (CI, images, Docker Compose local, domaines, SendGrid, backups concept) et décrit les étapes pour quitter les clusters et opérer sur un ou plusieurs VPS avec Docker Compose et une CI/CD par SSH.
