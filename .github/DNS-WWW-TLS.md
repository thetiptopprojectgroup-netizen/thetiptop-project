# Corriger ERR_CERT_AUTHORITY_INVALID sur www.thetiptop-jeu.fr

## Cause probable

**www.thetiptop-jeu.fr** et **thetiptop-jeu.fr** doivent pointer vers la **même IP** (Load Balancer du cluster prod).  
Si `www` pointe ailleurs (ancien hébergeur, page par défaut OVH, autre serveur), le navigateur reçoit un **autre certificat** → « Votre connexion n'est pas privée » / `NET::ERR_CERT_AUTHORITY_INVALID`.

## 1. Vérifier où pointent les domaines

Sur ta machine (PowerShell ou cmd) :

```cmd
nslookup thetiptop-jeu.fr
nslookup www.thetiptop-jeu.fr
```

Compare les **adresses IP** :
- **thetiptop-jeu.fr** doit donner l’IP du Load Balancer **prod** (ex. `157.230.79.158`).
- **www.thetiptop-jeu.fr** doit donner **exactement la même IP**.

Si `www` affiche une **autre IP** (ou rien, ou une IP OVH par défaut), c’est la cause du certificat.

## 2. Corriger le DNS (OVH ou autre)

Dans la zone **thetiptop-jeu.fr** :

1. Vérifier qu’il existe un enregistrement **A** pour **www** (sous-domaine `www`).
2. Mettre la **cible** de cet enregistrement sur **l’IP du Load Balancer prod** (la même que pour `thetiptop-jeu.fr` ou pour `@` selon ta config).

Exemple OVH :
- Type : **A**
- Sous-domaine : **www**
- Cible : **157.230.79.158** (remplacer par l’IP réelle de ton LB prod)

Récupérer l’IP du LB prod depuis le cluster :

```bash
kubectl get svc -n traefik traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

(avec le kubeconfig **prod**)

## 3. Après modification du DNS

- Attendre **quelques minutes** (propagation DNS, 5–15 min en général).
- Réessayer **https://www.thetiptop-jeu.fr** en **navigation privée** (ou après vidage du cache / autre navigateur).

Si le DNS est correct, le trafic arrive bien sur le cluster, et le certificat Let’s Encrypt (déjà émis pour www dans l’Ingress) sera accepté.

## 4. Si ça ne marche toujours pas (tous navigateurs)

Le certificat actuel a peut‑être été émis quand le DNS pointait encore ailleurs, ou le défi Let's Encrypt a échoué. **Forcer une réémission** :

1. **GitHub Actions** → onglet **Actions** du dépôt.
2. Dans la liste à gauche, choisir **« Fix prod TLS certificate »**.
3. Cliquer **« Run workflow »** → **« Run workflow »**.
4. Attendre la fin du job (1–2 min). Le workflow supprime l’ancien certificat et le secret, réapplique l’Ingress ; cert-manager demande un **nouveau** certificat à Let's Encrypt. Avec le DNS corrigé, le défi HTTP doit réussir.
5. Attendre **1–2 minutes** après le workflow, puis tester **https://thetiptop-jeu.fr** et **https://www.thetiptop-jeu.fr** en **navigation privée**.

Si après le workflow le site affiche encore « Non sécurisé », vérifier dans le cluster que le certificat est bien émis :

```bash
kubectl get certificate -n thetiptop-prod
kubectl describe certificate -n thetiptop-prod
```

Regarder **Status** : **Ready: True** et **Issuer** / **Not After**.  
Si le certificat est en erreur, regarder les **Events** pour les échecs de défi ACME (souvent liés à un mauvais DNS ou à un défi HTTP non atteignable pour `www`).
