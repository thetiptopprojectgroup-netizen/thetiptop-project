# Ansible — bootstrap VPS TheTipTop

Automatise l’installation sur le VPS : **Docker**, **UFW**, réseau **traefik_public**, **Traefik** (ACME), **MinIO**, **Harbor**, **Restic** (init sur bucket S3 MinIO).

Le déploiement applicatif (**vdev**) reste déclenché par **GitHub Actions** (push sur `vdev`).

## Prérequis

- Contrôleur : Ansible **2.14+** (machine locale ou CI).
- Cible : **Ubuntu 22.04/24.04** ou **Debian 12** (amd64), accès **SSH** root ou sudo.
- DNS : enregistrements pointant vers le VPS pour Traefik (ACME HTTP-01 sur le port 80).

### Windows (PowerShell : « ansible-playbook n’est pas reconnu »)

Ansible n’est pas fourni avec Windows. Approche recommandée : **WSL2 + Ubuntu**.

1. PowerShell **en administrateur** : `wsl --install` (redémarrer si demandé), distribution **Ubuntu**.
2. Lancer **Ubuntu**, puis :

   ```bash
   sudo apt update && sudo apt install -y ansible sshpass python3-pip
   cd "/mnt/d/projet fin detude/thetiptop-project/infra/ansible"
   ansible-galaxy collection install -r requirements.yml
   ansible-playbook site.yml -i inventory/hosts.yml
   ```

   Sous WSL, `D:\` correspond à `/mnt/d/`. Adapte le `cd` si ton chemin diffère.

   Si Ansible affiche *« world writable directory … ignoring ansible.cfg »* : normal sur un dépôt sous `/mnt/d/`. Les rôles sont quand même trouvés car **`site.yml` est à la racine de `infra/ansible/`**, à côté du dossier **`roles/`**. Pour utiliser `ansible.cfg` (optionnel), copiez le projet dans `$HOME` sous WSL (ex. `~/thetiptop-project`).

Sans WSL : installer **Python 3**, puis `pip install ansible` et ajouter le dossier **Scripts** de Python au **PATH** utilisateur.

## Installation des collections

```bash
cd infra/ansible
ansible-galaxy collection install -r requirements.yml
```

## Inventaire et variables

1. Copier l’inventaire :

   ```bash
   cp inventory/hosts.example.yml inventory/hosts.yml
   ```

   Éditer `ansible_host`, **`ansible_user`** (souvent `ubuntu` ou `debian` sur les images cloud, pas `root`), et **`ansible_ssh_private_key_file`** vers la clé privée **dans WSL** (ex. `~/.ssh/id_ed25519`). Copiez la clé depuis Windows vers `~/.ssh/` si besoin, droits `chmod 600` sur la clé privée.  
   Erreur **Permission denied (publickey)** : tester d’abord `ssh -i ~/.ssh/id_ed25519 ubuntu@IP` depuis WSL ; tant que ça échoue, Ansible échouera aussi.

2. Copier les variables :

   ```bash
   cp group_vars/all/vars.yml.example group_vars/all/vars.yml
   ```

3. Adapter `group_vars/all/vars.yml` : emails ACME, mots de passe MinIO/Harbor, `harbor_hostname`, ports, etc.

4. *(Recommandé)* Chiffrer les secrets avec **ansible-vault** :

   ```bash
   ansible-vault create group_vars/all/vault.yml
   ```

   Y placer par exemple `harbor_admin_password`, `minio_root_password`, `restic_password`, puis référencer ces variables depuis `vars.yml` ou fusionner avec `include_vars`.

## Exécution

```bash
cd infra/ansible
ansible-playbook site.yml -i inventory/hosts.yml
```

Avec vault :

```bash
ansible-playbook site.yml -i inventory/hosts.yml --ask-vault-pass
```

### Playbook partiel

```bash
ansible-playbook docker_only.yml -i inventory/hosts.yml
```

## Après Ansible

1. **Harbor** : UI en `http://{{ harbor_hostname }}:{{ harbor_http_port }}` (HTTPS désactivé par défaut). Créez le projet **`tiptop-vdev`** et un utilisateur robot pour la CI.
2. **Registry dans GitHub** : `HARBOR_REGISTRY` = `hostname:port` (ex. `registre.example.com:8080` si HTTP).
3. **MinIO** : console `http://IP:9001`, buckets créés par le rôle (`vdev`, `vpreprod`, `vprod`, `vdev-restic` si ajouté dans `minio_buckets`).
4. Poussez sur **`vdev`** pour lancer le workflow GitHub Actions.

## Ordre des rôles

| Rôle              | Rôle |
|-------------------|------|
| `docker`          | Docker CE + plugin Compose |
| `firewall`        | UFW (si `firewall_enabled`) |
| `traefik_network` | Réseau Docker `traefik_public` |
| `traefik`         | Conteneur Traefik (80/443) |
| `minio`           | MinIO + client `mc` + buckets |
| `harbor`          | Installateur Harbor offline |
| `restic_client`   | Binaire `restic` + `restic init` (si `restic_install`) |

## Notes

- **Harbor** télécharge un gros archive (~600 Mo) ; la première exécution peut être longue.
- **Ports Harbor** par défaut : HTTP `8080`, HTTPS `8443` si `harbor_enable_https: true` — pas de conflit avec Traefik sur 80/443.
- Ajustez `firewall_allowed_tcp_ports` pour ces ports.
- Si `restic init` échoue, vérifiez `restic_repository`, le bucket MinIO et les identifiants.

## Vérifier que ça marche

### Avant de lancer le playbook (depuis votre PC)

```bash
cd infra/ansible
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml --syntax-check -i inventory/hosts.yml
ansible all -m ping -i inventory/hosts.yml
```

- **`syntax-check`** : pas d’erreur YAML / Ansible sur le playbook.
- **`ping`** : connexion SSH + Python sur le VPS (répond `pong`).

### Après un playbook réussi

Sur le VPS (SSH) :

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker network ls | grep traefik_public
curl -sI http://127.0.0.1:80 | head -n1
```

- **Traefik** : conteneur `traefik` en cours d’exécution.
- **Réseau** : `traefik_public` présent.
- **Port 80** : une réponse HTTP (même une 404 Traefik suffit pour voir que le port répond).

**MinIO** (ports 9000 / 9001 ouverts) : ouvrir `http://IP_DU_VPS:9001` (console) et se connecter avec `minio_root_user` / `minio_root_password`.

**Harbor** : ouvrir `http://VOTRE_HARBOR_HOST:8080` (si HTTP par défaut) et se connecter avec `admin` / `harbor_admin_password`.

**Restic** (si activé) :

```bash
sudo RESTIC_REPOSITORY="s3:http://127.0.0.1:9000/vdev-restic" RESTIC_PASSWORD="..." \
  AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." \
  restic snapshots
```

(ajuster les variables comme dans `group_vars`.)

### GitHub Actions (branche `vdev`)

1. **GitHub** → dépôt → **Actions** → workflow **Deploy vdev** : tous les jobs verts (test → build → push → sync → backup → deploy).
2. Ouvrir l’URL du site **vdev** (HTTPS) et tester `https://votre-sous-domaine/api/health` : JSON avec statut OK attendu.

### En local (sans VPS) — uniquement la partie « build »

Depuis la racine du projet :

```bash
cd client && npm ci && npm run lint
cd ../server && npm ci && npm test
```

Si ces commandes passent, le **job test** de la CI a de bonnes chances de passer aussi.
