# Plan DevOps TheTipTop — VPS, Harbor, MinIO, Restic, CI/CD

Document de suivi : cocher chaque étape au fur et à mesure. Le fichier Word `Plan_VPS_Harbor_MinIO_Restic (1) (4).docx` n’est pas versionné (`.gitignore`) ; ce plan reprend la même infra que `infra/ansible/site.yml` (Docker, UFW, Traefik, MinIO, Harbor, Restic) et le flux GitHub Actions décrit ci‑dessous.

**Domaine racine** : `dsp5-archi-o22a-15m-g3.fr` (enregistrement **A** vers l’IP du VPS — sert aussi d’URL **prod** en HTTPS).  
**Sous-domaines applicatifs** (enregistrements **A** vers la même IP) :

| Environnement | FQDN |
|---------------|------|
| vdev | `vdev.dsp5-archi-o22a-15m-g3.fr` |
| vpreprod | `vpreprod.dsp5-archi-o22a-15m-g3.fr` |
| vprod (alias) | `vprod.dsp5-archi-o22a-15m-g3.fr` |
| Harbor (un seul registre, projets vdev / vpreprod / vprod) | `https://harbor.dsp5-archi-o22a-15m-g3.fr` |

**Namespaces** : isolation par **projet Docker Compose** (`COMPOSE_PROJECT_NAME`) + labels Traefik (`STACK_NAME`), pas de Kubernetes.

---

## Phase 0 — Prérequis (chez vous, une fois)

- [ ] **DNS** : A/AAAA pour la **racine** `dsp5-archi-o22a-15m-g3.fr`, puis `harbor`, `vdev`, `vpreprod`, `vprod` → IP du VPS.
- [ ] **Branche Git** : `vdev`, `vpreprod`, `vprod` (production).
- [ ] **Poste avec Ansible** (WSL ou Linux de préférence) : Python 3, `pip install ansible`, collections (`ansible-galaxy collection install -r infra/ansible/requirements.yml`).
- [ ] **Accès SSH** root (ou sudo) au VPS depuis ce poste (clé recommandée).

---

## Phase 1 — Inventaire Ansible

- [ ] Copier / adapter `infra/ansible/inventory/hosts.yml` (`ansible_host`, `ansible_user`, clé SSH).
- [ ] Adapter `infra/ansible/group_vars/all/vars.yml` (emails ACME, mots de passe **à changer** ; utiliser `ansible-vault` pour les secrets en équipe).

---

## Phase 2 — Provisionnement VPS (sans taper les commandes sur le serveur)

Objectif : tout lancer **depuis votre machine** avec Ansible (pas de SSH interactif sur le VPS pour installer Docker à la main).

- [ ] Depuis `infra/ansible` :  
  `ansible-galaxy collection install -r requirements.yml`  
  `ansible-playbook site.yml -i inventory/hosts.yml`
- [ ] Vérifier : Docker, UFW, réseau `traefik`, conteneur Traefik (TLS + fichier dynamique Harbor), MinIO (ports 9000/9001), Harbor (HTTP local **8080**, exposé en **HTTPS** via Traefik sur `harbor.…`), binaire Restic + cron.

**À faire vous-même si l’exécution échoue** : relever les logs Ansible ; sur Ubuntu récent, vérifier que `community.general.ufw` est disponible et que le pare-feu n’isole pas Docker (règles documentées dans la doc UFW/Docker si besoin).

---

## Phase 3 — Harbor et MinIO (post-install)

- [ ] **Harbor** : les projets **`vdev`**, **`vpreprod`**, **`vprod`** sont créés **automatiquement** au premier déploiement (API admin dans les workflows). Vérifier l’UI si besoin : `https://harbor.dsp5-archi-o22a-15m-g3.fr`.
- [ ] Créer un **robot account** dans Harbor pour le **docker push** : secrets GitHub `HARBOR_USERNAME` / `HARBOR_PASSWORD`.
- [ ] Secret **`HARBOR_ADMIN_PASSWORD`** = mot de passe du compte **admin** Harbor (défini dans Ansible `harbor_admin_password`) — utilisé **uniquement** en CI pour l’API (`ensure-harbor-project.sh`). Optionnel : **`HARBOR_ADMIN_USER`** si ce n’est pas `admin`.
- [ ] MinIO : créer les buckets listés dans `minio_buckets` si ce n’est pas déjà automatisé (console `http://<vps>:9001`).

**Secret GitHub** `HARBOR_REGISTRY_BASE` : **hostname seul**, sans chemin ni port 443 explicite, ex. `harbor.dsp5-archi-o22a-15m-g3.fr` (les workflows ajoutent `/vdev`, `/vpreprod`, `/vprod`). Connexion `docker login` en HTTPS sur le port 443.

---

## Phase 4 — Fichiers d’environnement sur le VPS (une fois par env)

Sur le VPS, **sans committer** les secrets :

