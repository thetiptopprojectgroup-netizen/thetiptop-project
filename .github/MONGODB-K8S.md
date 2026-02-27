# MongoDB en Kubernetes (preprod / prod)

## Connexion backend → MongoDB

Pour que le backend se connecte à MongoDB dans les namespaces preprod/prod, les secrets GitHub doivent être définis :

- `MONGODB_URI_DEV`
- `MONGODB_URI_PREPROD`
- `MONGODB_URI_PROD`

## Format de l’URI

Le service MongoDB est exposé dans le namespace sous le nom DNS :

`mongodb.<namespace>.svc.cluster.local:27017`

Exemples :

- **dev** : `mongodb://root:VOTRE_ROOT_PASSWORD@mongodb.thetiptop-dev.svc.cluster.local:27017/thetiptop?authSource=admin`
- **preprod** : `mongodb://root:VOTRE_ROOT_PASSWORD@mongodb.thetiptop-preprod.svc.cluster.local:27017/thetiptop?authSource=admin`
- **prod** : `mongodb://root:VOTRE_ROOT_PASSWORD@mongodb.thetiptop-prod.svc.cluster.local:27017/thetiptop?authSource=admin`

Les identifiants **root** sont ceux du secret Kubernetes `mongodb-secret` (créé par le workflow CD à partir de `MONGO_ROOT_USERNAME` et `MONGO_ROOT_PASSWORD`).

## Utilisateur applicatif

Le `mongo-init.js` utilisé en Docker Compose n’est pas exécuté par le StatefulSet Kubernetes. Deux options :

1. **Utiliser le compte root** (recommandé pour simplifier) : `authSource=admin` dans l’URI ci-dessus.
2. **Créer l’utilisateur `thetiptop`** : ajouter un Job Kubernetes qui s’exécute après le StatefulSet et exécute un script équivalent à `mongo-init.js` (création de l’utilisateur + index).

## Comptes admin par environnement

Le job de seed (`npm run seed:all`) crée un admin par environnement avec des identifiants distincts :

| Environnement | Email admin              | Mot de passe |
|---------------|--------------------------|--------------|
| **dev**       | `admin@thetiptop.fr`     | Admin123!    |
| **preprod**   | `preprodadmin@thetiptop.fr` | Admin123! |
| **prod**      | `prodadmin@thetiptop.fr`   | Admin123! |

L’employé de test reste `employe@thetiptop.fr` / `Employe123!` dans tous les environnements.

## Vérification

Après déploiement :

```bash
kubectl get pods -n thetiptop-preprod
kubectl logs deployment/backend -n thetiptop-preprod | grep -i mongo
```

Si le backend affiche `MongoDB connecté`, la connexion est correcte.
