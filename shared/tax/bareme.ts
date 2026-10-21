import type { Decimal } from './decimal'
import { d, ZERO, euros, max0, min, pourcent } from './decimal'
import type { ReglesAnnee } from './rules'

/**
 * Impôt sur le revenu du foyer au barème progressif (CGI art. 197), dans l'ordre de l'avis
 * d'impôt :
 *
 * 1. droits du barème par part, multipliés par le nombre de parts (quotient familial) ;
 * 2. plafonnement : l'avantage des parts au-delà des parts de base (1 pour une personne seule,
 *    2 pour un couple) ne peut pas dépasser un montant par demi-part ;
 * 3. décote, pour les impôts bruts modestes, appliquée après le plafonnement ;
 * 4. pas de mise en recouvrement en dessous de 61 € (CGI art. 1657).
 *
 * Le revenu locatif s'apprécie par différence : impôt du foyer avec le bien moins impôt du
 * foyer sans lui. Sources et montants dans docs/regles-fiscales.md.
 */

export const SITUATIONS = ['seul', 'couple'] as const
export type Situation = (typeof SITUATIONS)[number]

export interface FoyerFiscal {
  situation: Situation
  parts: number
}

export interface DetailImpot {
  /** Revenu net imposable du foyer, arrondi à l'euro. */
  revenu: Decimal
  /** Droits avec toutes les parts, avant plafonnement. */
  droitsQuotient: Decimal
  /** Impôt brut, après plafonnement du quotient familial, arrondi à l'euro. */
  impotBrut: Decimal
  plafonnementApplique: boolean
  decote: Decimal
  /** Impôt net à payer, arrondi à l'euro ; zéro sous le seuil de recouvrement. */
  impot: Decimal
  /** Taux de la tranche où tombe le dernier euro, en pourcentage. */
  tmi: number
}

export function partsDeBase(situation: Situation): number {
  return situation === 'couple' ? 2 : 1
}

/** Droits du barème pour un revenu et un nombre de parts, sans plafonnement ni décote. */
export function droitsBareme(revenu: Decimal, parts: Decimal.Value, regles: ReglesAnnee): Decimal {
  const nbParts = d(parts)
  const parPart = max0(revenu).dividedBy(nbParts)
  const tranches = regles.bareme.tranches
  let droits = ZERO
  tranches.forEach((tranche, i) => {
    const suivante = tranches[i + 1]
    const haut = suivante ? min(parPart, suivante.aPartirDe) : parPart
    if (haut.greaterThan(tranche.aPartirDe))
      droits = droits.plus(haut.minus(tranche.aPartirDe).times(pourcent(tranche.taux)))
  })
  return droits.times(nbParts)
}

/** Taux marginal pour un revenu et un nombre de parts. */
export function tauxMarginal(revenu: Decimal, parts: Decimal.Value, regles: ReglesAnnee): number {
  const parPart = max0(revenu).dividedBy(d(parts))
  const tranche = [...regles.bareme.tranches]
    .reverse()
    .find((t) => parPart.greaterThan(t.aPartirDe))
  return tranche ? tranche.taux.toNumber() : 0
}

/** Avantage maximal des parts au-delà des parts de base : par demi-part, et par quart de part. */
export function plafondQuotient(foyer: FoyerFiscal, regles: ReglesAnnee): Decimal {
  const supplement = d(foyer.parts).minus(partsDeBase(foyer.situation))
  if (!supplement.greaterThan(0)) return ZERO
  const demiParts = supplement.dividedBy('0.5').floor()
  const quart = supplement.minus(demiParts.times('0.5')).greaterThan(0) ? 1 : 0
  return demiParts
    .times(regles.bareme.plafondDemiPart)
    .plus(d(quart).times(regles.bareme.plafondQuartPart))
}

export function impotSurLeRevenu(
  revenuImposable: Decimal,
  foyer: FoyerFiscal,
  regles: ReglesAnnee,
): DetailImpot {
  const { bareme } = regles
  const revenu = euros(max0(revenuImposable))
  const base = partsDeBase(foyer.situation)

  const droitsQuotient = droitsBareme(revenu, foyer.parts, regles)
  const droitsPartsDeBase = droitsBareme(revenu, base, regles).minus(plafondQuotient(foyer, regles))
  const plafonnementApplique = droitsPartsDeBase.greaterThan(droitsQuotient)
  const impotBrut = euros(plafonnementApplique ? droitsPartsDeBase : droitsQuotient)

  const forfait =
    foyer.situation === 'couple' ? bareme.decoteForfaitCouple : bareme.decoteForfaitSeul
  const decote = min(impotBrut, max0(forfait.minus(impotBrut.times(pourcent(bareme.decoteTaux)))))
  const net = euros(impotBrut.minus(decote))
  const impot = net.lessThan(bareme.seuilRecouvrement) ? ZERO : net

  return {
    revenu,
    droitsQuotient,
    impotBrut,
    plafonnementApplique,
    decote,
    impot,
    tmi: tauxMarginal(revenu, plafonnementApplique ? base : foyer.parts, regles),
  }
}
