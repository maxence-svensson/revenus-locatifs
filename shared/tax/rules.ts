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

export interface TrancheBareme {
  /** Le taux s'applique à la part du revenu par part qui dépasse ce seuil. */
  aPartirDe: Decimal
  /** En pourcentage. */
  taux: Decimal
}

export interface ReglesAnnee {
  annee: number
  /** Impôt sur le revenu : barème progressif, quotient familial et décote (CGI art. 197). */
  bareme: {
    tranches: TrancheBareme[]
    /** Plafond de l'avantage du quotient familial, par demi-part au-delà des parts de base. */
    plafondDemiPart: Decimal
    /** Plafond par quart de part (garde alternée). */
    plafondQuartPart: Decimal
    /** Décote : forfait moins un pourcentage de l'impôt brut. */
    decoteForfaitSeul: Decimal
    decoteForfaitCouple: Decimal
    decoteTaux: Decimal
    /** En dessous de ce montant, l'impôt n'est pas mis en recouvrement (CGI art. 1657). */
    seuilRecouvrement: Decimal
  }
  /**
   * Prélèvements sociaux (CSG, CRDS, prélèvement de solidarité), en pourcentage. Les revenus
   * fonciers de la location nue et les BIC de la location meublée non professionnelle n'ont pas
   * le même taux depuis les revenus 2025.
   */
  prelevementsSociaux: { foncier: Decimal; bic: Decimal }
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
  bareme: {
    tranches: [
      { aPartirDe: d(0), taux: d(0) },
      { aPartirDe: d(11600), taux: d(11) },
      { aPartirDe: d(29579), taux: d(30) },
      { aPartirDe: d(84577), taux: d(41) },
      { aPartirDe: d(181917), taux: d(45) },
    ],
    plafondDemiPart: d(1807),
    plafondQuartPart: d(904),
    decoteForfaitSeul: d(897),
    decoteForfaitCouple: d(1483),
    decoteTaux: d('45.25'),
    seuilRecouvrement: d(61),
  },
  // LFSS 2026, art. 12 : CSG portée de 9,2 % à 10,6 % sur les revenus du patrimoine à compter
  // des revenus 2025, sauf les revenus fonciers, qui restent à 9,2 %. CRDS 0,5 % et prélèvement
  // de solidarité 7,5 % inchangés.
  prelevementsSociaux: { foncier: d('17.2'), bic: d('18.6') },
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
