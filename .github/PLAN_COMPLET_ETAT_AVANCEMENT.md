# État d'avancement – Plan de travail CRUD Répertoire (conforme cahier des spécifications)

Référence : **Plan complet – CRUD Répertoire Téléphonique (workflow DevOps conforme au cahier des spécifications)**  
Branches du projet : `dev` (équivalent *develop*), `preprod`, `prod`.

---

## PHASE 1 – GESTION DU CODE SOURCE (GITHUB)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Branches develop / preprod / prod | ✅ Fait | Branches `dev`, `preprod`, `prod` (nom `dev` au lieu de *develop*) |
| Développement depuis develop | ✅ Fait | Développement sur `dev` |
| Merge vers preprod pour QA | ✅ Fait | PR automatique dev→preprod quand les 2 CI sont vertes |
| Merge vers prod après validation | ✅ Fait | PR automatique preprod→prod |
| Versioning sémantique (v1.0.0, v1.1.0…) | ⚠️ Partiel | Pas de tags/releases automatiques dans les workflows ; images taguées par `$SHA` |
| Pull Requests et revues de code | ✅ Fait | PR de promotion + commentaires CI sur les PR |

---

## PHASE 2 – INTÉGRATION CONTINUE (GITHUB ACTIONS)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Pipeline CI à chaque push/PR | ✅ Fait | `ci-client.yml`, `ci-server.yml` sur push et PR (dev, preprod, prod) |
| Installation dépendances avec cache | ✅ Fait | `npm install` (cache npm retiré pour éviter échecs si pas de lock file) ; cache Playwright présent |
| Lint du code | ✅ Fait | ESLint client et server (sur dev / PR vers dev) |
| Tests unitaires (Jest) | ✅ Fait | Client et server avec `--coverage` |
| Tests composants (React Testing Library) | ✅ Fait | Client : Jest + RTL |
| Tests E2E multi-navigateurs (Playwright) | ⚠️ Partiel | Playwright en place ; en CI **Chromium uniquement** (pas Firefox/WebKit en pipeline) ; config locale permet chromium/firefox/webkit |
| Couverture > 80 % | ✅ Fait | `coverageThreshold` 80 % (branches, functions, lines, statements) client + server |
| Build applicatif | ✅ Fait | `npm run build` client, build backend via Docker |
| Build Docker multi-stage | ✅ Fait | Backend et client Dockerfiles multi-stage |
| Scan sécurité des images (Harbor) | ✅ Fait | Scan Trivy déclenché via Harbor après push d’image |
| Notifications / feedback automatique | ✅ Fait | Commentaires sur les PR avec résultats CI |

---

## PHASE 3 – CONTENEURISATION (DOCKER & DOCKER COMPOSE)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Dockerfile backend multi-stage optimisé | ✅ Fait | `server/Dockerfile` (builder + runtime) |
| Dockerfile frontend optimisé | ✅ Fait | `client/Dockerfile` (builder, development, production Nginx) |
| Images légères et immuables | ✅ Fait | Alpine, multi-stage |
| Docker Compose pour environnement local | ✅ Fait | `docker-compose.yml`, `docker-compose.dev.yml` |
| Versionnement des images selon branche | ✅ Fait | Tag par `${{ github.sha }}` ; projet Harbor selon branche (thetiptop-dev/preprod/prod) |

---

## PHASE 4 – REGISTRY PRIVÉ (HARBOR)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Installation serveur Harbor | ✅ Fait | Utilisation d’un Harbor configuré (secrets GitHub) |
| Projets distincts dev / preprod / prod | ✅ Fait | thetiptop-dev, thetiptop-preprod, thetiptop-prod |
| Scan automatique des vulnérabilités | ✅ Fait | Scan Trivy déclenché après push |
| Gestion des accès par projet | ✅ Fait | Login Harbor par workflow, push vers le bon projet |
| Stockage sécurisé des images | ✅ Fait | Images dans Harbor par environnement |

---

