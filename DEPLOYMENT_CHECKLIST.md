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
| `HARBOR_CA_CERT` | *(optionnel)* Contenu PEM du **certificat CA** qui signe Harbor (CA d’entreprise). Utile seulement si le certificat du registry a le **bon nom de domaine** ; sinon régénérer le TLS côté serveur. |

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

## Dépannage CI — `x509: certificate is not valid for any names`

Docker vérifie que le certificat TLS présenté par le registry contient le **même nom** que dans `HARBOR_REGISTRY` (ex. `harbor.dsp5-archi-o22a-15m-g3.fr`). Si le certificat est pour un autre nom (`localhost`, ancien domaine, IP seule), le login / push échoue.

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

Vérifiez que **Subject** ou **SAN** contient bien `harbor.dsp5-archi-o22a-15m-g3.fr` (ou le host exact de votre secret `HARBOR_REGISTRY`).

**Avec OpenSSL** (Git for Windows / WSL), sous **cmd** :

```bat
echo | openssl s_client -connect harbor.dsp5-archi-o22a-15m-g3.fr:443 -servername harbor.dsp5-archi-o22a-15m-g3.fr 2>nul | openssl x509 -noout -subject -ext subjectAltName
```

### Ce que vous devez corriger côté serveur (intervention manuelle)

1. **`infra/ansible/group_vars/all/vars.yml`** : la variable **`harbor_hostname`** doit être **exactement** le FQDN public du registry (ex. `harbor.dsp5-archi-o22a-15m-g3.fr`), puis **rejouer** le rôle Harbor (`ansible-playbook site.yml …`) ou régénérer Harbor selon la doc Harbor si vous avez changé le hostname après coup.
2. **Harbor derrière Traefik (HTTPS sur 443)** : le routeur Traefik pour Harbor doit utiliser la règle **Host(`harbor.dsp5-archi-o22a-15m-g3.fr`)** et le resolver **Let’s Encrypt** (port 80 ouvert pour le challenge HTTP-01). Sinon Traefik peut servir un **certificat par défaut** qui ne correspond pas au nom → même erreur x509.
3. **Secret GitHub `HARBOR_REGISTRY`** : même host que dans le certificat, **sans** `https://` (ex. `harbor.dsp5-archi-o22a-15m-g3.fr` ou `hôte:8443` si vous utilisez explicitement ce port).
4. **CA d’entreprise** : si après correction le certificat est correct mais signé par une **CA privée**, ajoutez le secret **`HARBOR_CA_CERT`** (fichier PEM de la CA) — le workflow installe alors `/etc/docker/certs.d/<HARBOR_REGISTRY>/ca.crt` sur le runner avant `docker login`.

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

(adaptez le dossier si `HARBOR_REGISTRY` contient un port, ex. `harbor.example.com:8443`.)

---

## Suivi des corrections / itérations

| Date | Action |
|------|--------|
| | |
