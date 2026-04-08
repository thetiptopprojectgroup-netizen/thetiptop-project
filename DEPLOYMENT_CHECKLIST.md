# Checklist déploiement VPS — Harbor, MinIO, Restic, Traefik (TheTipTop)

Cochez chaque étape lorsqu’elle est **terminée et vérifiée**. Ce document suit le plan *Plan_VPS_Harbor_MinIO_Restic* (extrait dans `PLAN_EXTRACT.txt`).

**Mise à jour :** les secrets et le flux **branche `vdev`** sont alignés sur `.github/workflows/deploy-vdev.yml` (projet Harbor = `vdev`, pas `tiptop-vdev`).

### Travailler sans ligne de commande sur le VPS

- **IONOS** : DNS (enregistrements **A** pour `minio`, `restic`, `vdev`, `harbor`, etc.) — tout se fait dans l’interface IONOS.
- **Git / GitHub** : tu modifies les fichiers dans le dépôt (ex. `infra/vps/traefik/dynamic/minio.yml`) et tu **pousses** la branche ; les workflows **`deploy-vdev.yml`**, **`deploy-vpreprod.yml`**, **`deploy-vprod.yml`** synchronisent le code sur le VPS et exécutent **`infra/deploy/apply-traefik-minio-from-app.sh`** (mise à jour Traefik + tentative `docker network connect` pour MinIO). Aucun SSH de ta part n’est nécessaire pour cette étape.
- **Prérequis une seule fois** : le VPS doit déjà avoir **Docker**, **Traefik** (`/opt/thetiptop/traefik`) et le conteneur **`thetiptop-minio`** (souvent posé par Ansible ou ton hébergeur). Sans MinIO, tu auras encore des erreurs côté proxy après correction du 404.

### Légende des cases ci-dessous

- **[x]** = **confirmé dans le dépôt** (fichiers / workflows présents) **ou** indiqué comme fait de votre côté (VPS, Harbor, secrets) — **recochez après vérification réelle** si besoin.
- **[ ]** = **reste à faire** ou **à valider manuellement** sur votre infra.

---

## État synthétique (vue projet — à ajuster chez vous)

| Zone | Statut |
|------|--------|
| Dépôt + workflow CD `vdev` + `infra/deploy/` | Fait (versionné) |
| VPS, DNS, HTTPS, Harbor opérationnels | **À confirmer / maintenir** chez vous |
| Secrets GitHub + `VDEV_ENV_FILE` (Google, EmailJS, JWT, Mongo, Traefik…) | **À confirmer** (soutenance) |
| Sauvegardes Restic / cron / test restauration | **Souvent encore à faire** (voir Phase 5) |
| Monitoring (Prometheus/Grafana) | Hors checklist détaillée ici — voir `PLAN_COMPLET_ETAT_AVANCEMENT.md` |

---

## Phase 0 — Prérequis locaux & dépôt

- [x] Dépôt Git sur GitHub (ou GitLab — adapter le workflow si besoin)
- [x] Branche `vdev` créée et poussée : `git push -u origin vdev`
- [ ] Accès administrateur au VPS (SSH) et nom de domaine pointant vers le VPS (ex. `vdev.dsp5-archi-o22a-15m-g3.fr` → IP du VPS) — **cocher après test SSH + résolution DNS**

---

## Phase 1 — Bootstrap infrastructure sur le VPS (Ansible)

> Ce qui est **automatisé** à chaque push sur **`vdev`** (workflow actuel) : job Harbor (création projet **`vdev`** si besoin), build & push des images, **rsync** vers `/opt/thetiptop/app`, écriture de `infra/deploy/env/vdev.env` depuis le secret **`VDEV_ENV_FILE`**, `docker login` sur le VPS, `docker compose -f infra/deploy/docker-compose.stack.yml … up -d`. Voir `.github/workflows/deploy-vdev.yml`.

