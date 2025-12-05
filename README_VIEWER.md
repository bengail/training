SWAP Workouts Viewer

But : Fournir un visualiseur web statique pour parcourir les workouts à partir d'un fichier JSON exporté (ex: `events_bulk_all_templates.json`).

Fichiers créés :
- `index.html` : interface principale
- `styles.css` : styles
- `app.js` : logique JS pour charger et afficher le JSON
- `README_VIEWER.md` : ce fichier

Utilisation :
1) Placez-vous dans le dossier `swap` (contenant `index.html`).
2) Lancez un serveur statique local (nécessaire pour que `fetch('events_bulk_all_templates.json')` fonctionne) :

```bash
# Python 3 (recommandé)
python3 -m http.server 8000

# Ou (si vous avez node) :
# npx serve . -l 8000
```

3) Ouvrez votre navigateur à l'adresse : `http://localhost:8000/index.html`.
4) Utilisation sur GitHub Pages :
   - Le visualiseur charge automatiquement la bibliothèque `workout_library_enriched.json` embarquée dans le site.
   - Ouvre `index.html` sur GitHub Pages (ex: `https://<user>.github.io/<repo>/index.html`).
   - La page `plans.html` permet de consulter chaque plan (fichiers `.md`) et d'associer des workouts de la librairie via une interface simple ; vous pouvez télécharger le fichier `plans_meta.json` pour persister manuellement les associations (commit / push vers le repo si souhaité).
6) Nouveautés :
   - Filtrer par objectif : utilisez la liste déroulante pour limiter l'affichage aux workouts d'un objectif (VO2, Seuil, Endurance, etc.).
   - Export : lorsque vous sélectionnez un workout, utilisez les boutons "Exporter JSON (Intervals.icu)" ou "Exporter ZWO (Zwift XML)" pour télécharger le workout au format Intervals.icu JSON ou en ZWO XML prêt à être importé sur Intervals.icu/Zwift.

Export notes :
   - Le ZWO exporté est une conversion simple depuis la structure `icu_workout.steps` et cherche à mapper les types Warmup/Interval/Set/SteadyState/TextEvent vers des éléments ZWO (`SteadyState`, `IntervalsT`, `textevent`). Ce mapping est suffisant pour la plupart des usages partagés, mais n'est pas exhaustif pour toutes les variations possibles.
   - L'export JSON produit le champ `icu_workout` en JSON formaté, prêt à être ré-utilisé ou importé côté serveur avec l'API Intervals.icu.
7) Sélection en lot et export d'un groupe :
   - Vous pouvez maintenant cocher plusieurs workouts dans la liste (case à gauche de chaque ligne). Utilisez les boutons `Tout sélectionner` / `Tout désélectionner` pour gérer rapidement la sélection.
   - Cliquez `Exporter sélection (events/bulk ZWO)` pour télécharger un fichier `events_bulk_export.json` contenant un tableau d'objets au format attendu par l'endpoint `POST /api/v1/athlete/0/events/bulk?upsert=true` (champ `file_contents` contient le ZWO XML pour chaque workout sélectionné).
   - Remarque : le ZWO produit par la conversion est basique (voir note ci-dessus). Pour un usage en production, vérifiez les fichiers ZWO avant import si des steps complexes (distance avec pace mapping) sont utilisés.

Notes techniques :
- L'outil affiche les workouts contenus dans un tableau JSON (par ex. le fichier `events_bulk_all_templates.json` créé précédemment par le script). Il supporte aussi `workout_library_intervals.json` et `workout_library.json`.
- L'inférence du "But / Objectif" est heuristique (basée sur le nom du workout). Si vous souhaitez un mapping précis à partir d'un fichier de bibliothèque, je peux ajouter une option pour charger `workout_library_intervals.json` et utiliser ses descriptions.

Prochaine étape possible : intégrer un export ZWO direct depuis l'UI, ou ajouter l'édition simple (modifier les steps et ré-exporter en JSON).