## PHASE 5 – ORCHESTRATION (KUBERNETES + HELM)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Cluster Kubernetes (3 nœuds min.) | ✅ Fait | 3 clusters (dev, preprod, prod) – ex. DigitalOcean DOKS |
| Namespaces dev / preprod / prod | ✅ Fait | thetiptop-dev, thetiptop-preprod, thetiptop-prod |
| Backend et Frontend en Deployment | ✅ Fait | Deployments par environnement |
| Base MongoDB en StatefulSet | ✅ Fait | `mongodb-statefulset.yaml` par env |
| Helm Charts pour packaging et déploiement | ❌ Non fait | Déploiement via manifests YAML + `kubectl apply` ; pas de `Chart.yaml` |
| Autoscaling HPA | ⚠️ Partiel | HPA uniquement en **prod** (backend 3→10, frontend 3→8) ; dev/preprod en replicas fixes |
| Rolling Update + Rollback automatique | ✅ Fait | Stratégie de déploiement Kubernetes par défaut ; CD met à jour les images |

---

## PHASE 6 – REVERSE PROXY & SÉCURITÉ (TRAEFIK + TLS)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Déploiement Traefik par environnement | ✅ Fait | Dossier `k8s/traefik/`, values par env (dev/preprod/prod) |
| Routage automatique des services | ✅ Fait | Ingress (backend + frontend) par env |
| Certificats TLS via Let's Encrypt | ✅ Fait | `k8s/traefik/letsencrypt-issuer.yaml`, cert-manager |
| Middlewares de sécurité | ✅ Fait | `k8s/traefik/middleware-security.yaml` |
| Haute disponibilité en production | ✅ Fait | Plusieurs replicas + HPA en prod |

---

## PHASE 7 – GESTION DES SECRETS (HASHICORP VAULT)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Cluster Vault haute disponibilité | ❌ Non fait | Non déployé |
| Stockage sécurisé des credentials MongoDB | ⚠️ Contournement | Secrets Kubernetes (`backend-secret`, `mongodb-secret`) dans chaque namespace |
| Injection dynamique des secrets dans les Pods | ⚠️ Contournement | Via `envFrom` / secrets K8s, pas Vault |
| Rotation automatique des secrets | ❌ Non fait | Pas de rotation automatisée |
| Audit trail des accès | ❌ Non fait | Pas de Vault donc pas d’audit Vault |

**À faire :** Déployer Vault et migrer les secrets (MongoDB, JWT, OAuth, etc.) vers Vault avec injection dans les Pods (CSI ou sidecar) et, si requis, rotation + audit.

---

## PHASE 8 – MONITORING & LOGGING (PROMETHEUS, GRAFANA, ELK)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Collecte des métriques (Prometheus) | ❌ Non fait | Pas de déploiement Prometheus dans le repo |
| Dashboards par service (Grafana) | ❌ Non fait | Pas de Grafana |
| Alerting proactif (Alertmanager) | ❌ Non fait | Pas d’Alertmanager |
| Centralisation des logs (ELK Stack) | ❌ Non fait | Pas d’ELK / stack logs centralisée |
| Analyse des performances et détection d’anomalies | ❌ Non fait | Dépend de la stack ci-dessus |

**À faire :** Mettre en place Prometheus, Grafana, Alertmanager et une stack de logs (ELK ou équivalent) selon le cahier des charges.

---

## PHASE 9 – BACKUPS & RESTAURATION (RESTIC + MINIO)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Backups quotidiens production | ✅ Fait | CronJob `mongodb-backup` (18h00 FR + 18h15 UTC), Restic → MinIO |
| Backups quotidiens dev/preprod | ✅ Fait | Même CronJobs par namespace (thetiptop-dev, thetiptop-preprod, thetiptop-prod) |
| Stockage S3 via MinIO | ✅ Fait | Déploiement MinIO optionnel dans `k8s/minio/` ; repo Restic `s3:endpoint/bucket/mongodb-ENV` |
| Sauvegardes incrémentales versionnées | ✅ Fait | Restic (incrémental, rétention 7 daily + 4 weekly) |
| Tests de restauration réguliers | ✅ Fait | CronJob `mongodb-restore-test` (dimanche 6h UTC) + workflow « Trigger restore test » |
| Automatisation (CronJobs K8s + CD) | ✅ Fait | Secret `restic-s3-secret` créé par le CD ; plan DR dans `.github/DISASTER-RECOVERY.md` |

