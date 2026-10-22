# Estimation du loyer : données et méthode

Le simulateur peut estimer un loyer de marché d’après la commune du bien. Ce document dit d’où
viennent les chiffres, comment ils sont transformés et ce qu’ils ne disent pas.

## La source : la « Carte des loyers » 2025

- **Jeu de données** : [« Carte des loyers » – Indicateurs de loyers d’annonce par commune en
  2025][carte], publié le 11 décembre 2025 par le ministère de la Transition écologique ; indicateurs
  calculés par l’ANIL à partir de 9,1 millions d’annonces leboncoin et Groupe SeLoger (2019 à 2025).
- **Licence** : Licence Ouverte 2.0. Mention obligatoire, reprise dans l’interface : « Estimations
  ANIL, à partir des données du Groupe SeLoger et de leboncoin ».
- **Ce que mesure un indicateur** : un loyer d’annonce au m², **charges comprises**, pour un
  logement **loué vide** mis en location au 3e trimestre 2025, avec un intervalle de prédiction.
  Couverture : France entière hors Mayotte, géographie communale au 1er janvier 2025 (Paris, Lyon
  et Marseille par arrondissement).
- **Quatre indicateurs**, chacun pour un logement type :

  | Indicateur                   | Fichier                   | Logement type |
  | ---------------------------- | ------------------------- | ------------- |
  | Appartement, toutes tailles  | `pred-app-mef-dhup.csv`   | 52 m²         |
  | Appartement de 1 ou 2 pièces | `pred-app12-mef-dhup.csv` | 37 m²         |
  | Appartement de 3 pièces ou + | `pred-app3-mef-dhup.csv`  | 72 m²         |
  | Maison                       | `pred-mai-mef-dhup.csv`   | 92 m²         |

## Ce que fait le site

1. `scripts/loyers.mjs` (`npm run loyers`) télécharge les quatre fichiers, les décode
   (Windows-1252) et écrit dans `public/donnees/loyers-2025/` un index des 34 900 communes pour la
   recherche, et un fichier par département avec, pour chaque commune et chaque indicateur :
   loyer au m², bornes basse et haute de l’intervalle, fiabilité.
2. Le navigateur charge l’index à la première recherche, puis le seul fichier du département
   choisi. Ces fichiers sont servis par le site lui-même : **la commune cherchée ne part vers aucun
   service tiers**, et la recherche se fait en local (`shared/loyers/communes.ts`).
3. L’estimation (`shared/loyers/estimation.ts`) choisit l’indicateur selon le type de bien et le
   nombre de pièces, multiplie le loyer au m² par la surface, retire les charges refacturées au
   locataire pour obtenir le loyer hors charges, et ajoute en meublé le supplément de loyer indiqué
   dans le dossier. L’utilisateur reprend le chiffre d’un clic ; rien n’est remplacé sans lui.

### Fiabilité affichée

La note d’utilisation invite à la prudence quand le R² est inférieur à 0,5, quand la commune compte
moins de 30 annonces, ou quand l’indicateur vient d’une maille de communes voisines. Le script
classe donc chaque indicateur en trois niveaux, que l’interface signale :

| Niveau | Cas                                                          |
| ------ | ------------------------------------------------------------ |
| 0      | estimé sur la commune                                        |
| 1      | estimé sur la commune, mais moins de 30 annonces ou R² < 0,5 |
| 2      | estimé sur une maille de communes voisines comparables       |

L’interface prévient aussi quand la surface s’écarte de plus de 40 % de celle du logement type
(moins de 60 % ou plus de 160 %) : le loyer au m² baisse quand la surface augmente, et le site ne
fait que multiplier.

### Limites

- Ce sont des **loyers d’annonce**, pas des loyers de baux signés.
- L’état du logement, l’étage, l’extérieur, le DPE n’entrent pas dans l’indicateur.
- Les données sont des logements **vides** ; le meublé passe par le supplément de loyer saisi.
- Les versions successives de la carte ne se comparent pas entre elles (changement de méthode et
  de maillage).

## Encadrement des loyers

