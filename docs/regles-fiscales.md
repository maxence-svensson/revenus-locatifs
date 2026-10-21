# Règles fiscales appliquées

Revenus 2025, déclarés en 2026. Les montants et taux vivent dans `shared/tax/rules.ts` ; ce
document explique d’où ils viennent et comment le code les applique. Chaque règle a au moins un
test dans le fichier `.test.ts` voisin.

## Location nue : revenus fonciers

### Micro-foncier (CGI art. 32)

- Applicable si les recettes brutes foncières du foyer n’excèdent pas **15 000 €** dans l’année,
  parts de sociétés comprises, et hors régimes particuliers (monuments historiques, Malraux…).
- Abattement forfaitaire de **30 %** ; aucune charge réelle, aucun déficit.
- Les déficits fonciers d’années antérieures restent imputables sur le revenu net micro
  (BOI-RFPI-DECLA-10, § 90).
- Le micro est le régime de droit ; l’option pour le réel vaut **trois ans**, irrévocable, puis se
  reconduit tacitement par année.

### Réel (CGI art. 28 à 31)

Charges déduites par l’outil, dans l’ordre des lignes de la 2044 :

| Ligne | Charge                                                     | Champ de l’outil                        |
| ----- | ---------------------------------------------------------- | --------------------------------------- |
| 221   | Frais d’administration et de gestion                       | frais de gestion en % des loyers        |
| 222   | Autres frais de gestion, forfait de **20 €** par local     | automatique                             |
| 223   | Primes d’assurance                                         | assurances                              |
| 224   | Réparation, entretien, amélioration (pas de construction)  | travaux, sauf nature « construction »   |
| 227   | Taxes foncières, hors ordures ménagères                    | taxe foncière                           |
| 229   | Provisions pour charges de copropriété                     | charges de copropriété non récupérables |
| 250   | Intérêts d’emprunt, assurance emprunteur, frais de dossier | emprunt                                 |

L’outil ne distingue pas les lignes 229 et 230 (régularisation des provisions de l’année
précédente) : il déduit la charge non récupérable de l’année.

### Déficit foncier (CGI art. 156-I-3° ; BOI-RFPI-BASE-30-20)

1. Les intérêts d’emprunt s’imputent en priorité sur les recettes.
2. S’ils les dépassent, l’excédent est un déficit « intérêts », reportable **dix ans** sur les
   seuls revenus fonciers.
3. Le déficit dû aux autres charges s’impute sur le revenu global dans la limite de
   **10 700 €** par an. Le plafond est porté à **21 400 €** pour la part de déficit due à des
   travaux de rénovation énergétique payés entre le 1er janvier 2023 et le 31 décembre 2025,
   permettant de sortir le logement du statut de passoire (art. 12 de la LFR 2022, décret
   2023-297). L’outil applique le plafond relevé dès qu’il y a des travaux de cette nature dans
   l’année, sans vérifier la condition de performance : c’est à l’utilisateur de la remplir.
4. L’excédent se reporte dix ans sur les revenus fonciers.
5. L’imputation sur le revenu global oblige à louer le bien jusqu’au 31 décembre de la troisième
   année qui suit, sous peine de remise en cause.

Le code : `shared/tax/foncier.ts`, fonction `reelFoncier`. Les tests reprennent l’exemple du
BOFiP (recettes 10 000, intérêts 12 000, autres charges 5 000) et un cas de plafonnement.

L’économie d’impôt du déficit imputé sur le revenu global est chiffrée à la tranche marginale
indiquée ; elle n’a pas d’effet sur les prélèvements sociaux, qui ne portent que sur un revenu
foncier positif.

## Location meublée non professionnelle : BIC

### Micro-BIC (CGI art. 50-0, rédaction issue de la loi 2024-1039 du 19 novembre 2024)

- Location meublée de longue durée : recettes du foyer jusqu’à **77 700 €**, abattement de
  **50 %**, minimum **305 €**.
- Les meublés de tourisme (15 000 € et 30 % pour les non classés, 77 700 € et 50 % pour les
  classés et chambres d’hôtes) ne sont pas traités par l’outil.

### Réel simplifié

- Charges effectives : taxe foncière, assurances, gestion, copropriété, expert-comptable, CFE,
  entretien et réparations, intérêts et frais d’emprunt.
- **Amortissement** du bien hors terrain, des frais d’acquisition (traités comme un élément du
  prix, option admise), du mobilier et des travaux d’amélioration, en linéaire, par composants.
  La loi ne fixe pas de durées ; l’outil retient des usages courants :

  | Composant                | Part du bâti | Durée  |
  | ------------------------ | ------------ | ------ |
  | Gros œuvre               | 55 %         | 50 ans |
  | Façade, toiture          | 15 %         | 25 ans |
  | Installations techniques | 15 %         | 20 ans |
  | Agencements              | 15 %         | 15 ans |
  | Mobilier                 |              | 7 ans  |
  | Travaux d’amélioration   |              | 10 ans |

  Le terrain, 15 % de la valeur par défaut, ne s’amortit pas. L’outil ne pratique pas de prorata
  la première année.