**Config :** Secrets GitHub `RESTIC_MINIO_ENDPOINT`, `RESTIC_MINIO_BUCKET`, `RESTIC_PASSWORD`, `RESTIC_S3_ACCESS_KEY_ID`, `RESTIC_S3_SECRET_ACCESS_KEY`. Déployer MinIO avec `k8s/minio/` puis lancer un déploiement CD.

---

## PHASE 10 – INFRASTRUCTURE & HÉBERGEMENT (DIGITALOCEAN)

| Point du plan | Statut | Détail |
|---------------|--------|--------|
| Infrastructure Cloud DigitalOcean | ✅ Fait | Clusters Kubernetes (DOKS) utilisés pour dev/preprod/prod |
| Optimized Droplets 8 vCores / 32 Go RAM / 1 To SSD | ⚠️ À vérifier | À confirmer selon la taille réelle des clusters/nœuds |
| Bande passante > 500 Mbps | ⚠️ À vérifier | Dépend du plan DO |
| SLA > 99,9 % | ⚠️ À vérifier | Dépend du contrat DigitalOcean |
| Snapshots automatiques des Droplets | ❌ Non fait | Pas de script/automatisation documentée dans le repo |
| Block Storage + réplication multi-régions | ❌ Non fait | Pas de configuration documentée dans le repo |

**À faire :** Vérifier/ajuster les specs des clusters (vCores, RAM, stockage), activer les snapshots si requis, et documenter Block Storage / multi-région si exigé par le cahier des charges.

---

## RÉSUMÉ

| Phase | Fait | Partiel | Non fait |
|-------|------|---------|----------|
| 1 – GitHub | 5 | 1 (versioning sémantique) | 0 |
| 2 – CI (GitHub Actions) | 9 | 1 (E2E multi-navigateurs) | 0 |
| 3 – Docker | 5 | 0 | 0 |
| 4 – Harbor | 5 | 0 | 0 |
| 5 – Kubernetes + Helm | 5 | 1 (HPA uniquement en prod) | 1 (Helm) |
| 6 – Traefik + TLS | 5 | 0 | 0 |
| 7 – Vault | 0 | 2 (secrets K8s) | 3 |
| 8 – Monitoring (Prometheus, Grafana, ELK) | 4 | 0 | 1 (ELK / logs) |
| 9 – Backups (Restic + MinIO) | 6 | 0 | 0 |
| 10 – DigitalOcean | 1 | 3 (specs à vérifier) | 2 |

**Priorités recommandées pour la conformité complète au plan :**

1. **Phase 7 – Vault** : Déployer Vault et migrer les secrets (ou documenter une dérogation si le cahier accepte les secrets K8s).
2. **Phase 8 – Monitoring** : Prometheus + Grafana + Alertmanager + ELK (ou équivalent).
3. **Phase 9 – Backups** : Restic + MinIO + CronJobs + tests de restauration.
4. **Phase 5 – Helm** : Créer des Helm charts pour le déploiement si exigé par la spec.
5. **Phase 2 – E2E** : Activer Firefox et WebKit en CI si la spec impose les tests multi-navigateurs.
6. **Phase 10** : Aligner et documenter l’infra (taille des nœuds, snapshots, Block Storage).

---

## Bonnes pratiques – Par quoi commencer

Ordre recommandé pour avancer sans tout casser et avec un maximum de valeur.

### 1. Gains rapides (peu de risque, pas de nouvelle infra)

À faire en premier, dans l’ordre :

| Action | Pourquoi | Où |
|--------|----------|-----|
| **E2E multi-navigateurs en CI** | Conforme à la spec (Chromium + Firefox + WebKit), détecte les régressions navigateur. | `.github/workflows/ci-client.yml` : installer et lancer les 3 navigateurs Playwright au lieu de Chromium seul. |
| **Versioning sémantique** | Tags `v1.0.0` pour les releases, traçabilité. | Créer un workflow (ou étape dans le CD) qui crée un tag Git + release GitHub quand on merge vers `prod` (ou manuellement). |
| **HPA en preprod (optionnel)** | Même comportement qu’en prod, tests de montée en charge. | Dupliquer les `HorizontalPodAutoscaler` de `k8s/prod/` vers `k8s/preprod/` avec des min/max adaptés (ex. 1→4). |

