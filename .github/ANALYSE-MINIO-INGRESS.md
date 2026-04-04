# Analyse – MinIO, Ingress, boucle de redirection

> **Contexte** : document rédigé pour **Traefik + Ingress Kubernetes**. Le dépôt n’inclut plus **`k8s/`** ni **`kubectl`** ; MinIO et Traefik sont gérés via **Docker Compose sur VPS** (`infra/deploy`). Les idées (hosts distincts, HTTPS) restent valables.

## 1. Ce qui a été vérifié

### 1.1 Traefik (values-dev)

- **Redirection HTTP → HTTPS globale** : `entrypoints.web.http.redirections.entrypoint.to=:443` (permanent).
- Donc tout appel en `http://minio.dev...` est redirigé une fois vers `https://...`. Ce n’est pas la cause d’une boucle infinie.
- Les Ingress n’écoutent que sur **websecure** (443) ; le port 80 est géré par cette redirection globale.

### 1.2 Ingress thetiptop vs MinIO

- **thetiptop** (dev/preprod/prod) : `traefik-security-headers@kubernetescrd` + `websecure`.
- **minio** : seulement `websecure`, **sans** middleware security-headers.
- Les hosts sont distincts (`dev.thetiptop-jeu.fr` vs `minio.dev.thetiptop-jeu.fr`), pas de conflit de host.

### 1.3 HSTS (capture navigateur)

- `Non-Authoritative-Reason: HSTS` = le navigateur fait une **redirection interne** http → https (à cause de HSTS, souvent hérité de `dev.thetiptop-jeu.fr` avec `stsIncludeSubdomains`).
- Donc la requête qui arrive à Traefik est déjà en **HTTPS**. La boucle ne vient pas du couple http↔https côté Traefik.

### 1.4 Chaîne actuelle (après les derniers changements)

- **Ingress** (host remplacé par le CD) → **Service minio:80** → **nginx** (ConfigMap) → **page statique** (plus de proxy vers MinIO sur `/`).
- **MinIO** : `MINIO_BROWSER=off`, plus d’UI ni de 307 sur `/`.
- Avec cette config, nginx ne fait plus de proxy vers MinIO sur `/` et sert une page fixe → **aucune redirection côté backend** attendue.

---

## 2. Pistes de problème (ordre de probabilité)

### 2.1 Host de l’Ingress non remplacé (très probable)

- Le fichier **sur le repo** contient `MINIO_HOST_PLACEHOLDER`.
- Si l’Ingress a été appliqué **sans** passer par le CD (ou avec un CD qui n’a pas fait le `sed`), le host restera **littéralement** `MINIO_HOST_PLACEHOLDER`.
- Dans ce cas, une requête `https://minio.dev.thetiptop-jeu.fr` **ne matche pas** cet Ingress (host différent).
- Traefik ne trouve alors **aucune route** pour ce host. Selon la config Traefik / défaut du cluster, le comportement peut être : 404, ou un autre Ingress / backend par défaut qui renvoie une redirection → **boucle possible** si ce backend redirige vers la même URL.

**À vérifier sur le cluster :**

```bash
kubectl get ingress -n minio minio-ingress -o jsonpath='{.spec.rules[0].host}'
```

- Attendu : `minio.dev.thetiptop-jeu.fr` (ou preprod/prod selon l’env).
- Si la sortie est `MINIO_HOST_PLACEHOLDER`, c’est la cause : l’Ingress ne matche jamais le host réel.

**Correctif :** toujours appliquer l’Ingress MinIO via le CD (qui fait le `sed`), ou appliquer à la main avec remplacement du placeholder :

```bash
export MINIO_HOST="minio.dev.thetiptop-jeu.fr"   # ou preprod/prod
sed -e "s|MINIO_HOST_PLACEHOLDER|$MINIO_HOST|g" k8s/minio/ingress.yaml | kubectl apply -f -
```

---

### 2.2 Ancienne config encore active (pod / ConfigMap)

- Si le **pod** nginx/MinIO n’a pas été recréé après passage à la **page statique**, il peut encore faire **proxy_pass** vers MinIO.
- Si **MinIO** n’a pas la variable **MINIO_BROWSER=off**, il peut encore renvoyer des 307.

