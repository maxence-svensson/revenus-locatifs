export interface Entree {
  chemin: string
  libelle: string
  court: string
  icone: 'maison' | 'crayon' | 'balance' | 'livre'
}

export const ENTREES: Entree[] = [
  { chemin: '/', libelle: 'Accueil', court: 'Accueil', icone: 'maison' },
  { chemin: '/simulateur', libelle: 'Simulateur', court: 'Saisie', icone: 'crayon' },
  { chemin: '/resultat', libelle: 'Résultat', court: 'Résultat', icone: 'balance' },
  { chemin: '/methode', libelle: 'Méthode et sources', court: 'Méthode', icone: 'livre' },
]