### 2. Monitoring (Phase 8) – En place (Prometheus, Grafana, Alertmanager)

- **Prometheus + Grafana + Alertmanager** : déployés via `k8s/monitoring/` (values-dev, values-preprod, values-prod). À déployer sur chaque cluster si pas encore fait.
- **Reste** : centralisation des **logs** (ELK ou Loki) – optionnel pour compléter la Phase 8.

### 3. Backups (Phase 9) – Juste après la visibilité

**Pourquoi juste après le monitoring :** une fois qu’on voit l’état du système, la priorité est de pouvoir restaurer en cas d’incident.

- **MinIO** : déployer un bucket S3-compatible (sur le cluster ou managé) pour stocker les backups.
- **Restic** : CronJob Kubernetes qui fait un dump MongoDB (ou snapshot des volumes) puis l’envoie vers MinIO. Commencer par **un backup quotidien en dev** pour valider le script et la restauration.
- **Prod** : même mécanisme en quotidien ; preprod/dev en hebdomadaire comme dans le plan.
- **Test de restauration** : prévoir une fois par mois un run en sandbox (namespace dédié ou cluster de test).

### 4. Vault (Phase 7) – Une fois monitoring + backups en place

**Pourquoi après :** changement sensible (secrets, injection dans les Pods). Avec monitoring on voit tout de suite si un Pod ne démarre plus ; avec des backups on peut revenir en arrière en cas d’erreur.

- Déployer Vault (HA si exigé par la spec).
- Migrer **un secret à la fois** (ex. d’abord MongoDB, puis JWT) depuis les Secrets K8s vers Vault.
- Utiliser l’agent Vault ou le CSI driver pour injecter les secrets dans les Pods.
- Documenter la rotation et l’audit.

### 5. Helm (Phase 5) – Si la spec l’exige

- Créer un chart qui regroupe backend, frontend, MongoDB, Ingress, ConfigMaps/Secrets (ou références).
- Remplacer progressivement les `kubectl apply -f k8s/...` par `helm upgrade --install` en dev puis preprod puis prod.

### Résumé “par quoi commencer”

1. ~~Prometheus + Grafana~~ : **fait** (dev / preprod / prod via `k8s/monitoring/`).  
2. **À faire maintenant** : Backups (MinIO + Restic + CronJob), puis optionnellement ELK/Loki pour les logs.  
3. **Ensuite** : Vault (migration des secrets) si la spec l’exige.  
4. **Gains rapides** : E2E multi-navigateurs en CI, versioning sémantique (tags), HPA en preprod.

---

## Prochaines étapes (à faire maintenant)

| Priorité | Action | Détail |
|----------|--------|--------|
| **1** | Vérifier le monitoring sur les 3 clusters | Si pas encore fait : déployer le stack (Helm + values-preprod / values-prod) sur **preprod** et **prod**. Vérifier l’accès à Grafana (DNS : grafana.preprod.thetiptop-jeu.fr, grafana.thetiptop-jeu.fr). |
| **2** | **Backups (Phase 9)** | Déployer MinIO (bucket S3), puis Restic ou un CronJob qui fait un dump MongoDB et l’envoie vers MinIO. Commencer en **dev**, tester une restauration, puis étendre en preprod/prod. |
| **3** | Logs (optionnel) | Mettre en place ELK ou Loki pour centraliser les logs (complète la Phase 8). |
| **4** | Vault (Phase 7) | Si la spec l’exige : déployer Vault, migrer les secrets (MongoDB, JWT, OAuth) depuis les Secrets K8s. |
| **5** | Gains rapides | E2E multi-navigateurs (Firefox + WebKit) en CI ; tag de version (v1.0.0) sur merge prod ; HPA en preprod. |
  