# Sécurité et confidentialité

## Données de l'utilisateur

- Le bien, ses loyers, ses charges et son emprunt sont saisis et calculés **dans le navigateur**.
  Aucune route serveur ne les reçoit : le site n'a pas d'API, pas de base de données, pas de
  compte, pas d'outil d'analyse d'audience ni de traceur.
- **Conservation dans le navigateur** (`localStorage`, clé `revenus-locatifs:dossier:v1`) : le
  dossier validé est réécrit à chaque modification pour être retrouvé à la visite suivante, sur
  l'appareil seulement. « Tout effacer » et « Quitter la démonstration » le suppriment.
- **Préférences** (`localStorage`, clé `revenus-locatifs:theme`) : le thème choisi. Rien d'autre.
- **Estimation du loyer** : la liste des communes et les loyers d'un département sont des fichiers
  statiques servis par le site lui-même (`/donnees/loyers-2025/`). La recherche de commune se fait
  dans le navigateur ; seul le nom du fichier du département choisi apparaît dans la requête, sur
  le même domaine. Aucun service tiers n'est appelé. La commune, la surface et les charges
  rejoignent le dossier enregistré dans le navigateur.
- Le stockage peut être indisponible (navigation privée, quota) : l'application fonctionne alors
  sans mémoire, sans erreur visible.

## En-têtes HTTP

Posés sur toutes les réponses par `routeRules` (`nuxt.config.ts`) :

| En-tête                    | Valeur                                                                           |
| -------------------------- | -------------------------------------------------------------------------------- |
| Content-Security-Policy    | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` |
| X-Frame-Options            | `DENY`                                                                           |
| X-Content-Type-Options     | `nosniff`                                                                        |
| Referrer-Policy            | `strict-origin-when-cross-origin`                                                |
| Permissions-Policy         | caméra, micro, géolocalisation, paiement et USB désactivés                       |
| Cross-Origin-Opener-Policy | `same-origin`                                                                    |
| Strict-Transport-Security  | posé par Vercel                                                                  |

La CSP ne restreint pas `script-src` : Nuxt intègre des scripts dans la page, ce qui demanderait
des nonces.

## Entrées

- **Saisie** : chaque champ passe par le schéma Zod de `shared/model/dossier.ts` (nombres finis,
  bornes, énumérations) avant d'entrer dans le calcul ; une saisie invalide laisse le dernier
  dossier valide affiché.
- **Stockage** : ce qui est relu depuis `localStorage` repasse par le même schéma ; un contenu
  altéré est ignoré.
- **Affichage** : Vue échappe tout le texte affiché ; aucun `v-html`.

## Signaler un problème

Ouvrez une issue sur le dépôt, ou écrivez à l'auteur via son profil GitHub pour un sujet
sensible. Les règles fiscales appliquées et leurs sources sont dans
[`docs/regles-fiscales.md`](docs/regles-fiscales.md) : une erreur de calcul se signale de la même
façon.