> L’installation initiale **Docker, UFW, Traefik, MinIO, Harbor, Restic** peut être faite via **Ansible** (`infra/ansible/`). Voir **`infra/ansible/README.md`**.

- [ ] Inventaire : `infra/ansible/inventory/hosts.yml` (copie de `hosts.example.yml`)
- [ ] Variables : `infra/ansible/group_vars/all/vars.yml` (copie de `vars.yml.example`) — idéalement secrets dans **ansible-vault**
- [ ] Collections : `cd infra/ansible && ansible-galaxy collection install -r requirements.yml`
- [ ] Exécution : `ansible-playbook site.yml -i inventory/hosts.yml` (depuis `infra/ansible/`)
- [ ] Post-Ansible : projet Harbor **`vdev`** (nom attendu par le workflow) + compte robot **CI** ; registry noté pour **`HARBOR_REGISTRY_BASE`** (secret GitHub)
- [ ] *(Optionnel)* Cron sur le VPS pour `backup.sh` quotidien (voir doc Restic / scripts du dépôt si présents)

---

## Phase 2 — Secrets GitHub (CI/CD)

Dans le dépôt : **Settings → Secrets and variables → Actions**

Secrets utilisés par **`deploy-vdev.yml`** (noms exacts) :

| Secret | Description |
|--------|-------------|
| `HARBOR_REGISTRY_BASE` | **Hôte** du registry **sans** chemin projet (ex. `harbor.example.fr`) : le workflow fait `REGISTRY="$BASE/vdev"` puis `docker login` sur la partie avant le premier `/`. |
| `HARBOR_ADMIN_USER` | Compte admin Harbor (API création de projet) |
| `HARBOR_ADMIN_PASSWORD` | Mot de passe admin Harbor |
| `HARBOR_USERNAME` | Utilisateur ou **robot** Harbor (push CI + `docker login` sur le VPS) |
| `HARBOR_PASSWORD` | Mot de passe / token du robot |
| `VPS_HOST` | IP ou hostname SSH du VPS |
| `VPS_SSH_USER` | Utilisateur SSH (ex. `deploy`) |
| `VPS_SSH_KEY` | Clé **privée** PEM (multiligne) |
| `VDEV_ENV_FILE` ou `VDEV_ENV` | **Contenu entier** du fichier `vdev.env` (voir `infra/deploy/env/vdev.env.example`) : Mongo, JWT, `CLIENT_URL`, `BACKEND_URL`, `TRAEFIK_HOST_RULE`, `REGISTRY`, **Google OAuth**, **EmailJS**, etc. Option : `VDEV_ENV_FILE_B64` (fichier en base64). |
| `HARBOR_CA_CERT` | *(optionnel)* PEM de la CA si registry en TLS avec CA privée |

**Variable** (onglet *Variables* ou secret) pour le **build client** :

| Nom | Description |
|-----|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Même valeur que `GOOGLE_CLIENT_ID` dans `vdev.env` (connexion Google côté navigateur) |

- [ ] Tous les secrets / variables ci-dessus renseignés pour votre environnement (Google + EmailJS si soutenance)
- [ ] `VDEV_ENV_FILE` sans **CRLF** (fin de ligne LF) pour ne pas casser les règles Traefik — voir commentaire dans le workflow
- [ ] *(Si SSH ≠ port 22)* : adapter la connexion SSH dans `.github/workflows/deploy-vdev.yml` (le workflow actuel utilise `ssh` / `rsync` en ligne de commande, pas `appleboy/ssh-action`)

---

## Phase 3 — Fichiers automatisés dans ce dépôt

- [x] Workflow `.github/workflows/deploy-vdev.yml` présent
- [x] Stack déployée : `infra/deploy/docker-compose.stack.yml` + exemples d’env `infra/deploy/env/vdev.env.example` (et `mongo-init.js` à la racine du dépôt pour le compose local)
- [x] Image API & client : `server/Dockerfile` et `client/Dockerfile` (cibles utilisées par le workflow)

---

## Phase 4 — Premier déploiement automatisé

