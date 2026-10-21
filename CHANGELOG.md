# Journal des modifications

Les changements notables, du plus récent au plus ancien.

## 21 octobre 2026

### Nue ou meublée, les quatre régimes côte à côte

- Le résultat compare le même bien en location nue et en location meublée : micro-foncier, réel
  foncier, micro-BIC et LMNP au réel, avec le moins cher des quatre et ce que l'autre type de
  location ferait gagner ou perdre.
- Un supplément de loyer en meublé, en pourcentage, pour comparer à loyers réalistes ; le
  dossier se bascule dans l'autre type en un clic.
- Les champs propres au meublé (terrain, mobilier, expert-comptable, CFE) restent visibles en
  location nue, puisqu'ils servent à la comparaison.

## 20 octobre 2026

### Captures d'écran et en-têtes de sécurité

- Huit captures dans le README, prises par `scripts/captures.mjs` sur le build de production.
- En-têtes de sécurité sur toutes les réponses, politique décrite dans `SECURITY.md`.
- Le sélecteur d'année du détail démarre sur la première année projetée.

### Charte commune avec Crypto-plusvalue

- Jetons `light-dark`, verre, boutons, contrôle segmenté, barres haute et basse flottantes, avec
  le même vocabulaire de classes. Accent vert d'eau, halos verts et ambrés, et la balance entre
  les deux régimes comme signature. Choix documentés dans `docs/design.md`.
- `?exemple` ouvre n'importe quelle page en mode démonstration.

### Première version

- Location nue : micro-foncier contre réel, déficit foncier imputé sur le revenu global dans la
  limite de 10 700 € (21 400 € pour la rénovation énergétique), report dix ans.
- Location meublée non professionnelle : micro-BIC contre réel simplifié, amortissement par
  composants plafonné au résultat, report sans limite.
- Projection sur l'horizon choisi, tableau d'amortissement du prêt, CSG déductible l'année
  suivante, verdict, détail d'une année, cases à reporter, plan d'amortissement.
- Règles des revenus 2025 sourcées dans `docs/regles-fiscales.md`, 33 tests unitaires, CI.
