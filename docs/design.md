# Design

Revenus locatifs partage la charte de [Crypto-plusvalue](https://github.com/maxence-svensson/crypto-plusvalue) :
un fond clair presque opaque, des halos très diffus, du verre dépoli là où il crée de la
hiérarchie, des surfaces pleines pour les chiffres, la police du système, des animations courtes.
Les deux sites doivent se reconnaître comme venant du même auteur sans être le même site.

Tous les jetons sont dans `app/assets/css/main.css`, avec le même vocabulaire de classes que
Crypto-plusvalue (`glass`, `solid-card`, `btn`, `input`, `segmented`, `headline`, `numeric`) pour
qu'un paquet partagé puisse un jour les porter.

## Ce qui est commun

- **Structure** : barre du haut en verre alignée sur le contenu, plus opaque dès que la page
  défile ; barre d'onglets flottante en bas sur téléphone ; pied de page sobre sur un filet.
- **Jetons** : fond `#F5F5F7` / `#000000`, surfaces `#FFFFFF` / `#1C1C1E`, texte `#1D1D1F` /
  `#F5F5F7`, texte secondaire `#6E6E73` / `#A1A1A6`, séparateurs et champs à faible opacité.
  Chaque couleur est déclarée une fois avec `light-dark()` ; `data-theme` sur `<html>` impose
  clair ou sombre.
- **Rayons** : 12 px (pastilles), 16 px (contrôles), 28 px (cartes), 36 px (sections).
- **Composants** : boutons avec montée d'un pixel et enfoncement au clic, champs à fond teinté et
  anneau au focus, contrôle segmenté en radios, interrupteur, bandeau de démonstration.
- **Graphiques** : SVG dessiné à la main, séries bleu `#2A78D6` et orange `#EB6834`, validées
  pour la vision deutéranope ; texte à l'encre du texte.
- **Mouvement** : courbe `cubic-bezier(0.22, 1, 0.36, 1)`, entrée en fondu de l'accueil, tout
  désactivé sous `prefers-reduced-motion`.

## Ce qui est propre à Revenus locatifs

| Élément       | Crypto-plusvalue                       | Revenus locatifs                                    |
| ------------- | -------------------------------------- | --------------------------------------------------- |
| Accent        | bleu `#0071E3`                         | vert d'eau `#0F766E` (5,4:1 sur blanc)              |
| Lien          | `#0066CC` / `#2997FF`                  | `#0B6B5E` / `#34D1B6`                               |
| Halos du fond | bleu, violet, cyan, rose               | vert, vert d'eau, ambre, un peu de bleu             |
| Marque        | carré bleu-indigo, courbe              | carré vert-vert d'eau, maison                       |
| Signature     | surligneur et cases en peigne          | **la balance** : deux barres à l'échelle des totaux |
| Accroche      | jusqu'à 6,5 rem                        | jusqu'à 4,5 rem, plus sobre                         |
| Navigation    | six sections, menu « Plus » sur mobile | quatre sections, pas de menu « Plus »               |
| Thème         | page Paramètres                        | bouton dans la barre du haut                        |

La balance apparaît dans la carte de verdict : une barre par régime, proportionnelle au total
d'impôt sur l'horizon, le régime le moins cher marqué d'une pastille verte. Une barre verte
signale un total négatif, c'est-à-dire une économie nette d'impôt. Les barres se remplissent à
l'ouverture, comme le surligneur passe sur la case 3AN chez Crypto-plusvalue.

## Accessibilité

- Lien d'évitement, focus visible à l'accent sur tout élément interactif.
- Chaque texte atteint 4,5:1 ; le vert et le rouge ne portent jamais seuls l'information.
- Zones tactiles d'au moins 44 px ; tableaux à en-têtes ; barre d'onglets qui respecte
  `env(safe-area-inset-bottom)`.
- Vérifié à 375 et 1 280 px, en clair et en sombre.
