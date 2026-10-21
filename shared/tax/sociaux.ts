import type { Decimal } from './decimal'
import { euros, max0, pourcent } from './decimal'
import type { ReglesAnnee } from './rules'

/**
 * Ce qu'un régime produit pour l'impôt du foyer : la base imposable arrondie à l'euro, les
 * prélèvements sociaux qu'elle supporte et la CSG déductible du revenu global de l'année
 * suivante. L'impôt sur le revenu, lui, se calcule au barème sur l'ensemble du foyer
 * (shared/tax/bareme.ts), dans la projection.
 */
export type CategorieRevenu = keyof ReglesAnnee['prelevementsSociaux']

export function prelevementsSurBase(
  base: Decimal,
  categorie: CategorieRevenu,
  regles: ReglesAnnee,
) {
  const baseImposable = euros(max0(base))
  return {
    baseImposable,
    prelevementsSociaux: euros(
      baseImposable.times(pourcent(regles.prelevementsSociaux[categorie])),
    ),
    csgDeductibleAnneeSuivante: euros(baseImposable.times(pourcent(regles.csgDeductible))),
  }
}
