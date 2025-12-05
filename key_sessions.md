# Séances clés — bibliothèque SWAP

Ce document présente une sélection de séances clefs extraites de la bibliothèque SWAP, leur objectif, comment les exécuter, conseils pratiques, et exemples Intervals.icu (ZWO / payload). Les fichiers ZWO et le payload d'exemple sont placés dans le même dossier.

---

## 1) VO2max court — 6 x 1 min
- But : améliorer VO2max, tolérance à l'intensité élevée, conduction neuromusculaire de vitesse.
- Quand : en phase de développement vitesse/VO2, 1 séance/semaine maxi.
- Structure :
  - Échauffement : 10–15 min facile + 4–6 accélérations courtes
  - Travail : 6 x 1 min @ VO2 (≈ 3k–5k effort) avec 1 min jog récup
  - Retour au calme : 10 min facile
- Conseils : intensité contrôlée (forte mais répétable), technique, respiration, qualité > quantité.
- Exemple Intervals.icu : `6x1min_VO2.zwo` (fraction d'FTP OnPower="1.05" dans le ZWO). Voir aussi `intervals_examples_payload.json` (événement programmé).

---

## 2) Seuil long — 6 x 5 min
- But : améliorer capacité au seuil (effort ≈ effort 1h), lactate shuttling, endurance de vitesse.
- Quand : en bloc de développement aérobie/threshold, 1 séance tous les 7–10 jours.
- Structure :
  - Échauffement : 15 min facile
  - Travail : 6 x 5 min @ Seuil (~95% d'un effort 1h) avec 2 min récup active
  - Retour au calme : 10–15 min facile
- Conseils : tenir des allures régulières, surveiller la consommation de glycogène sur les répétitions longues.
- Exemple Intervals.icu : `6x5min_Threshold.zwo`.

---

## 3) Sortie longue avec blocs tempo
- But : transposer l'effort marathon/1h en contexte de fatigue; travailler ravitaillement et mental.
- Quand : weekly long run (semaine clé), 1 sortie longue par semaine.
- Structure :
  - Échauffement : 30 min facile
  - Bloc tempo : 20–40 min à effort marathon/1h
  - Récup : 10–20 min facile
  - (Option) Second bloc tempo
  - Cooldown : 20–30 min facile
- Conseils : tester la stratégie de carburant; maintenir cadence; ne pas faire chaque sortie longue en mode tempo (sélectionner 1–2 par cycle).
- Exemple Intervals.icu : `LongRun_with_tempo.zwo`.

---

## 4) Montées courtes (Power hills) — 6 x 20–30 s
- But : développer puissance mécanique, recrutement de fibres, accélération.
- Structure : échauffement 15–20 min, 6–12 x 20–45 s côte (pente 4–10%) avec jog retour, cooldown.
- Conseils : focaliser sur posture, poussée de hanches, éviter sprint complet.
- Mapping : template `hill_short` dans `workout_library.json`.

---

## 5) Intervalles VO2 en sets (ex. 3 x (4 x 1 min/1 min))
- But : accumuler stimulus VO2 en séries pour travailler tolérance et répétition de qualité.
- Structure : échauffement 15–25 min ; sets : p.ex. 3 sets de 4 x 1 min/1 min avec 2–3 min entre sets ; cooldown 10–15 min.
- Conseils : maintenir intensité uniforme dans chaque répétition, récupérer activement.
- Mapping : `vo2_short` template.

---

## 6) Seuil continu / ladder (10/8/6/4/2)
- But : construire capacité au seuil avec intensités variées et récupération courte.
- Structure : échauffement, ladder 10/8/6/4/2 min @ seuil avec 2 min récup entre, cooldown.
- Conseils : commencer à l'effort cible et tenir la progressivité.

---

## Fichiers fournis
- `6x1min_VO2.zwo` — ZWO exemple
- `6x5min_Threshold.zwo` — ZWO exemple
- `LongRun_with_tempo.zwo` — ZWO exemple
- `intervals_examples_payload.json` — payload JSON (array) prêt à poster sur `POST /api/v1/athlete/0/events/bulk?upsert=true` pour créer ces entraînements sur le calendrier (voir instructions ci-dessous)

---

## Instructions d'import vers Intervals.icu (bibliothèque / calendrier)
1) Obtenir un token :
   - Si vous faites pour votre compte personnel : récupérez votre API key depuis `Settings` (personal API key) et utilisez Basic auth (`-u API_KEY:`) pour les tests.
   - Pour une application/coaching : implémentez OAuth et demandez le scope `CALENDAR:WRITE`.

2) Importer les ZWO dans la bibliothèque/calendrier :
   - Endpoint recommandé pour créer des événements planifiés :
     POST https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true
   - Corps : envoyer le contenu de `intervals_examples_payload.json` (array d'objets). Le champ `file_contents` contient le ZWO textuel (accepted as-is). Exemple cURL :

```bash
curl -X POST 'https://intervals.icu/api/v1/athlete/0/events/bulk?upsert=true' \
  -H 'Authorization: Basic YOUR_API_KEY:' \
  -H 'Content-Type: application/json' \
  -d @intervals_examples_payload.json
```

3) Vérifier l'import :
   - L'endpoint retourne la représentation complète des événements créés (id, uid, calendar_id, etc.).
   - Vous pouvez lister les événements d'une plage de dates via `GET /api/v1/athlete/0/events?oldest=YYYY-MM-DD&newest=YYYY-MM-DD`.

4) Option Library (workout builder) :
   - Si vous préférez stocker les workouts dans la bibliothèque (plutôt que calendrier), Intervals.icu accepte aussi l'upload via `file_contents_base64` (FIT) ou `description` en texte natif. Le plus simple pour le partage est d'uploader ZWO en `file_contents` sur un événement, puis depuis l'UI déplacer vers la bibliothèque.

---

Si vous voulez que je :
- génère automatiquement un fichier d'`events/bulk` complet couvrant tous les templates paramétrables (export complet), je peux le faire ;
- ou génère des FIT plutôt que ZWO (utile si vous voulez la synchro automatique vers Garmin), je peux convertir les ZWO en FIT (nécessite un peu plus de travail et outils) ;
- ou que j'exécute l'upload de test si vous me fournissez une clé API (préférable via vous pour sécurité), je peux fournir la commande cURL prête à lancer.

---

Résumé : Le document `key_sessions.md` et les ZWO + payload d'exemple ont été ajoutés dans le dossier. Dites-moi si je dois :
- produire l'export complet pour toutes les templates de `workout_library.json` (option recommandée),
- convertir en FIT pour meilleure compatibilité Garmin, ou
- préparer les fichiers en tant que `icu_workout` JSON (structure `steps`) pour un upload direct via API. 

