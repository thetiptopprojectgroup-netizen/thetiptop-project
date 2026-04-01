# Migration VPS + Harbor + MinIO + Restic - Checklist

Projet: `thetiptop-project`  
Objectif: déployer `vdev`, `vpreprod`, `vprod` sur un VPS unique avec isolation logique, registry privé et backups.

> Note: le fichier est conçu pour être coché au fur et à mesure.

## 0) Audit initial du projet

- [x] Extraire et analyser le plan fourni (`.docx`)
- [x] Vérifier l'existant Docker/Compose
- [x] Vérifier l'existant CI/CD GitHub Actions
- [x] Produire un écart "plan cible vs état actuel"

### Écart identifié (plan cible vs état actuel)

- **Présent:** stack Docker locale (`api`, `client`, `mongodb`, `nginx`) avec 1 environnement principal.
- **Manquant:** séparation nette `vdev` / `vpreprod` / `vprod` (compose/env/networks/DB/volumes par environnement).
- **Manquant:** workflow GitHub Actions complet (test -> build -> push_harbor -> backup -> deploy).
- **Manquant:** intégration Harbor, MinIO et Restic dans le dépôt (scripts/pipeline).
- **Manquant:** reverse proxy Traefik avec TLS automatique et routage multi-domaines.
- **Manquant:** procédure formalisée de déploiement VPS et de rollback/restauration.

## 1) Préparation VPS (actions manuelles)

- [ ] **MANUEL** Louer/valider le VPS (`212.227.82.68`) avec accès root
- [ ] **MANUEL** Configurer DNS:
  - [ ] `vdev.dsp5-archi-o22a-15m-g3.fr`
  - [ ] `vpreprod.dsp5-archi-o22a-15m-g3.fr`
  - [ ] `dsp5-archi-o22a-15m-g3.fr`
- [ ] **MANUEL** Installer Docker + Docker Compose plugin sur le VPS
- [ ] **MANUEL** Créer arborescence `/srv/vdev`, `/srv/vpreprod`, `/srv/vprod`
- [ ] **MANUEL** Durcir SSH (clé uniquement, désactiver mot de passe)
- [ ] **MANUEL** Activer firewall (ouvrir 22, 80, 443 uniquement)

## 2) Reverse proxy + TLS

- [ ] Ajouter configuration Traefik (recommandé) pour HTTPS auto
- [ ] Définir routage par domaine et environnement
- [ ] Vérifier certificats TLS (Let's Encrypt)

## 3) Harbor (registry privé)

- [ ] **MANUEL** Installer Harbor sur VPS
- [ ] **MANUEL** Créer projets Harbor:
  - [ ] `tiptop-vdev`
  - [ ] `tiptop-vpreprod`
  - [ ] `tiptop-vprod`
- [ ] **MANUEL** Créer robot account/token par projet
- [ ] **MANUEL** Activer le scan de vulnérabilités
- [ ] Ajouter variables GitHub Secrets pour login Harbor

## 4) MinIO + Restic (backups)

- [ ] **MANUEL** Déployer MinIO sur VPS
- [ ] **MANUEL** Créer buckets:
  - [ ] `vdev`
  - [ ] `vpreprod`
  - [ ] `vprod`
- [x] Ajouter script backup MongoDB + upload Restic
- [ ] Ajouter backup pré-déploiement
- [ ] Ajouter backup quotidien via cron
- [ ] Tester restauration Restic

## 5) Données MongoDB par environnement

- [ ] Définir 3 bases dédiées:
  - [ ] `db_vdev`
  - [ ] `db_vpreprod`
  - [ ] `db_vprod`
- [ ] Isoler volumes persistants par environnement
- [ ] Vérifier chaînes de connexion et users DB

## 6) Déploiement applicatif multi-environnements

- [x] Créer configuration compose par environnement
- [ ] Isoler networks Docker par environnement
- [x] Isoler variables `.env` par environnement
- [ ] Vérifier montée des services:
  - [ ] API
  - [ ] Client
  - [ ] MongoDB
- [ ] Vérifier accessibilité par domaines

## 7) CI/CD GitHub Actions

- [x] Créer workflow branches `vdev`, `vpreprod`, `vprod`
- [x] Ajouter job `test` (lint + tests)
- [x] Ajouter job `build` (needs: test)
- [x] Ajouter job `push_harbor` (needs: build)
- [x] Ajouter job `backup` (needs: push_harbor)
- [x] Ajouter job `deploy` (needs: backup)
- [ ] Ajouter secrets GitHub (SSH, Harbor, URLs, Restic, MinIO)

## 8) Sécurité et validation finale

- [ ] Vérifier secrets et rotation minimale
- [ ] Vérifier scan Harbor sans vulnérabilité critique
- [ ] Vérifier rollback (restauration backup)
- [ ] Vérifier logs et supervision de base
- [ ] Go-live contrôlé sur `vprod`

---

## Journal d'avancement

- 2026-04-01: checklist créée, audit initial terminé, écart identifié.
- 2026-04-01: workflow CI/CD ajouté + templates/scrips de déploiement VPS ajoutés.