**À vérifier :**

```bash
# Pod récent (âge cohérent avec ton dernier déploiement)
kubectl get pods -n minio -o wide

# Config nginx bien “statique” (pas de proxy_pass vers 9000)
kubectl get configmap -n minio minio-nginx-config -o yaml

# MinIO avec BROWSER=off
kubectl get deployment -n minio minio -o jsonpath='{.spec.template.spec.containers[0].env}' | grep -o 'MINIO_BROWSER'
```

---

### 2.3 Cache navigateur / HSTS

- Anciennes 307 ou redirections peuvent être en cache.
- HSTS est mémorisé par le navigateur pour le domaine (sous-domaine inclus).

**À faire :** tester en **navigation privée** ou après **suppression des cookies et du cache** pour le site `minio.dev.thetiptop-jeu.fr`.

---

### 2.4 Autre Ingress ou route qui prend minio.dev

- Si un autre Ingress (ou une IngressRoute CRD) matche **avant** celui de MinIO (priorité, ordre, autre host générique), le trafic peut aller vers un autre backend (ex. app thetiptop, autre outil) qui renvoie une redirection → boucle.

**À vérifier :**

```bash
kubectl get ingress -A | grep -E "minio|thetiptop"
kubectl get ingress -n minio -o yaml
```

Vérifier qu’il n’y a qu’**un** Ingress pour le host `minio.dev.thetiptop-jeu.fr` et que c’est bien celui du namespace `minio`.

---

## 3. Conformité et bonnes pratiques

### 3.1 Fichier Ingress avec placeholder

- **Norme** : un manifeste appliqué tel quel ne devrait pas laisser de placeholder dans le cluster.
- **Risque** : application manuelle `kubectl apply -f k8s/minio/ingress.yaml` sans `sed` → host invalide.
- **Recommandation** : garder le CD comme seule source de vérité pour cet Ingress, et documenter clairement qu’un apply manuel doit utiliser le `sed` (comme ci-dessus). Option : template (Helm/Kustomize) ou un script `apply-minio-ingress.sh` qui fait le remplacement + apply.

### 3.2 Middleware Traefik

- Les Ingress thetiptop utilisent **traefik-security-headers** (dont HSTS).
- L’Ingress MinIO n’utilise **pas** ce middleware → comportement différent des autres sous-domaines (pas de HSTS explicite pour minio).
- Pour être cohérent et sécurisé, on peut attacher le **même** middleware à l’Ingress MinIO. Cela n’introduit pas de redirection supplémentaire (on est déjà en websecure).

### 3.3 Nginx : servir la config et index.html depuis le même volume

- Aujourd’hui : `root /etc/nginx/conf.d` avec `default.conf` et `index.html` dans le même ConfigMap monté dans `conf.d`.
- **Risque mineur** : une requête vers `/default.conf` exposerait la config. On peut restreindre avec `location ~ \.conf$ { return 404; }` si on veut durcir.

---

## 4. Résumé des actions recommandées

1. **Vérifier le host de l’Ingress** (voir commande § 2.1). Si c’est encore `MINIO_HOST_PLACEHOLDER`, refaire un apply avec le `sed` (ou relancer le CD).
2. **Vérifier** que le déploiement MinIO actuel a bien **MINIO_BROWSER=off** et que le ConfigMap nginx sert bien la **page statique** (pas de proxy vers MinIO sur `/`).
3. **Tester** en navigation privée (ou sans cache/cookies) après ces vérifications.
4. **Optionnel** : ajouter le middleware **traefik-security-headers** sur l’Ingress MinIO pour alignement avec le reste.
5. **Optionnel** : documenter ou scripter l’apply de l’Ingress MinIO pour éviter tout apply manuel sans remplacement du host.

Si après ces points la boucle persiste, la prochaine étape est de capturer une requête **HTTPS** vers `minio.dev.thetiptop-jeu.fr` (onglet Network, en-têtes de la requête et de la réponse, en particulier **Location** et **Status**) pour voir quel backend répond et quelle redirection est renvoyée.