- [ ] Push sur la branche **`vdev`** pour déclencher le workflow **CD / vdev**
- [ ] Pipeline GitHub Actions au vert : **Harbor projet → build & push images → déploiement VPS** (puis éventuellement PR de promotion vers `vpreprod`)
- [ ] Site accessible en **HTTPS** sur le FQDN vdev (ex. `https://vdev.dsp5-archi-o22a-15m-g3.fr` — adapter à votre domaine)
- [ ] API : `GET …/api/health` OK (même host que le front si l’API est servie sous `/api`)

---

## Phase 5 — Sauvegardes & exploitation

- [ ] Cron sur le VPS pour `backup.sh` quotidien (en plus du backup avant déploiement dans la CI)
- [ ] Tester une restauration Restic (procédure documentée en interne)
- [ ] *(Optionnel)* Dupliquer le modèle pour `vpreprod` / `vprod` (branches + projets Harbor + dossiers `/srv/...`)

---

## Rappel du flux automatique (branche `vdev`) — workflow actuel

1. **harbor-project** — assure le projet Harbor **`vdev`** (script `infra/scripts/ensure-harbor-project.sh`)
2. **build-and-push** — `docker build` API + client (build-args `VITE_*`, `SITE_URL`, …) ; push vers `${HARBOR_REGISTRY_BASE}/vdev/...:${{ github.sha }}`
3. **deploy-vps** — SSH : écrit `vdev.env`, `rsync` vers `/opt/thetiptop/app`, `docker login`, `docker compose -f infra/deploy/docker-compose.stack.yml … up -d`, scripts seed utilisateurs si prévus

> Le workflow **`ci.yml`** (CI Monorepo) gère lint/tests et images sur push/PR vers `vdev` / `vpreprod` / `vprod` ; il n’est pas détaillé comme étapes du job CD ci-dessus.

---

## Dépannage CI — `context deadline exceeded` au `docker login`

Ce message vient du **réseau** : le runner GitHub (sur Internet) **n’arrive pas à contacter** votre Harbor/registry avant la fin du délai. Ce n’est en général **pas** un mauvais mot de passe (cela donnerait plutôt une erreur 401).

**À vérifier :**

1. **`HARBOR_REGISTRY_BASE`** : cohérent avec ce que le workflow utilise pour `docker login` et les tags d’images (voir en-tête du workflow ; souvent host/path **sans** `https://` pour la partie login). Adapter selon votre Harbor.
2. **Pare-feu (UFW / hébergeur)** : le port du registry doit être **ouvert vers 0.0.0.0/0** (Internet), pas seulement depuis votre box.
3. **Depuis votre PC** (hors VPN du même LAN que le VPS) :  
   `curl -vk https://VOTRE_HOST:PORT/v2/`  
   Vous devez obtenir une réponse HTTP (souvent **401** sans auth), pas un timeout.
4. **IP privée** dans le secret : si le registry pointe vers `10.x` / `192.168.x`, **GitHub ne pourra jamais joindre** le serveur → utiliser le **nom de domaine public** ou l’**IP publique** du VPS.
5. **Harbor en HTTP seulement (port 8080)** : Docker sur le runner tente en général du **HTTPS**. Il faut soit activer **HTTPS** sur Harbor (certificat, souvent Let’s Encrypt ou reverse proxy), soit une solution avancée (registry derrière un tunnel / runner self-hosted).

Si besoin, ajoutez une étape de diagnostic (`curl` / `nc`) dans le workflow avant `docker login` pour isoler un timeout réseau.

---

## Dépannage CI — `x509: certificate is not valid for any names`

Docker vérifie que le certificat TLS présenté par le registry contient le **même nom** que celui utilisé pour `docker login` (dérivé de **`HARBOR_REGISTRY_BASE`**, ex. `harbor.dsp5-archi-o22a-15m-g3.fr`). Si le certificat est pour un autre nom (`localhost`, ancien domaine, IP seule), le login / push échoue.

