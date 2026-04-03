# Erreur : Docker login Harbor "context deadline exceeded"

## Message d’erreur

```
Run docker/login-action@v3
Logging into ***...
Error: Error response from daemon: Get "https://***/v2/": context deadline exceeded
```

Cela signifie que le **runner GitHub Actions** n’arrive pas à joindre votre registry Harbor dans le temps imparti (timeout).

---

## Causes possibles

| Cause | Explication |
|-------|-------------|
| **Registry non joignable depuis Internet** | Harbor est sur un réseau privé (VPN, IP interne, datacenter). Les runners GitHub sont sur Internet et ne peuvent pas atteindre une IP privée. |
| **HARBOR_REGISTRY incorrect** | Le secret doit être **uniquement le hostname** (ex. `harbor.example.com`), **sans** `https://` ni `/`. |
| **DNS** | Le hostname ne résout pas depuis les serveurs GitHub (DNS interne uniquement, ou domaine pas encore propagé). |
| **Firewall / sécurité** | Le port 443 (HTTPS) vers le registry est bloqué pour les IP sortantes de GitHub, ou un WAF coupe la connexion. |
| **Registry lent ou indisponible** | Harbor ou le réseau est très lent ou down, la connexion dépasse le timeout. |

---

## Vérifications

### 1. Format du secret `HARBOR_REGISTRY`

- **Correct** : `harbor.ton-domaine.fr` ou `registry.thetiptop.fr`
- **Incorrect** : `https://harbor.ton-domaine.fr` ou `https://harbor.ton-domaine.fr/`

Dans GitHub → Settings → Secrets, la valeur doit être le **nom d’hôte seul**.

### 2. Accessibilité depuis Internet

Depuis **votre machine** (ou un serveur avec accès Internet) :

```bash
curl -v --connect-timeout 10 "https://VOTRE_HARBOR_REGISTRY/v2/"
```

Remplacez `VOTRE_HARBOR_REGISTRY` par la même valeur que le secret. Vous devez obtenir une réponse HTTP (même 401 Unauthorized = le registry répond).

Si vous avez un timeout ou "Could not resolve host", le registry n’est **pas** joignable depuis Internet.

### 3. Harbor en réseau privé uniquement

Si Harbor est uniquement sur un réseau privé (VPN, interne) :

- Soit vous **exposez Harbor sur Internet** (HTTPS, firewall, DNS public), et vous gardez les runners GitHub hébergés.
- Soit vous utilisez un **self-hosted runner** GitHub Actions installé sur le même réseau (ou un réseau qui peut joindre Harbor), et le workflow s’exécute sur ce runner.

---

## Solutions

### A. Rendre Harbor accessible depuis Internet

- DNS : un enregistrement A/CNAME pointant vers l’IP de Harbor (ex. IP publique du serveur ou du load balancer).
- Firewall : autoriser le port 443 (HTTPS) depuis n’importe quelle IP (ou depuis les [plages IP GitHub](https://api.github.com/meta) si vous les restreignez).
- TLS : certificat valide (Let’s Encrypt ou autre) pour éviter les erreurs de certificat.

Une fois que `curl https://VOTRE_HARBOR_REGISTRY/v2/` répond depuis une machine sur Internet, les Actions pourront s’y connecter.

### B. Désactiver la vérification (si Harbor est privé + self-hosted runner)

Si votre Harbor est **en réseau privé** et que vous utilisez un **self-hosted runner** qui a accès à ce réseau, vous pouvez ignorer l’étape de vérification de connectivité (qui échoue sur les runners GitHub) :

1. **GitHub** → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret** : nom `SKIP_HARBOR_REACHABILITY_CHECK`, valeur `true`.

L’étape « Check Harbor registry reachability » sera alors ignorée et le workflow tentera directement le login Docker. Sur un runner self-hosted ayant accès à Harbor, le login pourra réussir.

**Attention** : si vous gardez les runners **hébergés par GitHub** (ubuntu-latest), le login Docker échouera quand même avec « context deadline exceeded ». Ce secret est utile uniquement avec un self-hosted runner qui peut joindre Harbor.

### C. Utiliser un self-hosted runner

1. GitHub → Settings → Actions → Runners → New self-hosted runner.
2. Installer le runner sur une machine qui a accès à Harbor (même réseau / VPN).
3. Dans le workflow, utiliser ce runner (ex. `runs-on: self-hosted` ou un label dédié) pour le job qui build et push les images.

Ainsi le login Docker se fait depuis un réseau qui peut joindre Harbor. Vous pouvez alors ajouter le secret `SKIP_HARBOR_REACHABILITY_CHECK=true` pour éviter l’échec de l’étape de vérification sur les runners GitHub (si le job build tourne sur le self-hosted).

### D. Vérifier le secret et relancer

1. Vérifier que `HARBOR_REGISTRY` = hostname seul, sans `https://`.
2. Vérifier `HARBOR_USERNAME` et `HARBOR_PASSWORD` (robot account ou utilisateur avec droits push).
3. Relancer le workflow après correction.

---

## Résumé

- **"context deadline exceeded"** = le runner ne peut pas atteindre le registry à temps.
- Corriger le **format** de `HARBOR_REGISTRY` (hostname seul).
- S’assurer que Harbor est **accessible depuis Internet** (test avec `curl https://.../v2/`) ou utiliser un **self-hosted runner** sur le réseau qui a accès à Harbor.
