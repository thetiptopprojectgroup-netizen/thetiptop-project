# Ce qu’il reste à faire – TheTipTop Project

## ✅ Déjà fait

- **Phase 2 – CI/CD (GitHub Actions)**
  - CI Client & Server : lint, tests (≥ 80 %), build, Docker, push Harbor, scan Trivy
  - CD : création automatique des PR **dev → preprod** et **preprod → prod** (quand les 2 CI sont vertes)
  - PR en "Ready for review" (plus en brouillon)
  - Retry sur le build Docker (504 Docker Hub)
  - Documentation : résolution des conflits de merge (`.github/RESOLVE-MERGE-CONFLICTS.md`)

- **Branches & flux**
  - Flux validé : dev → preprod → prod
  - Conflits preprod/prod résolus (ex. README) et merge poussé sur `preprod`

---

## À faire (dans l’ordre recommandé)

### 1. Harbor – Projets par environnement (en premier)

**Objectif :** séparer les images par environnement pour ne jamais déployer du dev en prod.

- Créer dans Harbor **3 projets** : `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`
- Adapter les workflows CI pour pousser selon la branche :
  - `dev` → `$HARBOR_REGISTRY/thetiptop-dev/frontend:$SHA` et `.../backend:$SHA`
  - `preprod` → `thetiptop-preprod/...`
  - `prod` → `thetiptop-prod/...`
- (Optionnel) Politiques de vulnérabilités plus strictes sur le projet prod

**Référence :** `.github/ROADMAP-ENVIRONNEMENTS.md`

---

### 2. Kubernetes – Cluster + namespaces

- Créer un cluster (ex. DigitalOcean DOKS) ou utiliser un cluster existant
- Créer les namespaces : `thetiptop-dev`, `thetiptop-preprod`, `thetiptop-prod`
- Définir les manifests (Deployments, Services) ou Helm charts qui tirent les images depuis le **bon projet Harbor**
- Configurer l’Ingress (Traefik ou autre) avec des hostnames par environnement (ex. dev.thetiptop.fr, preprod.thetiptop.fr, thetiptop.fr)

---

### 3. CD – Déploiement vers les clusters

- Après merge des PR (dev→preprod, preprod→prod), déclencher le déploiement vers le **bon namespace**
- Utiliser `kubectl set image` ou Helm upgrade avec le tag d’image (SHA ou release) et les valeurs d’environnement

---

### 4. Secrets & configuration

- Secrets par environnement (MongoDB, JWT, etc.) dans le bon namespace (ou via Vault plus tard)
- ConfigMaps : variables d’environnement par env (URLs API, feature flags)

---

### 5. Monitoring & observabilité

- Prometheus / Grafana / Alertmanager (et éventuellement ELK pour les logs)
- Labels ou namespaces pour distinguer dev / preprod / prod

---

### 6. Backups (optionnel mais recommandé)

- Stratégie de sauvegarde (ex. MinIO + Restic, CronJobs)
- Tests de restauration

---

### 7. Divers (README)

- [ ] **Déploiement réel du frontend** vers l’hébergement cible (VPS/DigitalOcean/CDN)
- [ ] **Configuration environnementale** (DigitalOcean / VPS / Harbor réel / monitoring) avec les accès et secrets de votre équipe

---

## Résumé

| Priorité | Tâche |
|----------|--------|
| 1 | Harbor : 3 projets (thetiptop-dev, thetiptop-preprod, thetiptop-prod) + adapter la CI |
| 2 | K8s : 1 cluster + 3 namespaces (ou 3 clusters) |
| 3 | Manifests / Helm + CD qui déploie dans le bon namespace |
| 4 | Secrets / ConfigMaps par env + Ingress (Traefik) |
| 5 | Monitoring (Prometheus, Grafana, ELK) |
| 6 | Backups (Restic, CronJobs, tests restauration) |

Les étapes 1 à 4 permettent d’avoir des environnements dev / preprod / prod vraiment isolés et déployés automatiquement. Les étapes 5 et 6 renforcent la robustesse et la maintenabilité.
