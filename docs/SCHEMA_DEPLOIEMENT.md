# Schéma du déploiement (push → production) — éléments expliqués

Ce document décrit le flux **branche `vdev`** (même logique pour `vpreprod` / `vprod` avec d’autres noms de secrets et URLs). Chaque bloc du schéma indique **ce que c’est**, **à quoi ça sert** et **quel problème ça règle**.

---

## 1. Provisionnement initial (hors push) — Ansible

Exécuté **manuellement** (`ansible-playbook`), pas à chaque `git push`.

```mermaid
flowchart TB
  subgraph ANSIBLE["Ansible — une fois / refonte serveur"]
    direction TB
    P0["Playbook site.yml<br/>────────────<br/>Définition : automatiser l’installation sur le VPS<br/>Rôle : appliquer la même config sur une machine neuve<br/>Problème résolu : pas d’installation « à la main » oubliée"]
    P1["Rôle docker<br/>────────────<br/>Définition : moteur Docker installé et utilisable<br/>Rôle : faire tourner les conteneurs de l’app<br/>Problème résolu : le serveur peut exécuter docker compose"]
    P2["Rôle firewall UFW<br/>────────────<br/>Définition : pare-feu Linux<br/>Rôle : ouvrir seulement SSH + HTTP/S (+ ports utiles)<br/>Problème résolu : réduire la surface d’attaque"]
    P3["Rôles traefik_network + traefik<br/>────────────<br/>Définition : proxy inverse + réseau Docker<br/>Rôle : HTTPS, routage vers les services<br/>Problème résolu : un point d’entrée propre sans exposer Mongo"]
    P4["Rôle harbor<br/>────────────<br/>Définition : registre d’images Docker privé<br/>Rôle : stocker les images poussées par la CI<br/>Problème résolu : le VPS peut pull des images sans Docker Hub public"]
    P5["Rôles minio + restic (optionnel)<br/>────────────<br/>Définition : stockage objet / sauvegardes<br/>Rôle : fichiers ou backups selon config<br/>Problème résolu : persistance et stratégie de backup"]
    P0 --> P1 --> P2 --> P3
    P0 --> P4
    P0 --> P5
  end
```

---

## 2. À chaque push sur `vdev` — GitHub Actions

```mermaid
flowchart TB
  subgraph PUSH["Déclencheur"]
    A["git push sur branche vdev<br/>────────────<br/>Définition : envoi de ton commit sur GitHub<br/>Rôle : lancer le workflow CD configuré pour cette branche<br/>Problème résolu : déploiement automatique sans SSH manuel à chaque fois"]
  end

  subgraph J1["Job 1 — Harbor : projet registry"]
    B["Script ensure-harbor-project<br/>────────────<br/>Définition : appel API Harbor pour créer le projet « vdev » si absent<br/>Rôle : garantir un espace pour les images<br/>Problème résolu : éviter l’échec du push Docker « projet inconnu »"]
  end

  subgraph J2["Job 2 — Build & push images"]
    C["Checkout du dépôt sur le runner<br/>────────────<br/>Définition : clone du code au commit du push<br/>Rôle : fichiers nécessaires au docker build<br/>Problème résolu : build reproductible à partir du bon commit"]
    D["docker build API + docker build client<br/>────────────<br/>Définition : construction d’images à partir des Dockerfiles<br/>Rôle : client compilé avec VITE_API_URL / SITE_URL (vdev)<br/>Problème résolu : le navigateur appelle la bonne API et le bon domaine"]
    E["SHA du commit = tag des images<br/>────────────<br/>Définition : identifiant unique du commit Git (hash)<br/>Rôle : nommer les images ex. api:SHA et client:SHA<br/>Problème résolu : savoir exactement quel code tourne ; éviter le flou du tag « latest »"]
    F["docker push vers Harbor<br/>────────────<br/>Définition : envoi des images sur ton registre privé<br/>Rôle : rendre les images téléchargeables par le VPS<br/>Problème résolu : le serveur n’a pas besoin du code source pour exécuter l’app"]
    C --> D --> E --> F
  end

  subgraph J3["Job 3 — VPS"]
    G["Secret VDEV_ENV_FILE → fichier vdev.env sur le VPS<br/>────────────<br/>Définition : variables (Mongo, JWT, CLIENT_URL, EmailJS…)<br/>Rôle : configurer l’API et Compose sans committer les secrets<br/>Problème résolu : secrets hors Git ; bonne config à chaque déploiement"]
    H["SSH avec clé privée<br/>────────────<br/>Définition : connexion sécurisée machine GitHub → VPS<br/>Rôle : exécuter commandes à distance<br/>Problème résolu : automatiser ce que tu ferais en ssh manuel"]
    I["rsync dépôt → /opt/thetiptop/app<br/>────────────<br/>Définition : synchronisation fichiers (comme une copie incrémentale)<br/>Rôle : mettre à jour compose, scripts, mongo-init… sur le serveur<br/>Problème résolu : le VPS utilise la même version des fichiers d’infra que le repo ; exclusion des *.env locaux pour ne pas écraser le secret"]
    J["docker login sur le VPS<br/>────────────<br/>Définition : authentification du daemon Docker auprès de Harbor<br/>Rôle : autoriser docker pull des images privées<br/>Problème résolu : pull refusé sans identifiants"]
    K["IMAGE_TAG=SHA + docker compose up -d<br/>────────────<br/>Définition : variable d’environnement + démarrage des conteneurs<br/>Rôle : tirer api:SHA et client:SHA ; lancer Mongo + API + front<br/>Problème résolu : mise en ligne de la version exacte buildée au job 2"]
    L["seed-app-users.sh (optionnel)<br/>────────────<br/>Définition : script après montée des conteneurs<br/>Rôle : créer comptes démo / admin si prévu<br/>Problème résolu : environnement test utilisable sans étape manuelle"]
    G --> H --> I --> J --> K --> L
  end

  subgraph RUN["Résultat sur le VPS"]
    M["Conteneurs : MongoDB, API, client<br/>────────────<br/>Rôle : base de données + backend + site statique<br/>Problème résolu : application accessible en interne sur le réseau Docker"]
    N["Traefik (déjà installé)<br/>────────────<br/>Définition : proxy déjà en place (souvent via Ansible)<br/>Rôle : HTTPS, nom de domaine → bon service<br/>Problème résolu : exposition sécurisée vers Internet"]
    O["Utilisateurs → https://vdev…<br/>────────────<br/>Rôle : accès au site et à l’API /api<br/>Problème résolu : livraison de la nouvelle version après push"]
    M --> N --> O
  end

  PUSH --> J1 --> J2 --> J3
  J3 --> RUN
```

---

## 3. Chaîne causale (résumé)

| Élément | En une phrase |
|--------|----------------|
| **SHA** | Étiquette unique du commit ; même valeur pour les tags d’images et pour `IMAGE_TAG`, pour déployer **la même** version partout. |
| **Harbor** | Registre qui **stocke** les images ; le VPS **pull** ce que la CI a **push**. |
| **Rsync** | Met le **code d’infra** (compose, scripts) sur le serveur **aligné** sur le dépôt, **sans** remplacer le `vdev.env` venant des secrets. |
| **vdev.env (secret)** | Donne les **variables secrètes** au conteneur API / compose ; sans ça, mauvaise config ou panne. |
| **Ansible** | Prépare la **machine** (Docker, Traefik, Harbor…) ; le **push** ne remplace pas cette étape. |

Tu peux coller les blocs `mermaid` sur [mermaid.live](https://mermaid.live) pour exporter en **SVG** ou **PNG** pour un rapport.
