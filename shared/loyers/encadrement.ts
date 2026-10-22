/**
 * Communes soumises à l'encadrement du niveau des loyers (loi ELAN, art. 140, prolongée par la
 * loi 3DS, art. 85) : le loyer de base d'un bail signé ou renouvelé ne peut pas dépasser le loyer
 * de référence majoré fixé chaque année par arrêté préfectoral. Ce plafond prime sur toute
 * estimation de marché. Sources dans docs/donnees-loyers.md.
 */

export interface TerritoireEncadre {
  nom: string
  /** Codes INSEE des communes entièrement concernées. */
  communes: string[]
  /** Communes concernées pour une partie de leur territoire seulement. */
  communesEnPartie?: string[]
  /** Date d'entrée en vigueur, AAAA-MM-JJ. */
  depuis: string
  /** Fiche officielle, avec le simulateur des loyers de référence. */
  fiche: string
}

/** Dernier jour de l'expérimentation, sauf prolongation par la loi. */
export const FIN_EXPERIMENTATION = '2026-11-24'

const FICHE = 'https://www.service-public.gouv.fr/particuliers/vosdroits/'

/** Une plage de codes INSEE : les arrondissements de Paris (75101 à 75120) et de Lyon. */
const plage = (debut: number, fin: number) =>
  Array.from({ length: fin - debut + 1 }, (_, i) => String(debut + i))

export const TERRITOIRES_ENCADRES: TerritoireEncadre[] = [
  { nom: 'Paris', communes: plage(75101, 75120), depuis: '2019-07-01', fiche: `${FICHE}F34407` },
  {
    nom: 'Lille, Hellemmes et Lomme',
    communes: ['59350'],
    depuis: '2020-03-01',
    fiche: `${FICHE}F34408`,
  },
  {
    nom: 'Plaine Commune',
    // Aubervilliers, La Courneuve, Épinay-sur-Seine, L'Île-Saint-Denis, Saint-Denis (avec
    // Pierrefitte-sur-Seine depuis leur fusion de 2025), Saint-Ouen-sur-Seine, Stains, Villetaneuse.
    communes: ['93001', '93027', '93031', '93039', '93066', '93070', '93072', '93079'],
    depuis: '2021-06-01',
    fiche: `${FICHE}F35761`,
  },
  {
    nom: 'Lyon et Villeurbanne',
    communes: [...plage(69381, 69389), '69266'],
    depuis: '2021-11-01',
    fiche: `${FICHE}F36218`,
  },
  {
    nom: 'Est Ensemble',
    // Bagnolet, Bobigny, Bondy, Les Lilas, Montreuil, Noisy-le-Sec, Pantin, Le Pré-Saint-Gervais,
    // Romainville.
    communes: ['93006', '93008', '93010', '93045', '93048', '93053', '93055', '93061', '93063'],
    depuis: '2021-12-01',
    fiche: `${FICHE}F36219`,
  },
  { nom: 'Montpellier', communes: ['34172'], depuis: '2022-07-01', fiche: `${FICHE}F36437` },
  { nom: 'Bordeaux', communes: ['33063'], depuis: '2022-07-15', fiche: `${FICHE}F36487` },
  {
    nom: 'Pays basque',
    // Les 24 communes du décret 2023-981 du 23 octobre 2023.
    communes: [
      '64009',
      '64024',
      '64035',
      '64038',
      '64065',
      '64100',
      '64102',
      '64122',
      '64125',
      '64130',
      '64140',
      '64189',
      '64249',
      '64260',
      '64282',
      '64304',
      '64317',
      '64407',
      '64483',
      '64496',
      '64540',
      '64545',
      '64547',
      '64558',
    ],
    depuis: '2024-11-25',
    fiche: `${FICHE}F38659`,
  },
  {
    nom: 'Grenoble-Alpes Métropole',
    // Décret 2023-1046 du 16 novembre 2023 : 13 communes entières, 8 en partie.
    communes: [
      '38170',
      '38516',
      '38229',
      '38150',
      '38271',
      '38533',
      '38179',
      '38486',
      '38158',
      '38309',
      '38057',
      '38111',
      '38524',
    ],
    communesEnPartie: ['38382', '38474', '38169', '38185', '38421', '38485', '38151', '38317'],
    depuis: '2025-01-20',
    fiche: `${FICHE}F39137`,
  },
]

export interface Encadrement {
  territoire: TerritoireEncadre
  enPartie: boolean
  /** L'échéance de l'expérimentation est passée à la date donnée : à vérifier. */
  echeancePassee: boolean
}

export function encadrementPour(code: string, aujourdhui: string): Encadrement | undefined {
  for (const territoire of TERRITOIRES_ENCADRES) {
    const enPartie = territoire.communesEnPartie?.includes(code) ?? false
    if (enPartie || territoire.communes.includes(code))
      return { territoire, enPartie, echeancePassee: aujourdhui > FIN_EXPERIMENTATION }
  }
  return undefined
}
