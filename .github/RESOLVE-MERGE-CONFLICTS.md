# Résoudre les conflits de merge sur la PR preprod → prod

Si la PR "Promotion preprod → prod" affiche **"This branch has conflicts that must be resolved"** :

## Cause

Les branches `preprod` (ou la branche source) et `prod` ont divergé : les mêmes fichiers ont été modifiés différemment (p.ex. modification directe sur `prod`, ou `prod` pas mis à jour depuis longtemps).

## Résolution

### Méthode 1 : Sur GitHub

1. Ouvrir la PR **Promotion preprod → prod**.
2. Cliquer sur **"Resolve conflicts"**.
3. Pour chaque fichier en conflit :
   - Choisir les versions à garder (ou fusionner les deux).
   - Supprimer les marqueurs `<<<<<<<`, `=======`, `>>>>>>>`.
4. **"Mark as resolved"** pour chaque fichier, puis **"Commit merge"**.

### Méthode 2 : En local

Remplacez `SOURCE_BRANCH` par la branche source de la PR (`preprod` ou `gh-actions/preprod-to-prod` selon votre dépôt).

```bash
git fetch origin
git checkout SOURCE_BRANCH
git pull origin SOURCE_BRANCH
git merge origin/prod
# Résoudre les conflits dans les fichiers indiqués, puis :
git add .
git commit -m "chore: resolve merge conflicts with prod"
git push origin SOURCE_BRANCH
```

La PR sera à jour et mergeable si les conflits sont bien résolus.

## Éviter les conflits à l’avenir

- Ne pas merger directement sur `prod` sans passer par une PR depuis `preprod`.
- Merger régulièrement les PR preprod → prod pour que `prod` reste aligné avec `preprod`.