- **Plafonnement (CGI art. 39 C ; BOI-BIC-AMT-20-40-10-10)** : l’amortissement déduit ne peut pas
  excéder la différence entre les loyers et les autres charges. L’excédent se reporte **sans
  limite de durée** et se déduit les années suivantes, dans la même limite.
- **Déficit** dû aux charges autres que l’amortissement : reportable **dix ans** sur les
  bénéfices de même nature (BIC non professionnels), jamais sur le revenu global
  (CGI art. 156-I-1° ter).
- **Revente** : pour les cessions réalisées à compter du 15 février 2025, les amortissements
  déduits sont réintégrés dans le calcul de la plus-value (CGI art. 150 VB, loi de finances pour
  2025, art. 84), hors résidences services et hors travaux de construction ou d’amélioration.
  L’outil ne chiffre pas la revente.
- **CFE** : due par le loueur en meublé, exonération si les recettes de l’année N-2 sont
  inférieures à 5 000 € (CGI art. 1647 D). Saisie par l’utilisateur.

## Commun aux deux catégories

### Impôt sur le revenu au barème (CGI art. 193 et 197)

L’outil calcule l’impôt du foyer au barème, **avec et sans le bien** : la différence est l’impôt
que le bien coûte. Le foyer est décrit par sa situation (personne seule, ou couple marié ou pacsé
soumis à imposition commune), son nombre de parts et son revenu net imposable hors ce bien,
supposé constant sur la projection.

| Revenu par part (revenus 2025) | Taux |
| ------------------------------ | ---- |
| jusqu’à 11 600 €               | 0 %  |
| de 11 601 € à 29 579 €         | 11 % |
| de 29 580 € à 84 577 €         | 30 % |
| de 84 578 € à 181 917 €        | 41 % |
| au-delà de 181 917 €           | 45 % |

Barème des revenus 2025, loi de finances pour 2026 ([service-public.gouv.fr, F1419][f1419]). Dans
l’ordre de l’avis d’impôt :

1. **Quotient familial** : le revenu est divisé par le nombre de parts, chaque tranche taxée à son
   taux, le résultat multiplié par le nombre de parts.
2. **Plafonnement** : l’avantage des parts au-delà des parts de base (1 pour une personne seule,
   2 pour un couple) ne peut pas dépasser **1 807 €** par demi-part et **904 €** par quart de
   part. L’impôt retenu est le plus élevé de l’impôt à toutes les parts et de l’impôt aux parts de
   base diminué du plafond.
3. **Décote** : si l’impôt brut est inférieur à 1 982 € (personne seule) ou 3 277 € (couple), il
   diminue de **897 €** ou **1 483 €** moins **45,25 %** de l’impôt brut, sans devenir négatif. Elle
   s’applique après le plafonnement ([BOI-IR-LIQ-20-20-30][decote]).
4. **Recouvrement** : un impôt inférieur à **61 €** n’est pas mis en recouvrement (CGI art. 1657).

L’écart avec et sans le bien se décompose dans l’ordre : le revenu locatif imposable, puis le
déficit foncier imputé sur le revenu global, puis la CSG déductible de l’année précédente. Chaque
étape est recalculée au barème, si bien qu’un revenu qui fait changer de tranche ou un déficit qui
en fait redescendre est imposé exactement.

Non modélisés : la demi-part de parent isolé (case T, plafond de 4 262 € pour le premier enfant)
et les parts des veufs avec enfants, les réductions et crédits d’impôt, la contribution
exceptionnelle sur les hauts revenus, et le déficit global reportable six ans quand le déficit
imputé dépasse le revenu du foyer.

[f1419]: https://www.service-public.gouv.fr/particuliers/vosdroits/F1419
[decote]: https://bofip.impots.gouv.fr/bofip/2495-PGP.html/identifiant=BOI-IR-LIQ-20-20-30-20260407

### Prélèvements et arrondis

- **Prélèvements sociaux** : 17,2 % du revenu net positif.
- **CSG déductible** : 6,8 points sur les revenus du patrimoine soumis au barème, déductibles du
  revenu global de l’année suivante (CGI art. 154 quinquies). L’outil compte cette économie
  l’année d’après, au barème.
- **Arrondis** : bases et impôts arrondis à l’euro le plus proche. Calcul en décimal exact
  (decimal.js), aucun flottant.

## Ce qui n’est pas modélisé

Voir la page Méthode de l’application : un seul bien, revenu du foyer constant, pas de prorata, pas de meublé de tourisme,
pas de LMP, pas de société à l’IS, pas de dispositif de défiscalisation, pas de plus-value, pas
d’IFI, règles figées à 2025 pour les années suivantes.