Dans les communes où l’expérimentation de l’encadrement du niveau des loyers s’applique (loi ELAN
du 23 novembre 2018, art. 140, prolongée par la loi 3DS du 21 février 2022, art. 85), le loyer de
base d’un bail signé ou renouvelé ne peut pas dépasser le **loyer de référence majoré** fixé par
arrêté préfectoral, selon le quartier, l’époque de construction, le nombre de pièces et le type de
location. Ce plafond prime sur toute estimation de marché : le site le signale et renvoie vers la
fiche service-public de chaque territoire, qui donne le simulateur officiel. Il ne calcule pas le
plafond.

| Territoire               | Depuis           | Communes (codes dans `shared/loyers/encadrement.ts`)                                     | Fiche    |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------- | -------- |
| Paris                    | 1er juillet 2019 | les 20 arrondissements                                                                   | [F34407] |
| Lille, Hellemmes, Lomme  | 1er mars 2020    | Lille (Hellemmes et Lomme sont des communes associées)                                   | [F34408] |
| Plaine Commune           | 1er juin 2021    | 9 communes ; Pierrefitte-sur-Seine fait partie de Saint-Denis depuis le 1er janvier 2025 | [F35761] |
| Lyon et Villeurbanne     | 1er nov. 2021    | les 9 arrondissements de Lyon, Villeurbanne                                              | [F36218] |
| Est Ensemble             | 1er déc. 2021    | 9 communes                                                                               | [F36219] |
| Montpellier              | 1er juillet 2022 | Montpellier                                                                              | [F36437] |
| Bordeaux                 | 15 juillet 2022  | Bordeaux                                                                                 | [F36487] |
| Pays basque              | 25 nov. 2024     | 24 communes (décret 2023-981 du 23 octobre 2023)                                         | [F38659] |
| Grenoble-Alpes Métropole | 20 janvier 2025  | 13 communes entières et 8 en partie (décret 2023-1046 du 16 novembre 2023)               | [F39137] |

Sources : [ANIL, expérimentation de l’encadrement du niveau des loyers][anil] (territoires,
décrets, dates) ; fiches service-public citées ; communiqué de la préfecture des
Pyrénées-Atlantiques pour la liste du Pays basque ; extrait du décret 2023-1046 (Dalloz) pour
Grenoble. Un test vérifie que chaque code cité existe dans la carte des loyers.

**Échéance** : l’expérimentation s’applique aux baux signés jusqu’au **24 novembre 2026** (huit ans
après la loi ELAN). Une proposition de loi qui la prolonge de deux ans a été adoptée par le Sénat
le 21 octobre 2026 et doit revenir devant l’Assemblée nationale. Le site affiche « en vigueur
jusqu’au 24 novembre 2026, sauf prolongation par la loi », puis, après cette date, invite à
vérifier sur la fiche officielle. À mettre à jour dès que le texte est voté.

## Mettre à jour les données

Chaque nouvelle édition de la carte (en général en décembre) :

1. Remplacer les adresses des fichiers dans `scripts/loyers.mjs` par celles du nouveau jeu de
   données sur data.gouv.fr, et le millésime (`loyers-2025`, `MILLESIME_LOYERS`).
2. `npm run loyers`, puis `npm test` : les tests relisent les fichiers générés (valeurs de Nantes,
   codes des communes encadrées).
3. Mettre à jour ce document et la liste des communes encadrées si un territoire change.

[carte]: https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025
[anil]: https://www.anil.org/aj-experimentation-encadrement-niveau-loyers-zones-tendues/
[F34407]: https://www.service-public.gouv.fr/particuliers/vosdroits/F34407
[F34408]: https://www.service-public.gouv.fr/particuliers/vosdroits/F34408
[F35761]: https://www.service-public.gouv.fr/particuliers/vosdroits/F35761
[F36218]: https://www.service-public.gouv.fr/particuliers/vosdroits/F36218
[F36219]: https://www.service-public.gouv.fr/particuliers/vosdroits/F36219
[F36437]: https://www.service-public.gouv.fr/particuliers/vosdroits/F36437
[F36487]: https://www.service-public.gouv.fr/particuliers/vosdroits/F36487
[F38659]: https://www.service-public.gouv.fr/particuliers/vosdroits/F38659
[F39137]: https://www.service-public.gouv.fr/particuliers/vosdroits/F39137
