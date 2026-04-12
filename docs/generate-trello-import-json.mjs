/**
 * Génère docs/trello-import-soutenance.json au format attendu par
 * « Import to Board (JSON) for Trello » (schéma imbriqué : lists[].cards[]).
 * Usage: node docs/generate-trello-import-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const L = {
  Urgent: "Urgent",
  Important: "Important",
  Technique: "Technique",
  Bug: "Bug",
  DevOps: "DevOps",
  Feature: "Feature",
};

const board = {
  name: "🚀 Projet Thé Tip Top – DevOps & Jeu-Concours",
  desc:
    "Gestion complète : Cahier des charges + Spécifications techniques + Workflow CI/CD. " +
    "Les livrables effectifs sont regroupés dans « ✅ Terminé ».",
  labels: [
    { name: "Urgent", color: "red" },
    { name: "Important", color: "yellow" },
    { name: "Technique", color: "blue" },
    { name: "Bug", color: "purple" },
    { name: "DevOps", color: "black" },
    { name: "Feature", color: "green" },
  ],
  lists: [
    {
      name: "📘 Cahier des charges – Fonctionnel",
      cards: [
        {
          name: "Présentation du projet",
          desc: "Jeu-concours digital Thé Tip Top (site web + API REST).",
        },
        {
          name: "Objectifs métier",
          desc: "Acquisition client, fidélisation et engagement autour de la marque.",
        },
        {
          name: "Fonctionnalités principales",
          checklists: [
            {
              name: "Fonctionnalités",
              items: [
                "Inscription utilisateur",
                "Connexion Google / Facebook",
                "Saisie et validation du code ticket",
                "Attribution du gain et feedback utilisateur",
                "Historique des gains (parcours participant)",
                "Dashboard administrateur",
                "Espace employé / boutique (selon périmètre)",
              ],
            },
          ],
        },
        {
          name: "Contraintes",
          desc: "RGPD, responsive, accessibilité, budget et planning de réalisation conformes au cahier des charges formation.",
        },
        {
          name: "Livrables attendus",
          checklists: [
            {
              name: "Livrables",
              items: [
                "API backend (Node.js / Express)",
                "WebApp frontend (React)",
                "Logique de tickets et de lots",
                "Stratégie de déploiement et pipeline CI/CD",
                "Identité visuelle et contenus (lots, pages légales)",
              ],
            },
          ],
        },
      ],
    },

    {
      name: "⚙️ Cahier des spécifications techniques",
      cards: [
        {
          name: "Architecture globale",
          desc: "Frontend React (Vite) + Backend Node.js + API REST + MongoDB.",
        },
        {
          name: "Base de données",
          desc: "Modèles utilisateurs, tickets, gains, sessions de jeu (Mongoose).",
        },
        {
          name: "Génération des codes",
          desc: "Logique métier de codes uniques et probabilités / lots (selon règles du jeu).",
        },
        {
          name: "Authentification",
          desc: "OAuth (Google, Facebook) + sessions JWT.",
        },
        {
          name: "Dockerisation",
          labels: [L.DevOps],
          desc: "Images applicatives, stacks par environnement.",
        },
        {
          name: "Orchestration & hébergement",
          labels: [L.DevOps],
          desc: "Déploiement conteneurisé (Docker Compose sur VPS, reverse proxy Traefik). Référence cible : scalabilité type orchestrateur (ex. Kubernetes) selon cahier.",
        },
        {
          name: "Reverse proxy Traefik",
          labels: [L.DevOps],
          desc: "Routage HTTPS, réseau docker, certificats Let's Encrypt.",
        },
        {
          name: "Monitoring",
          checklists: [
            {
              name: "Outils",
              items: ["Prometheus", "Grafana", "Stack logs (Elasticsearch, Kibana, Filebeat)"],
            },
          ],
        },
        {
          name: "Gestion des secrets",
          labels: [L.Technique, L.DevOps],
          desc: "Secrets CI/CD (GitHub Actions), variables d'environnement sur le VPS, non versionnées.",
        },
        {
          name: "Stockage & sauvegardes",
          labels: [L.DevOps],
          desc: "MinIO (fichiers) selon infra ; stratégie de backup à préciser (ex. Restic).",
        },
      ],
    },

    {
      name: "🔄 Workflow – Backlog",
      cards: [
        { name: "[Feature] Alerting Prometheus / Alertmanager", labels: [L.DevOps, L.Important] },
        { name: "[Technique] Métriques applicatives fines (routes API, erreurs 5xx)", labels: [L.Technique, L.DevOps] },
        { name: "[Feature] Renommer le GIF hero (URL sans espaces)", labels: [L.Feature] },
        { name: "[Important] Aligner la doc README sur l’archi réelle (Traefik vs Nginx)", labels: [L.Important, L.Technique] },
      ],
    },

    { name: "📌 Sprint – À faire", cards: [] },
    { name: "🚧 En cours", cards: [] },
    { name: "🧪 Test / Validation", cards: [] },

    {
      name: "🚀 Déploiement",
      cards: [
        {
          name: "Pipeline CI/CD (référence)",
          desc: "Modèle cible d’une chaîne de livraison. Mise en œuvre effective : GitHub Actions + registry Harbor + déploiement sur VPS.",
          checklists: [
            {
              name: "Étapes types",
              items: [
                "Build",
                "Tests",
                "Analyse / scan sécurité",
                "Build images Docker",
                "Push vers le registry",
                "Déploiement (compose sur VPS)",
              ],
            },
          ],
        },
      ],
    },

    {
      name: "📊 Monitoring & Sécurité",
      cards: [],
    },

    { name: "🧱 Bloqué", cards: [] },

    {
      name: "✅ Terminé",
      cards: [
        {
          name: "WebApp React 18 (Vite, Tailwind, React Router)",
          desc: "Pages publiques (accueil, lots, règlement, FAQ, légal), composants réutilisables, animations.",
          labels: [L.Feature, L.Technique],
        },
        {
          name: "SEO & sitemap",
          desc: "Métadonnées, script de génération SEO / sitemap.",
          labels: [L.Technique],
        },
        {
          name: "Authentification JWT + OAuth (Google, Facebook)",
          desc: "Passport, flux inscription / connexion, variables CLIENT_URL / BACKEND_URL.",
          labels: [L.Feature, L.Technique],
        },
        {
          name: "Jeu : validation des codes ticket & attribution des lots",
          desc: "API tickets, règles métier Mongoose, parcours participant.",
          labels: [L.Feature, L.Technique],
        },
        {
          name: "Espaces Employé & Admin",
          desc: "Dashboards, statistiques, tirages / exports selon rôles.",
          labels: [L.Feature, L.Technique],
        },
        {
          name: "API Express : sécurité & observabilité",
          desc: "Helmet, CORS, rate limiting ; métriques Prometheus (prom-client).",
          labels: [L.Technique, L.DevOps],
        },
        {
          name: "Tests automatisés (serveur)",
          desc: "Jest sur la partie API.",
          labels: [L.Technique],
        },
        {
          name: "Stacks Docker : vdev, vpreprod, vprod",
          desc: "MongoDB, API, client ; images via Harbor ; réseau Traefik.",
          labels: [L.DevOps, L.Important],
        },
        {
          name: "CI/CD GitHub Actions",
          desc: "Build, push Harbor, rsync sur le VPS, docker compose up ; garde-fous CI.",
          labels: [L.DevOps, L.Important],
        },
        {
          name: "Traefik : routage HTTPS & fichiers dynamiques",
          desc: "Labels services, dynamic/*.yml (ex. MinIO, monitoring), certresolver Let's Encrypt.",
          labels: [L.DevOps],
        },
        {
          name: "Secrets monitoring & logging (automation GitHub)",
          desc: "Scripts d’écriture des .env distants ; exclusions rsync pour secrets.",
          labels: [L.DevOps, L.Technique],
        },
        {
          name: "Monitoring : Prometheus + Grafana + node-exporter + cAdvisor",
          desc: "infra/monitoring, datasource Grafana, scripts d’application post-déploiement.",
          labels: [L.DevOps],
        },
        {
          name: "Logs : Elasticsearch + Kibana + Filebeat",
          desc: "infra/logging, indexation des logs conteneurs, exposition Kibana via Traefik.",
          labels: [L.DevOps],
        },
        {
          name: "DNS & accès aux outils (Grafana, Prometheus, Kibana)",
          desc: "Alignement hôtes / .env avec Traefik.",
          labels: [L.DevOps],
        },
        {
          name: "Lots & médias (PRIZES, images, pages Accueil / Lots)",
          desc: "Données centralisées, ordre d’affichage, visuels public/images/prizes.",
          labels: [L.Feature, L.Important],
        },
        {
          name: "Footer & liens réseaux officiels",
          desc: "Facebook, Instagram, X (Thé Tip Top).",
          labels: [L.Feature],
        },
        {
          name: "Charte UI : typo Poppins, fond ambiance jeu-concours",
          desc: "Layout, hero, CTA, cohérence visuelle.",
          labels: [L.Feature, L.Important],
        },
        {
          name: "Palette couleurs Tailwind (tea, matcha, gold, cream)",
          desc: "Documentation des tokens / hex pour la charte.",
          labels: [L.Feature],
        },
      ],
    },
  ],
};

const outPath = path.join(__dirname, "trello-import-soutenance.json");
fs.writeFileSync(outPath, JSON.stringify(board, null, 2), "utf8");
console.log("Written:", outPath);