### Voir le certificat depuis Windows (PowerShell)

La syntaxe bash `</dev/null` ne fonctionne pas dans PowerShell. Utilisez par exemple :

```powershell
$HostName = "harbor.dsp5-archi-o22a-15m-g3.fr"
$Port = 443
$tcp = New-Object Net.Sockets.TcpClient($HostName, $Port)
$stream = $tcp.GetStream()
$ssl = New-Object Net.Security.SslStream($stream, $false, { param($s, $c, $ch, $e) $true })
$ssl.AuthenticateAsClient($HostName)
$cert = New-Object Security.Cryptography.X509Certificates.X509Certificate2($ssl.RemoteCertificate)
Write-Host "Subject:" $cert.Subject
$ext = $cert.Extensions | Where-Object { $_.Oid.Value -eq "2.5.29.17" }
if ($ext) { Write-Host "SAN:" $ext.Format($false) }
$tcp.Close()
```

Vérifiez que **Subject** ou **SAN** contient bien `harbor.dsp5-archi-o22a-15m-g3.fr` (ou le host exact utilisé pour joindre Harbor depuis les runners).

**Avec OpenSSL** (Git for Windows / WSL), sous **cmd** :

```bat
echo | openssl s_client -connect harbor.dsp5-archi-o22a-15m-g3.fr:443 -servername harbor.dsp5-archi-o22a-15m-g3.fr 2>nul | openssl x509 -noout -subject -ext subjectAltName
```

### Ce que vous devez corriger côté serveur (intervention manuelle)

1. **`infra/ansible/group_vars/all/vars.yml`** : la variable **`harbor_hostname`** doit être **exactement** le FQDN public du registry (ex. `harbor.dsp5-archi-o22a-15m-g3.fr`), puis **rejouer** le rôle Harbor (`ansible-playbook site.yml …`) ou régénérer Harbor selon la doc Harbor si vous avez changé le hostname après coup.
2. **Harbor derrière Traefik (HTTPS sur 443)** : le routeur Traefik pour Harbor doit utiliser la règle **Host(`harbor.dsp5-archi-o22a-15m-g3.fr`)** et le resolver **Let’s Encrypt** (port 80 ouvert pour le challenge HTTP-01). Sinon Traefik peut servir un **certificat par défaut** qui ne correspond pas au nom → même erreur x509.
3. **Secret GitHub `HARBOR_REGISTRY_BASE`** (et host utilisé par `docker login`) : même host que dans le certificat, **sans** `https://` si le client Docker l’exige ainsi (ex. `harbor.dsp5-archi-o22a-15m-g3.fr` ou `hôte:8443`).
4. **CA d’entreprise** : si après correction le certificat est correct mais signé par une **CA privée**, ajoutez le secret **`HARBOR_CA_CERT`** (fichier PEM de la CA) — le workflow peut alors installer la CA sous `/etc/docker/certs.d/<hôte_du_registry>/` sur le runner avant `docker login` (voir le workflow pour le détail exact).

### Cas fréquent : `Subject: CN=TRAEFIK DEFAULT CERT` (SAN `…traefik.default`)

Cela signifie que **Traefik ne trouve aucun routeur** pour `Host(harbor.dsp5-archi-o22a-15m-g3.fr)` : il sert son **certificat par défaut** au lieu d’un certificat Let’s Encrypt pour Harbor.

**À faire sur le VPS (intervention manuelle) :**

1. Vérifier le nom du réseau interne Harbor (souvent `harbor`) et du service frontal (souvent `proxy`) :

   ```bash
   cd /opt/harbor
   grep -A2 'services:' docker-compose.yml | head -5
   grep -E '^\s+proxy:' -A20 docker-compose.yml
   grep -E 'networks:' -A5 docker-compose.yml | head -20
   ```

