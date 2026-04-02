# Checklist déploiement VPS — Harbor, MinIO, Restic, Traefik (TheTipTop)

Cochez chaque étape lorsqu’elle est **terminée et vérifiée**. Ce document suit le plan *Plan_VPS_Harbor_MinIO_Restic* (extrait dans `PLAN_EXTRACT.txt`).

---

## Phase 0 — Prérequis locaux & dépôt

- [ ] Dépôt Git sur GitHub (ou GitLab — adapter le workflow si besoin)
- [ ] Branche `vdev` créée et poussée : `git push -u origin vdev`
- [ ] Accès administrateur au VPS (SSH) et nom de domaine pointant vers le VPS (ex. `vdev.dsp5-archi-o22a-15m-g3.fr` → IP du VPS)

---

## Phase 1 — Bootstrap infrastructure sur le VPS (Ansible)

> Ce qui est **déjà automatisé** à chaque push sur `vdev` : création de `/srv/vdev`, copie des fichiers, génération de `.env`, `docker login`, pull + `up -d` (GitHub Actions).

> L’installation **Docker, UFW, Traefik, MinIO, Harbor, Restic** sur le VPS est automatisée par **Ansible** (`infra/ansible/`). Voir **`infra/ansible/README.md`**.

- [ ] Inventaire : `infra/ansible/inventory/hosts.yml` (copie de `hosts.example.yml`)
- [ ] Variables : `infra/ansible/group_vars/all/vars.yml` (copie de `vars.yml.example`) — idéalement secrets dans **ansible-vault**
- [ ] Collections : `cd infra/ansible && ansible-galaxy collection install -r requirements.yml`
- [ ] Exécution : `ansible-playbook site.yml -i inventory/hosts.yml` (depuis `infra/ansible/`)
- [ ] Post-Ansible : créer le projet Harbor **`tiptop-vdev`**, utilisateur robot pour la CI, noter l’URL du registry (`HARBOR_REGISTRY` dans GitHub)
- [ ] *(Optionnel)* Cron sur le VPS pour `backup.sh` quotidien en plus de la CI

---

## Phase 2 — Secrets GitHub (CI/CD)

Dans le dépôt : **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `HARBOR_REGISTRY` | Hôte du registry sans schéma, ex. `registre.mondomaine.fr` ou `212.227.82.68:8443` |
| `HARBOR_USERNAME` | Utilisateur Harbor (ou compte robot) avec droits sur `tiptop-vdev` |
| `HARBOR_PASSWORD` | Mot de passe ou token |
| `HARBOR_PROJECT` | Nom du projet Harbor pour vdev : `tiptop-vdev` |
| `VPS_HOST` | IP ou hostname SSH du VPS (ex. `212.227.82.68`) |
| `VPS_USER` | Utilisateur SSH (ex. `deploy`) |
| `VPS_SSH_KEY` | Clé privée PEM (contenu multiligne) pour la connexion SSH |
| `VDEV_HOST` | Nom d’hôte Traefik pour vdev (ex. `vdev.dsp5-archi-o22a-15m-g3.fr`) — utilisé pour les labels et `CLIENT_URL` |
| `MONGO_ROOT_PASSWORD` | Mot de passe root MongoDB sur le VPS (injecté dans `.env` généré) |
| `JWT_SECRET` | Secret JWT pour l’API (injecté dans `.env` généré) |
| `CLIENT_URL_VDEV` | *(optionnel)* URL publique complète du front ; si vide → `https://` + `VDEV_HOST` |
| `TRAEFIK_CERT_RESOLVER` | *(optionnel)* Nom du resolver ACME dans Traefik (défaut `letsencrypt` dans le script) |

- [ ] Tous les secrets ci-dessus renseignés (les optionnels peuvent être vides sauf si vous utilisez une valeur custom)
- [ ] *(Si SSH ≠ port 22)* : ajouter `port: <votre_port>` sous `with:` des deux étapes `appleboy/ssh-action` dans `.github/workflows/deploy-vdev.yml`

