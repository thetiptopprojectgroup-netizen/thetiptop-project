# Diagramme de workflow DevOps — Thé Tip Top

> Document de synthèse visuelle, sur le modèle d’un schéma « infrastructure globale » (développeurs → Git → CI/CD → registre → environnements → observabilité → sauvegardes).  
> **Aligné sur ce dépôt** : monorepo **client React (Vite) + API Node (Express) + MongoDB**, déploiement sur **un VPS** via **Docker Compose** et **Traefik**, registre **Harbor**. Les trois environnements (**vdev**, **vpreprod**, **vprod**) sont des **stacks Compose distinctes** derrière Traefik — **pas de Kubernetes** dans l’implémentation actuelle (contrairement à certains schémas génériques préprod/prod « K8s »).

---

## 1. Vue macro (équivalent « blocs reliés »)

```mermaid
flowchart TB
  subgraph dev["Développement"]
    IDE["IDE / éditeur<br/>(ex. VS Code)"]
    CLI["Client Git"]
  end

  subgraph scm["Contrôle de version"]
    GH["GitHub<br/>HTTPS 443 · SSH 22"]
  end

  subgraph cicd["CI/CD — GitHub Actions"]
    CI["CI — Server + CI — Client<br/>lint · tests · build"]
    CD["CD — deploy-vdev / vpreprod / vprod<br/>gate CI · Harbor · build · rsync · compose"]
    PROMO["PR [Promotion]<br/>brouillon après CD OK"]
  end

  subgraph registry["Registre d’images"]
    HARBOR["Harbor<br/>projets vdev · vpreprod · vprod<br/>HTTPS 443"]
  end

  subgraph vps["VPS unique — orchestration applicative"]
    TRAEFIK["Traefik<br/>HTTPS 80 / 443 · certificats LE"]
    subgraph stacks["Stacks Docker Compose"]
      E1["Environnement vdev<br/>api + client + mongo + labels Traefik"]
      E2["Environnement vpreprod<br/>même principe"]
      E3["Environnement vprod<br/>même principe"]
    end
  end

  subgraph obs["Observabilité"]
    PROM["Prometheus"]
    GRAF["Grafana"]
    CADV["cAdvisor"]
    NODE["node-exporter"]
  end

  subgraph logs["Logs centralisés"]
    FB["Filebeat"]
    ES["Elasticsearch"]
    KIB["Kibana"]
  end

  subgraph backup["Sauvegardes & objet"]
    MINIO["MinIO — API S3<br/>buckets · repos Restic"]
    RESTIC["Restic + Ansible<br/>mongodump / backups"]
  end

  subgraph prov["Provisionnement serveur (optionnel / initial)"]
    ANS["Ansible<br/>Docker · UFW · Traefik · MinIO · Harbor · Restic"]
  end

  IDE --> CLI
  CLI --> GH
  GH --> CI
  CI --> CD
  CD --> PROMO
  CD --> HARBOR
  HARBOR --> CD
  CD --> TRAEFIK
  TRAEFIK --> E1
  TRAEFIK --> E2
  TRAEFIK --> E3
  E1 -.-> PROM
  E2 -.-> PROM
  E3 -.-> PROM
  E1 -.-> FB
  E2 -.-> FB
  E3 -.-> FB
  PROM --> GRAF
  FB --> ES --> KIB
  RESTIC --> MINIO
  ANS -.-> TRAEFIK
  ANS -.-> MINIO
  ANS -.-> HARBOR
```

**Lecture rapide** : les développeurs poussent sur **GitHub** ; **GitHub Actions** exécute la **CI**, puis le **CD** construit et pousse les images vers **Harbor**, synchronise le dépôt sur le **VPS** et lance **docker compose**. **Traefik** route le trafic HTTPS vers les bons conteneurs par environnement. **Prometheus / Grafana** et la stack **ELK** complètent l’exploitation ; **Restic** envoie les sauvegardes vers des buckets **MinIO**.

---

## 2. Flux Git & branches (workflow promotion)

```mermaid
flowchart LR
  subgraph branches["Branches"]
    VDEV["vdev"]
    VPRE["vpreprod"]
    VPROD["vprod"]
  end

  VDEV -->|"push → CI + CD"| VDEV
  VDEV -->|"PR [Promotion] → merge"| VPRE
  VPRE -->|"push → CI + CD"| VPRE
  VPRE -->|"PR [Promotion] → merge"| VPROD
  VPROD -->|"push → CI + CD"| VPROD
```

- Chaque **push** sur une branche d’environnement déclenche **CI** puis **CD** correspondant.  
- Après un **CD réussi** sur `vdev` ou `vpreprod`, une **PR de promotion** (souvent en brouillon) peut être créée automatiquement pour proposer le merge vers l’étape suivante.  
- Détail : `.github/ARCHITECTURE_CI_CD.md`, `docs/RAPPORT_INFRA_ET_PROJET.md`.

---

## 3. Séquence simplifiée « un déploiement »

```mermaid
sequenceDiagram
  participant Dev as Développeur
  participant GH as GitHub
  participant GHA as GitHub Actions
  participant Har as Harbor
  participant VPS as VPS + Docker

  Dev->>GH: push vdev / vpreprod / vprod
  GH->>GHA: déclenche CI
  GHA->>GHA: lint, tests, build
  GHA->>Har: build & push images api / client
  GHA->>GHA: déclenche CD
  GHA->>VPS: rsync + docker compose up
  VPS->>VPS: Traefik → stack Mongo + API + front
```

---

## 4. Correspondance avec un schéma « Kubernetes préprod / prod »

| Élément souvent vu sur des schémas génériques | Dans **ce** projet |
|-----------------------------------------------|---------------------|
| Orchestrateur **Kubernetes** préprod / prod | **Docker Compose** sur un **seul VPS** ; isolation par **projet Harbor** et **stack Compose** + préfixes / labels Traefik |
| **Docker Hub** | **Harbor** (registry privée) |
| Ingress | **Traefik** (fichiers dynamiques + labels Compose) |
| Namespaces | **Réseaux / stacks** Compose distinctes par environnement |

---

## 5. Ports et accès (rappel)

| Zone | Protocole / ports typiques |
|------|----------------------------|
| GitHub | **443** (HTTPS), **22** (SSH) |
| Harbor / UI | **443** (HTTPS), selon `HARBOR_REGISTRY_BASE` |
| Applications vdev / vpreprod / vprod | **443** (HTTPS) via Traefik |
| Grafana / Prometheus / Kibana | Routage **Traefik** vers les stacks monitoring / logging (voir `infra/vps/traefik/dynamic/`) |
| MinIO | API S3 + console — routage dédié Traefik |

---

## 6. Fichiers utiles pour détailler le schéma

| Sujet | Emplacement |
|-------|-------------|
| Rapport infra & projet | `docs/RAPPORT_INFRA_ET_PROJET.md` |
| CI/CD | `.github/ARCHITECTURE_CI_CD.md`, `.github/workflows/` |
| Stack déployée | `infra/deploy/docker-compose.stack.yml`, `infra/deploy/env/*.env.example` |
| Traefik | `infra/vps/traefik/dynamic/` |
| Ansible | `infra/ansible/` |

---

*Document généré pour soutenance / documentation d’équipe — à mettre à jour si l’architecture évolue.*
