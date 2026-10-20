import Decimal from 'decimal.js'

/**
 * Tous les montants fiscaux sont manipulés en décimal exact : aucune addition de
 * nombres à virgule flottante n'entre dans un résultat affiché ou reporté.
 */
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }

export type Montant = Decimal

export const ZERO = new Decimal(0)

export function d(valeur: Decimal.Value | null | undefined): Decimal {
  if (valeur === null || valeur === undefined || valeur === '') return ZERO
  return new Decimal(valeur)
}

export function somme(valeurs: Iterable<Decimal.Value>): Decimal {
  let total = ZERO
  for (const v of valeurs) total = total.plus(d(v))
  return total
}

export function max0(valeur: Decimal): Decimal {
  return valeur.isNegative() ? ZERO : valeur
}

export function min(a: Decimal, b: Decimal): Decimal {
  return a.lessThan(b) ? a : b
}

/** Arrondi à l'euro le plus proche, comme sur les formulaires. */
export function euros(valeur: Decimal): Decimal {
  return valeur.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
}

/** Arrondi au centime. */
export function centimes(valeur: Decimal): Decimal {
  return valeur.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

export function pourcent(taux: Decimal.Value): Decimal {
  return d(taux).dividedBy(100)
}
