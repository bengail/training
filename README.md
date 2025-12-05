# Projet SWAP — dépôt local

Ceci initialise un dépôt git local pour le projet de plans d'entraînement situé dans le dossier `swap/`.

Objectifs accomplis localement:
- Initialisation du dépôt git local
- Ajout d'un `.gitignore`

Prochaines étapes pour pousser vers GitHub et publier sur GitHub Pages

1) Créer un dépôt distant sur GitHub (par ex. `USER/REPO`).

2) Ajouter le remote et pousser la branche `main`:

```
cd swap
git remote add origin https://github.com/USER/REPO.git
git branch -M main
git push -u origin main
```

3) Options pour GitHub Pages:
- Publier depuis la branche `main` (root) : activer dans Settings → Pages → Source: `main` / `/`.
- Publier depuis `gh-pages` (séparé) :

```
git checkout --orphan gh-pages
git --work-tree . add --all
git --work-tree . commit -m "Deploy to GitHub Pages"
git push -f origin gh-pages
```

4) Utiliser l'outil `gh` (GitHub CLI) pour créer et pousser le repo sans quitter le terminal (si `gh` installé):

```
gh repo create USER/REPO --public --source=. --remote=origin --push
gh pages create --branch=main --source=/
```

Sécurité / accès :
- Je peux vous guider pour pousser depuis votre machine. Si vous voulez que j'effectue le push pour vous, fournissez l'URL du remote public et un accès approprié (par ex. un dépôt vide que je peux pousser). Évitez de partager des tokens en clair ici — préférez créer le repo et me donner simplement l'URL, ou exécuter vous-même le push suivant mes instructions.

Si vous voulez que je configure la publication automatique (flux CI), dites-moi si vous préférez `gh-pages` ou `main`/`docs/` et je préparerai un workflow GitHub Actions.