2. Copier l’exemple du dépôt vers `docker-compose.override.yml` **dans le même dossier** que le `docker-compose.yml` de Harbor, puis **adapter** si besoin le nom du réseau (`harbor`) et le **FQDN** dans la règle `Host(\`…\`)` :

   - Fichier d’exemple : `infra/vps/harbor-docker-compose.override.example.yml`

3. Le resolver TLS doit correspondre à Traefik : avec le playbook du dépôt, le nom est **`letsencrypt`** (voir `infra/ansible/roles/traefik/templates/docker-compose.yml.j2`).

4. Redémarrer Harbor :

   ```bash
   cd /opt/harbor
   docker compose up -d
   ```

5. Attendre quelques secondes, puis revérifier depuis Windows (script PowerShell du paragraphe précédent) : le **Subject** / **SAN** doivent contenir **`harbor.dsp5-archi-o22a-15m-g3.fr`** (certificat émis par Let’s Encrypt ou votre ACME).

6. Si le service ne s’appelle pas `proxy` ou le port interne n’est pas **8080**, inspecter le conteneur : `docker compose ps` et `docker inspect <conteneur_proxy> | grep -i ipaddress` — ajuster `loadbalancer.server.port` (souvent **8080** pour Harbor).

### Traefik : `client version 1.24 is too old. Minimum supported API version is 1.40`

Le **provider Docker** de Traefik n’arrive pas à parler au daemon : les routes issues des **labels** ne sont pas chargées → **404** « page not found ». La variable **`DOCKER_API_VERSION`** ne suffit souvent pas (client Go embarqué).

**Correctif fiable :** exposer Harbor via le **provider file** (sans socket Docker pour cette route) :

1. Répertoire **`/opt/thetiptop/traefik/dynamic/`** avec **`harbor.yml`** — modèle dans le dépôt : `infra/vps/traefik/dynamic/harbor.yml` (adapter Host / nom du conteneur backend si besoin).
2. Dans **`docker-compose.yml`** Traefik : volume `…/dynamic:/etc/traefik/dynamic:ro` et options  
   `--providers.file.directory=/etc/traefik/dynamic` et `--providers.file.watch=true`.
3. `docker compose up -d` Traefik. Les erreurs « provider docker » peuvent rester dans les logs ; la route **harbor-file** fonctionne quand même.

Avec **Ansible** : renseigner **`traefik_harbor_hostname`** (et optionnellement **`traefik_harbor_backend`**, défaut `nginx`) dans `group_vars` ; le rôle génère `dynamic/harbor.yml`.

**En complément :** image Traefik récente + labels **`traefik.docker.network`** corrects sur Harbor si un jour le provider Docker re-fonctionne.

### Harbor : redirection `308` vers `https://…:8443`

Si `curl` sur le port **8080** du proxy renvoie un `Location: https://votre-harbor:8443/`, les clients passant par **Traefik:443** seront cassés. Dans **`/opt/harbor/harbor.yml`**, ajoutez :

`external_url: https://harbor.votredomaine.fr`

(sans port, URL publique derrière Traefik), puis **`./prepare`** et redémarrez Harbor (`docker compose down` / `up` selon la doc Harbor).
Le rôle Ansible du dépôt supporte **`harbor_external_url`** dans `group_vars`.

### Même erreur sur le VPS (`docker login` dans sync_remote)

Sur le VPS, répétez l’installation de la CA pour le daemon Docker :

```bash
sudo mkdir -p /etc/docker/certs.d/harbor.dsp5-archi-o22a-15m-g3.fr
sudo nano /etc/docker/certs.d/harbor.dsp5-archi-o22a-15m-g3.fr/ca.crt
# collez le PEM de la CA, enregistrez
sudo systemctl restart docker
```

(adaptez le dossier si l’hôte du registry contient un port, ex. `harbor.example.com:8443`.)

---

## Suivi des corrections / itérations

| Date | Action |
|------|--------|
| 2026-04-03 | Checklist réalignée sur `deploy-vdev.yml` ; Phase 2–4 et flux mis à jour ; cases Phase 0/3 partiellement cochées côté dépôt. |
| | |
