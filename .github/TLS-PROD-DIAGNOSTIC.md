# Certificat SSL en prod : ERR_CERT_AUTHORITY_INVALID

Si **https://thetiptop-jeu.fr** affiche « Votre connexion n'est pas privée » avec `NET::ERR_CERT_AUTHORITY_INVALID`, le certificat Let's Encrypt n’est pas valide ou absent sur le cluster **prod**.

## 1. Vérifier que cert-manager et le ClusterIssuer sont installés (cluster prod)

Le cluster **prod** est souvent distinct de dev/preprod. Il faut **cert-manager** et le **ClusterIssuer** dessus.

```bash
# Contexte kubectl pointant vers le cluster PROD
kubectl config use-context <votre-contexte-prod>

# cert-manager installé ?
kubectl get pods -n cert-manager

# ClusterIssuer Let's Encrypt présent ?
kubectl get clusterissuer letsencrypt-prod
```

Si `cert-manager` ou `letsencrypt-prod` est absent, installez-les :

```bash
# Installer cert-manager (voir https://cert-manager.io/docs/installation/)
# Puis appliquer le ClusterIssuer (adapter l'email si besoin) :
kubectl apply -f k8s/traefik/letsencrypt-issuer.yaml
```

## 2. Vérifier le certificat et le secret (namespace prod)

```bash
export NS=thetiptop-prod

# Certificats gérés par cert-manager pour ce namespace
kubectl get certificate -n $NS

# Secret TLS utilisé par l'Ingress
kubectl get secret thetiptop-prod-tls -n $NS

# Détails du certificat (état, raison d'échec éventuel)
kubectl describe certificate -n $NS
```

- Si le **secret** `thetiptop-prod-tls` n’existe pas ou si le **Certificate** est en `Ready: False`, le certificat n’a pas été émis.
- Regardez la section **Events** de `kubectl describe certificate` pour voir l’erreur (ex. : DNS, HTTP-01 challenge, quota Let's Encrypt).

## 3. DNS et challenge HTTP-01

Let's Encrypt utilise le défi **HTTP-01** : il envoie une requête sur `http://thetiptop-jeu.fr/.well-known/acme-challenge/...`. Pour que ça marche :

- **thetiptop-jeu.fr** et **www.thetiptop-jeu.fr** doivent pointer vers l’IP du **Load Balancer / Ingress** du cluster **prod** (pas dev/preprod).
- Le trafic HTTP (port 80) doit bien arriver sur Traefik/cert-manager (pas bloqué par un pare-feu ou un autre proxy).

Vérifiez où pointent les DNS :

```bash
nslookup thetiptop-jeu.fr
nslookup www.thetiptop-jeu.fr
```

## 4. Forcer une nouvelle émission du certificat

Si le certificat est en échec ou absent, vous pouvez supprimer le secret pour que cert-manager le recrée :

```bash
kubectl delete secret thetiptop-prod-tls -n thetiptop-prod
# Puis réappliquer l'Ingress (ou attendre que cert-manager détecte le secret manquant)
kubectl apply -f k8s/prod/ingress.yaml
```

Attendre 1 à 2 minutes, puis revérifier :

```bash
kubectl get certificate -n thetiptop-prod
kubectl describe certificate -n thetiptop-prod
```

Quand le certificat est **Ready: True** et que le secret `thetiptop-prod-tls` existe, recharger https://thetiptop-jeu.fr (éventuellement en navigation privée pour éviter le cache).

## 5. Résumé des causes fréquentes

| Cause | Action |
|-------|--------|
| cert-manager ou ClusterIssuer absent sur le cluster **prod** | Installer cert-manager et appliquer `k8s/traefik/letsencrypt-issuer.yaml` sur le cluster prod. |
| DNS thetiptop-jeu.fr pointe vers dev/preprod au lieu de prod | Corriger les enregistrements DNS pour qu’ils pointent vers l’IP du cluster prod. |
| Certificate en échec (Events dans `describe certificate`) | Corriger la cause (DNS, réseau, quota), puis supprimer le secret et réappliquer l’Ingress. |
| Premier déploiement : certificat pas encore émis | Attendre 2–5 min après le premier `kubectl apply` de l’Ingress, ou supprimer le secret et réappliquer. |

Une fois le certificat **Ready** et le secret présent, l’erreur **ERR_CERT_AUTHORITY_INVALID** disparaît pour https://thetiptop-jeu.fr et https://www.thetiptop-jeu.fr.