- [ ] `sudo apt-get install -y rsync` (requis pour le `rsync` des workflows).
- [ ] `sudo mkdir -p /opt/thetiptop/app && sudo chown -R <user_ssh_ci>: /opt/thetiptop/app`
- [ ] `sudo mkdir -p /opt/thetiptop/app/infra/deploy/env`
- [ ] Copier les exemples puis éditer :
  - `infra/deploy/env/vdev.env` ← depuis `vdev.env.example`
  - `infra/deploy/env/vpreprod.env` ← depuis `vpreprod.env.example`
  - `infra/deploy/env/vprod.env` ← depuis `vprod.env.example`
- [ ] Renseigner mots de passe MongoDB, `JWT_SECRET`, `MONGO_ROOT_PASSWORD`, etc.
- [ ] `sudo chown` au user utilisé par la CI pour le déploiement (ex. utilisateur SSH du workflow).

Les workflows **exportent** `REGISTRY` et `IMAGE_TAG` ; les fichiers `.env` fixent `COMPOSE_PROJECT_NAME`, `STACK_NAME`, `TRAEFIK_HOST_RULE` (dont apex pour la prod), `CLIENT_URL`, secrets applicatifs.

---

## Phase 5 — GitHub Actions (secrets)

Dans **Settings → Secrets and variables → Actions**, créer au minimum :

| Secret | Rôle |
|--------|------|
| `HARBOR_REGISTRY_BASE` | hostname Harbor seul, ex. `harbor.dsp5-archi-o22a-15m-g3.fr` (sans `https://`, sans `/projet`) |
| `HARBOR_ADMIN_PASSWORD` | mot de passe **admin** Harbor (création des projets via API) |
| `HARBOR_ADMIN_USER` | (optionnel) défaut `admin` |
| `HARBOR_USERNAME` | compte **robot** Harbor (push d’images) |
| `HARBOR_PASSWORD` | mot de passe |
| `VPS_HOST` | IP ou hostname SSH |
| `VPS_SSH_USER` | utilisateur avec droit Docker (ex. `root` ou `deploy`) |
| `VPS_SSH_KEY` | clé privée PEM (contenu du fichier) |

- [ ] Secrets renseignés.
- [ ] **Variable** `PRODUCTION_ENVIRONMENT` = `production` (ou le nom de l’environnement GitHub utilisé par `deploy-vprod.yml`).
- [ ] **Environnement** GitHub correspondant : ajouter des **reviewers** ou règles d’approbation si vous voulez bloquer la prod jusqu’à validation manuelle.

---

## Phase 6 — Flux de livraison (automatique)

| Déclencheur | Workflow (nom dans Actions) | Stages (jobs) |
|-------------|------------------------------|---------------|
| Push sur `vdev` | **CD / vdev** (`deploy-vdev.yml`) | 1 · Harbor → 2 · Registry (build/push) → 3 · VPS |
| Push sur `vpreprod` | **CD / vpreprod** | Idem |
| Push sur `vprod` | **CD / vprod** | Idem (job 3 sous environnement GitHub **production**) |
| Push sur `vpreprod` | `promote-vpreprod-to-vprod-pr.yml` | PR automatique `vpreprod` → `vprod` |

Workflow conseillé :

1. Développer sur `vdev` → push → déploiement auto **vdev**.
2. PR `vdev` → `vpreprod` → après merge, push sur `vpreprod` → déploiement **vpreprod** ; une PR vers `vprod` peut être créée automatiquement.
3. PR `vpreprod` → `vprod` → après merge, push sur `vprod` → déploiement **prod** (avec garde-fous `environment: production` si configuré).

- [ ] Premier push sur `vdev` : pipeline vert + site accessible sur `https://vdev...`
- [ ] Même chose pour `vpreprod` puis `vprod`

---

## Phase 7 — Vérifications finales

- [ ] HTTPS Traefik (Let’s Encrypt) sur les trois FQDN applicatifs.
- [ ] API : `https://<env>/api/health` (ou route équivalente).
- [ ] Restic : log `/var/log/thetiptop-restic.log` (première exécution après le cron).

---

## Références dans le dépôt

| Élément | Emplacement |
|---------|-------------|
| Playbook infra | `infra/ansible/site.yml` |
| Stack applicative | `infra/deploy/docker-compose.stack.yml` |
| Exemples env | `infra/deploy/env/*.env.example` |
| Workflows | `.github/workflows/deploy-*.yml`, `promote-vpreprod-to-vprod-pr.yml` |

---

## Prochaine étape manuelle après lecture de cette checklist

1. Adapter **DNS** (ajouter `vdev` si ce n’est pas fait).  
2. Lancer **Ansible** depuis votre poste.  
3. Créer **Harbor project + robot** et les **fichiers .env** sur le VPS.  
4. Configurer les **secrets GitHub** et pousser sur **`vdev`** pour valider le premier déploiement.

Dites-moi quand la Phase 2 (Ansible) est passée ou si un playbook échoue (message d’erreur complet) : on enchaîne sur les corrections ciblées.
