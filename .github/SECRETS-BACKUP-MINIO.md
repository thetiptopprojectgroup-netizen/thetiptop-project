# Obtenir les 5 secrets pour le backup MongoDB (Restic + MinIO)

Ce guide explique **étape par étape** comment obtenir ou choisir chaque valeur, puis comment les ajouter dans GitHub.

---

## Vue d’ensemble des 5 secrets

| Secret GitHub | Rôle | Comment obtenir la valeur |
|---------------|------|---------------------------|
| `RESTIC_MINIO_ENDPOINT` | URL de MinIO (API S3) | Valeur fixe si MinIO est dans le cluster (voir étape 1) |
| `RESTIC_MINIO_BUCKET` | Nom du bucket où Restic stocke les backups | Vous choisissez un nom (étape 2) |
| `RESTIC_PASSWORD` | Mot de passe qui chiffre le dépôt Restic | Vous choisissez un mot de passe fort (étape 3) |
| `RESTIC_S3_ACCESS_KEY_ID` | Identifiant MinIO (utilisateur admin) | Vous choisissez un identifiant (étape 4) |
| `RESTIC_S3_SECRET_ACCESS_KEY` | Mot de passe MinIO (admin) | Vous choisissez un mot de passe fort (étape 5) |

---

## Étape 1 : `RESTIC_MINIO_ENDPOINT`

**Valeur à utiliser** (MinIO déployé dans le cluster par le CD) :

```
http://minio.minio.svc.cluster.local:9000
```

- Pas d’espace avant/après.
- Si plus tard vous utilisez un MinIO **externe** (autre serveur), mettez ici son URL (ex. `http://minio.monserveur.com:9000` ou `https://...`).

---

## Étape 2 : `RESTIC_MINIO_BUCKET`

**Valeur** : un nom de bucket que vous choisissez.

Exemples :

- `backups`
- `thetiptop-backups`

Restic créera ce bucket à la première sauvegarde si MinIO le permet, ou vous pourrez le créer via la console MinIO après le premier déploiement.

**À mettre dans le secret** : uniquement le nom, sans `s3://` ni slash (ex. `backups`).

---

## Étape 3 : `RESTIC_PASSWORD`

**Valeur** : un mot de passe que **vous inventez** pour protéger le dépôt Restic (chiffrement des sauvegardes).

- Utilisez un mot de passe fort (longueur, lettres, chiffres, symboles).
- **À noter quelque part en sécurité** : sans ce mot de passe, les backups ne pourront pas être restaurés.

Exemple (à remplacer par le vôtre) : `MonMotDePasseRestic2024!`.

---

## Étape 4 : `RESTIC_S3_ACCESS_KEY_ID`

**Valeur** : identifiant (login) de l’utilisateur MinIO.

Comme MinIO est déployé par le CD avec **ce secret comme identifiant admin**, vous **choisissez** cet identifiant.

Exemples :

- `minioadmin` (valeur par défaut MinIO)
- `thetiptop-backup`
- tout autre identifiant sans espace

---

## Étape 5 : `RESTIC_S3_SECRET_ACCESS_KEY`

**Valeur** : mot de passe de l’utilisateur MinIO (celui défini à l’étape 4).

- Vous **choisissez** un mot de passe fort pour MinIO.
- C’est aussi le mot de passe utilisé pour vous connecter à la **console MinIO** (via les URLs minio.dev / minio.preprod / minio.thetiptop-jeu.fr).

---

## Étape 6 : Ajouter les 5 secrets dans GitHub

1. Ouvrez votre dépôt GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Cliquez sur **New repository secret**.
3. Créez **5 secrets** un par un :

| Name | Value (exemple) |
|------|------------------|
| `RESTIC_MINIO_ENDPOINT` | `http://minio.minio.svc.cluster.local:9000` |
| `RESTIC_MINIO_BUCKET` | `backups` |
| `RESTIC_PASSWORD` | (votre mot de passe Restic) |
| `RESTIC_S3_ACCESS_KEY_ID` | `minioadmin` (ou votre identifiant) |
| `RESTIC_S3_SECRET_ACCESS_KEY` | (votre mot de passe MinIO) |

4. Enregistrez chaque secret (vous ne pourrez plus revoir la valeur après).

---

## Récapitulatif à remplir (pour vous)

Vous pouvez noter ici vos choix (sans mettre les vrais mots de passe dans le dépôt) :

- **RESTIC_MINIO_ENDPOINT** : `http://minio.minio.svc.cluster.local:9000`
- **RESTIC_MINIO_BUCKET** : ……………………
- **RESTIC_PASSWORD** : (noté en lieu sûr)
- **RESTIC_S3_ACCESS_KEY_ID** : ……………………
- **RESTIC_S3_SECRET_ACCESS_KEY** : (noté en lieu sûr)

Une fois les 5 secrets créés dans GitHub, le prochain **push** sur `dev`, `preprod` ou `prod` déploiera MinIO et configurera les backups automatiquement.
