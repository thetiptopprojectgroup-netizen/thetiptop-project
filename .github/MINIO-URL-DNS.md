# Accéder à MinIO par URL (minio.dev.thetiptop-jeu.fr, etc.)

L’Ingress MinIO est déjà défini dans le dépôt et appliqué par le CD au push. Pour accéder à la console MinIO via le navigateur, il suffit de **configurer le DNS** pour que chaque URL pointe vers le bon cluster.

---

## 1. Ce qui est déjà en place

- **Ingress** : `k8s/minio/ingress.yaml` expose MinIO sur les 3 hostnames avec TLS (cert-manager).
- **URLs** :
  - **Dev** : `https://minio.dev.thetiptop-jeu.fr`
  - **Preprod** : `https://minio.preprod.thetiptop-jeu.fr`
  - **Prod** : `https://minio.thetiptop-jeu.fr`

Chaque environnement a sa propre instance MinIO sur son cluster. Il faut donc que **chaque URL pointe vers l’IP du Load Balancer du cluster correspondant**.

---

## 2. Récupérer l’IP du Load Balancer (par cluster)

Sur ta machine (avec `kubectl` configuré sur le bon cluster) :

**Cluster dev :**
```bash
kubectl config use-context <contexte-cluster-dev>
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```
→ Note l’IP affichée (ex. `164.92.xxx.xxx`). C’est la **même IP** que pour `dev.thetiptop-jeu.fr` et `api.dev.thetiptop-jeu.fr`.

**Cluster preprod :** même commande en se connectant au cluster preprod → une autre IP.

**Cluster prod :** même commande sur le cluster prod → une autre IP.

Si tu utilises un hostname au lieu d’une IP (ex. DigitalOcean) :
```bash
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 3. Créer les enregistrements DNS

Chez le gestionnaire du domaine **thetiptop-jeu.fr** (OVH, Gandi, Cloudflare, DigitalOcean DNS, etc.) :

### Option A : Enregistrement A (recommandé si tu as une IP)

| Type | Nom / Sous-domaine | Valeur / Cible | TTL |
|------|--------------------|----------------|-----|
| A    | `minio.dev`        | IP du Load Balancer **dev** | 300 (ou défaut) |
| A    | `minio.preprod`    | IP du Load Balancer **preprod** | 300 |
| A    | `minio`            | IP du Load Balancer **prod** | 300 |

- **minio.dev** → URL finale : `minio.dev.thetiptop-jeu.fr` (cluster dev).
- **minio.preprod** → `minio.preprod.thetiptop-jeu.fr` (cluster preprod).
- **minio** → `minio.thetiptop-jeu.fr` (cluster prod).

### Option B : Enregistrement CNAME (si le LB a un hostname)

Si ton fournisseur K8s donne un hostname (ex. `k8s-dev-xxx.eu-central-1.elb.amazonaws.com`) au lieu d’une IP :

| Type  | Nom / Sous-domaine | Valeur / Cible |
|-------|--------------------|----------------|
| CNAME | `minio.dev`        | `<hostname-du-lb-dev>` |
| CNAME | `minio.preprod`    | `<hostname-du-lb-preprod>` |
| CNAME | `minio`            | `<hostname-du-lb-prod>` |

---

## 4. Exemple concret (DigitalOcean / OVH / autre)

**Exemple : cluster dev sur DigitalOcean**

1. Ouvre **Networking** → **Domains** → **thetiptop-jeu.fr** (ou ton registrar).
2. Ajoute un enregistrement :
   - **Type** : A  
   - **Hostname / Name** : `minio.dev` (certains interfaces demandent `minio.dev.thetiptop-jeu.fr` ou seulement `minio.dev` selon le provider).  
   - **Value / Points to** : l’IP du Load Balancer du cluster dev (celle de `dev.thetiptop-jeu.fr`).
3. Enregistre.
4. Répète pour **minio.preprod** (IP du cluster preprod) et **minio** (IP du cluster prod).

---

## 5. Attendre la propagation et le certificat TLS

- **DNS** : 5 min à 48 h selon le TTL et le provider (souvent quelques minutes).
- **TLS** : cert-manager demande le certificat Let’s Encrypt dès qu’une requête HTTPS arrive sur l’URL. La première fois, ça peut prendre 1–2 min.

Vérifier que le certificat est émis (sur le cluster concerné) :
```bash
kubectl get certificate -n minio
# minio-tls doit être READY=True
```

---

## 6. Se connecter à la console MinIO

1. Ouvre **https://minio.dev.thetiptop-jeu.fr** (ou preprod / prod).
2. Identifiants = ceux des secrets GitHub :
   - **Username** : valeur de `RESTIC_S3_ACCESS_KEY_ID` (ex. `minioadmin`).
   - **Password** : valeur de `RESTIC_S3_SECRET_ACCESS_KEY`.

Tu arrives sur la console MinIO (buckets, objets). Les backups Restic apparaissent dans le bucket configuré (`RESTIC_MINIO_BUCKET`), avec les dossiers `mongodb-dev`, `mongodb-preprod`, `mongodb-prod` selon l’environnement.

---

## Récapitulatif

| URL à utiliser | Enregistrement DNS à créer | Pointe vers |
|----------------|---------------------------|-------------|
| https://minio.dev.thetiptop-jeu.fr | `minio.dev` (A ou CNAME) | Load Balancer cluster **dev** |
| https://minio.preprod.thetiptop-jeu.fr | `minio.preprod` (A ou CNAME) | Load Balancer cluster **preprod** |
| https://minio.thetiptop-jeu.fr | `minio` (A ou CNAME) | Load Balancer cluster **prod** |

L’Ingress et le TLS sont déjà gérés par le CD ; il ne reste que ces 3 entrées DNS à configurer chez ton hébergeur de domaine.
