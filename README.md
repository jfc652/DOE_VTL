# Générateur de DOE VTL (dossier de verticalité)

Application web 100 % statique (HTML / CSS / JavaScript, sans dépendance ni serveur) qui reproduit le format du dossier **DOE VTL – BTS** :

- en-tête avec logo à gauche, code du site et « DOE VTL … BTS » au centre, logo à droite ;
- pied de page avec version, code projet, auteur, date et `Page X/N` ;
- page de couverture (photo de situation + adresse), vue d'ensemble du site, caractéristiques de la liaison, plan de masse ;
- pages de reportage photos, en nombre illimité (6 par page par défaut), numérotées « **Photo N :** » sous chaque cadre.

## Utilisation

1. Ouvrir `index.html` dans un navigateur, ou publier le dépôt avec GitHub Pages.
2. Remplir le formulaire à gauche : tous les champs du dossier sont modifiables.
3. Cliquer sur **Imprimer / PDF**, puis « Enregistrer au format PDF » (A4, marges : aucune, graphiques d'arrière-plan activés).

## Importer et classer les photos

Section **Photos → Importer et classer les photos** :

- **Importer un dossier…** : sélectionne tout un dossier. Les photos sont classées automatiquement par numéro avant le montage :
  - fichiers nommés `Photo 1.jpg`, `Photo 2 - Vue de la chambre.jpg`, `photo_03_etiquette.jpg`, `3 - cab one.jpg`… ;
  - ou sous-dossiers `Photo 1/`, `Photo 2/`… contenant la photo.
  - Ce qui suit le numéro dans le nom du fichier devient la **légende** (option désactivable). Les photos sans numéro (`IMG_1234.jpg`) viennent après, dans l'ordre des noms.
- **Importer des fichiers…** : même classement pour une sélection de fichiers.
- Choix **Ajouter à la suite** ou **Remplacer les photos existantes**.
- **Trier par n° / nom de fichier** : reclasse les photos déjà chargées.
- Classement manuel : glisser la poignée ⠿, boutons ↑ ↓, ou saisie directe de la position.

Les images sont réduites à 1600 px de côté pour rester légères. Les formats non lisibles par le navigateur (par exemple HEIC) sont signalés à l'import : à convertir en JPEG au préalable.

## Tracés sur les photos et sur les images

Sur chaque photo, ainsi que sur la photo de situation, la vue d'ensemble et le plan de masse, le bouton **✎ Tracer** ouvre un éditeur plein écran pour dessiner des polylignes de couleur.

- **Tracer** : un clic pose un point ; double-clic, Entrée, clic droit ou « Terminer le tracé » finit la polyligne. Retour arrière annule le dernier point, Échap abandonne le tracé en cours.
- **Modifier** : cliquer sur un tracé le sélectionne ; glisser ses points pour le corriger ; couleur, épaisseur, pointillés ; Suppr le supprime.
- 9 couleurs prédéfinies + couleur libre, 4 épaisseurs, pointillés, contour blanc.
- Les tracés sont vectoriels (toujours modifiables), enregistrés avec la photo et imprimés dans le PDF. L'image d'origine n'est jamais modifiée.

## Listes de choix (CSV)

Les menus déroulants (version, type d'accès, type de clés, typologie du site, sécurisation, circulation alternée) et les propositions de saisie `RAS` / `SO` / `Oui` / `Non` sont alimentés par `assets/listes.csv`, au format `liste;valeur`. Chaque menu propose aussi « Autre (saisie libre)… ».

- Modifier `assets/listes.csv` dans le dépôt pour changer les listes pour tous les utilisateurs.
- Ou, dans l'application, section « Listes de choix » : télécharger le CSV, le modifier dans Excel, puis l'importer (conservé dans le navigateur).
- Ouvert directement en `file://`, le navigateur interdit la lecture du fichier : une copie intégrée à `app.js` (variable `EMBEDDED_CSV`) est alors utilisée.

## Modèles en mémoire

« Modèles en mémoire » enregistre le formulaire sous un nom. La recherche filtre par nom ou par contenu, sans tenir compte des accents. Un clic applique le modèle ; ↻ le met à jour ; ✕ le supprime. Le code projet, l'adresse, la date, le nom du câble, les images et les photos ne sont jamais écrasés. Les modèles s'exportent et s'importent en `.json`.

## Sauvegarde

Les données sont sauvegardées automatiquement dans le navigateur (IndexedDB, base `doe-vtl`, distincte de celle du générateur DOE GC RP). **Exporter (.json)** et **Importer** permettent de sauvegarder ou transmettre un dossier complet, photos et tracés compris.

## Publier sur GitHub Pages

```bash
git init
git add .
git commit -m "Générateur de DOE VTL"
git branch -M main
git remote add origin https://github.com/<utilisateur>/<depot>.git
git push -u origin main
```

Puis, dans le dépôt : **Settings → Pages → Branch : main / (root)**.

## Structure

```
index.html      formulaire et zone d'aperçu
style.css       mise en page écran et impression A4
app.js          logique (état, formulaire, aperçu, photos, tracés, import)
assets/         logos et listes.csv
```
