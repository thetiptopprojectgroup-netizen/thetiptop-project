# Corriger ERR_CERT_AUTHORITY_INVALID (www vs apex)

## Cause probable

**www** et le domaine **apex** doivent pointer vers la **meme IP** (VPS / reverse proxy). Si `www` pointe ailleurs, le navigateur peut recevoir un autre certificat.

## 1. Verifier les DNS

```cmd
nslookup exemple.fr
nslookup www.exemple.fr
```

Les deux doivent resoudre vers la **meme IP** que celle utilisee par Traefik sur le VPS.

Recuperer l'IP attendue : adresse du VPS dans votre hebergeur ou `infra/deploy` / inventaire Ansible.

## 2. Corriger la zone DNS

Dans votre fournisseur DNS : enregistrement **A** (ou CNAME) pour `www` vers la meme cible que `@` / apex.

## 3. Apres modification

- Attendre la propagation (souvent 5-15 minutes).
- Tester en navigation privee.

## 4. Forcer un renouvellement cote serveur

Si le certificat a ete emis alors que le DNS etait incorrect : sur le VPS, suivre la procedure Traefik / ACME (voir `TLS-PROD-DIAGNOSTIC.md`) : redemarrage controle de Traefik ou reinitialisation du stockage ACME si necessaire.

**Note** : le workflow GitHub **Fix prod TLS certificate** (kubectl) a ete retire avec le dossier `k8s/`. Le diagnostic se fait sur le VPS (Traefik + Docker).
