import type { Decimal } from './decimal'
import { d } from './decimal'

/**
 * Règles fiscales, une version par année de revenus.
 *
 * Chaque valeur cite sa source dans docs/regles-fiscales.md. Les durées
 * d'amortissement du meublé ne sont pas fixées par la loi : ce sont des usages
 * admis par l'administration, modifiables par l'utilisateur.
 */

export interface ComposantAmortissement {
  cle: 'grosOeuvre' | 'facade' | 'installations' | 'agencements'
  libelle: string
  /** Part de la valeur de la construction (hors terrain). */
  part: Decimal
  dureeAnnees: number
}

export interface ReglesAnnee {
  annee: number
  /** Prélèvements sociaux sur les revenus du patrimoine. */
  prelevementsSociaux: Decimal
  /** Part de la CSG déductible du revenu global de l'année suivante. */
  csgDeductible: Decimal
  foncier: {
    microPlafond: Decimal
    microAbattement: Decimal
    deficitImputableGlobal: Decimal
    /** Plafond relevé pour les travaux de rénovation énergétique (dispositif temporaire). */
    deficitImputableGlobalEnergetique: Decimal
    /** Années de report des déficits sur les revenus fonciers. */
    reportDeficitAnnees: number
    /** Durée minimale de l'option pour le réel. */
    dureeOptionReelAnnees: number
    /** Forfait de frais de gestion, par local. */
    forfaitGestionParLocal: Decimal
  }
  bic: {
    microPlafond: Decimal
    microAbattement: Decimal
    microAbattementMinimum: Decimal
    reportDeficitAnnees: number
    cfeExonerationRecettes: Decimal
    amortissement: {
      composants: ComposantAmortissement[]
      mobilierAnnees: number
      travauxAmeliorationAnnees: number
    }
  }
}

const REGLES_2025: ReglesAnnee = {
  annee: 2025,
  prelevementsSociaux: d('17.2'),
  csgDeductible: d('6.8'),
  foncier: {
    microPlafond: d(15000),
    microAbattement: d(30),
    deficitImputableGlobal: d(10700),
    deficitImputableGlobalEnergetique: d(21400),
    reportDeficitAnnees: 10,
    dureeOptionReelAnnees: 3,
    forfaitGestionParLocal: d(20),
  },
  bic: {
    microPlafond: d(77700),
    microAbattement: d(50),
    microAbattementMinimum: d(305),
    reportDeficitAnnees: 10,
    cfeExonerationRecettes: d(5000),
    amortissement: {
      composants: [
        { cle: 'grosOeuvre', libelle: 'Gros œuvre', part: d('0.55'), dureeAnnees: 50 },
        { cle: 'facade', libelle: 'Façade et toiture', part: d('0.15'), dureeAnnees: 25 },
        {
          cle: 'installations',
          libelle: 'Installations techniques',
          part: d('0.15'),
          dureeAnnees: 20,
        },
        { cle: 'agencements', libelle: 'Agencements', part: d('0.15'), dureeAnnees: 15 },
      ],
      mobilierAnnees: 7,
      travauxAmeliorationAnnees: 10,
    },
  },
}

const REGLES: Record<number, ReglesAnnee> = {
  2025: REGLES_2025,
}

export const DERNIERE_ANNEE_CONNUE = 2025

/**
 * Les règles de l'année demandée, ou à défaut celles de la dernière année
 * connue : une projection sur dix ans applique les règles d'aujourd'hui, et
 * le dit à l'utilisateur.
 */
export function reglesPour(annee: number): ReglesAnnee {
  const connues = Object.keys(REGLES)
    .map(Number)
    .sort((a, b) => a - b)
  let choisie = connues[0]!
  for (const a of connues) if (a <= annee) choisie = a
  return REGLES[choisie]!
}