---

## Phase 3 — Fichiers automatisés dans ce dépôt

- [ ] Workflow `.github/workflows/deploy-vdev.yml` présent
- [ ] `infra/vps/vdev/docker-compose.yml` + `vdev.env.template` + `mongo-init.js` + `scripts/backup.sh`
- [ ] Image API & client buildées avec les Dockerfiles du repo

---

## Phase 4 — Premier déploiement automatisé

- [ ] Merge ou push sur la branche **`vdev`** pour déclencher le workflow
- [ ] Pipeline GitHub Actions : **test → build → push Harbor → sync_remote → backup → deploy** au vert
- [ ] Site accessible en HTTPS sur le sous-domaine vdev (ex. `https://vdev.dsp5-archi-o22a-15m-g3.fr`)
- [ ] API : `GET /api/health` OK via le même host (ex. `https://vdev....../api/health`)

---

## Phase 5 — Sauvegardes & exploitation

- [ ] Cron sur le VPS pour `backup.sh` quotidien (en plus du backup avant déploiement dans la CI)
- [ ] Tester une restauration Restic (procédure documentée en interne)
- [ ] *(Optionnel)* Dupliquer le modèle pour `vpreprod` / `vprod` (branches + projets Harbor + dossiers `/srv/...`)

---

## Rappel du flux automatique (branche `vdev`)

1. **test** — lint client + tests serveur (Jest smoke)
2. **build** — build Docker API + client (tag `sha` Git + `vdev-latest`)
3. **push_harbor** — push des images vers `HARBOR_REGISTRY/HARBOR_PROJECT/...`
4. **sync_remote** — SSH : `mkdir` `/srv/vdev`, copie des fichiers depuis le dépôt, génération de `.env`, `docker login` Harbor
5. **backup** — SSH : dump MongoDB + `restic` si MongoDB tourne déjà (sinon ignoré au premier déploiement)
6. **deploy** — SSH : `docker compose pull` + `up -d` dans `/srv/vdev`

---

## Dépannage CI — `context deadline exceeded` au `docker login`

Ce message vient du **réseau** : le runner GitHub (sur Internet) **n’arrive pas à contacter** votre Harbor/registry avant la fin du délai. Ce n’est en général **pas** un mauvais mot de passe (cela donnerait plutôt une erreur 401).

**À vérifier :**

1. **`HARBOR_REGISTRY`** : uniquement `hôte:port`, **sans** `https://` (ex. `registre.mondomaine.fr:8443` ou `212.227.82.68:8443`). Le port doit être celui où Harbor expose **le registry** (souvent **443** ou **8443** selon votre install Ansible).
2. **Pare-feu (UFW / hébergeur)** : le port du registry doit être **ouvert vers 0.0.0.0/0** (Internet), pas seulement depuis votre box.
3. **Depuis votre PC** (hors VPN du même LAN que le VPS) :  
   `curl -vk https://VOTRE_HOST:PORT/v2/`  
   Vous devez obtenir une réponse HTTP (souvent **401** sans auth), pas un timeout.
4. **IP privée** dans le secret : si `HARBOR_REGISTRY` pointe vers `10.x` / `192.168.x`, **GitHub ne pourra jamais joindre** le serveur → utiliser le **nom de domaine public** ou l’**IP publique** du VPS.
5. **Harbor en HTTP seulement (port 8080)** : Docker sur le runner tente en général du **HTTPS**. Il faut soit activer **HTTPS** sur Harbor (certificat, souvent Let’s Encrypt ou reverse proxy), soit une solution avancée (registry derrière un tunnel / runner self-hosted).

Le workflow inclut une étape **« Diagnostiquer joignabilité du registry »** avant le login pour échouer plus vite avec un message explicite.

---

## Suivi des corrections / itérations

| Date | Action |
|------|--------|
| | |
