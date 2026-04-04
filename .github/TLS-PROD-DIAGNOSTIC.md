# Certificat TLS en production : ERR_CERT_AUTHORITY_INVALID

Le deploiement utilise **Traefik sur VPS** (Docker) avec certificats **Let's Encrypt** (ACME), pas cert-manager / Kubernetes.

## 1. Verifier le DNS

Le nom de domaine public (ex. `dsp5-archi-o22a-15m-g3.fr` ou `vprod....`) doit pointer vers **l'IP du VPS** ou du reverse proxy qui termine le HTTPS.

```bash
nslookup votre-domaine.fr
```

## 2. Verifier Traefik et les volumes ACME sur le VPS

En SSH sur le serveur :

- Conteneur Traefik en cours d'execution (`docker ps` ou `docker compose ps`).
- Labels / configuration Traefik : routeur pour le bon `Host`, challenge HTTP ou TLS-ALP3.
- Dossier / volume des certificats ACME (souvent `acme.json`) : droits en ecriture pour Traefik, pas de fichier vide corrompu.

Si `acme.json` est invalide ou bloque les renouvellements, **arreter Traefik**, sauvegarder le fichier, le supprimer ou le reinitialiser selon votre procedure, puis redemarrer Traefik pour redemander un certificat (apres verification DNS et port 80/443).

## 3. Causes frequentes

| Cause | Action |
|-------|--------|
| DNS ne pointe pas vers le bon serveur | Corriger les enregistrements A/AAAA |
| Port 80 ou 443 filtre | Ouvrir 80/443 vers Traefik |
| Mauvais hostname dans la config (compose / labels) | Aligner `Host()` avec le domaine reel |
| Premier demarrage : delai Let's Encrypt | Attendre 2-5 minutes, retester en navigation privee |

## 4. Ancienne doc Kubernetes

Les procedures `kubectl` / `cert-manager` / dossier `k8s/` ont ete supprimees du depot au profit d'**Ansible** et des workflows `deploy-vdev.yml`, `deploy-vpreprod.yml`, `deploy-vprod.yml`.
