/**
 * Estimation d'un loyer de marché à partir de la « Carte des loyers » 2025 : un loyer d'annonce
 * au m², charges comprises, pour un logement vide de surface type, avec un intervalle de
 * prédiction. Ce n'est pas un loyer de bail signé, ni un plafond légal. Voir
 * docs/donnees-loyers.md.
 */

export const SOURCE_LOYERS =
  'Estimations ANIL, à partir des données du Groupe SeLoger et de leboncoin'
export const MILLESIME_LOYERS = 2025

export type TypeBien = 'appartement' | 'maison'

/** Appartement toutes tailles, une ou deux pièces, trois pièces et plus, maison. */
export type CleIndicateur = 'a' | 'a12' | 'a3' | 'm'

/** 0 : estimé sur la commune ; 1 : sur la commune mais fragile ; 2 : sur des communes voisines. */
export type Fiabilite = 0 | 1 | 2

/** [loyer au m², borne basse, borne haute, fiabilité], tel qu'écrit par scripts/loyers.mjs. */
export type Indicateur = [m2: number, bas: number, haut: number, fiabilite: Fiabilite]
export type IndicateursCommune = Partial<Record<CleIndicateur, Indicateur>>

/** Surface du logement type de chaque indicateur (note méthodologique 2025). */
export const SURFACE_REFERENCE: Record<CleIndicateur, number> = { a: 52, a12: 37, a3: 72, m: 92 }

export function cleIndicateur(type: TypeBien, pieces: number): CleIndicateur {
  if (type === 'maison') return 'm'
  if (pieces >= 3) return 'a3'
  if (pieces >= 1) return 'a12'
  return 'a'
}

export interface Estimation {
  cle: CleIndicateur
  /** Loyer au m², charges comprises. */
  m2: number
  /** Loyer mensuel charges comprises, et l'intervalle de prédiction, à l'euro. */
  mensuel: number
  bas: number
  haut: number
  fiabilite: Fiabilite
  surfaceReference: number
  /** La surface s'éloigne du logement type : le loyer au m² y est moins sûr. */
  surfaceAtypique: boolean
}

export function estimerLoyer(
  indicateurs: IndicateursCommune,
  type: TypeBien,
  pieces: number,
  surface: number,
): Estimation | undefined {
  const cle = cleIndicateur(type, pieces)
  const indicateur = indicateurs[cle] ?? (cle === 'm' ? undefined : indicateurs.a)
  if (!indicateur || !(surface > 0)) return undefined
  const [m2, bas, haut, fiabilite] = indicateur
  const reference = SURFACE_REFERENCE[cle]
  return {
    cle,
    m2,
    mensuel: Math.round(m2 * surface),
    bas: Math.round(bas * surface),
    haut: Math.round(haut * surface),
    fiabilite,
    surfaceReference: reference,
    surfaceAtypique: surface < reference * 0.6 || surface > reference * 1.6,
  }
}

/** Loyer hors charges, celui qu'on déclare : l'estimation moins les charges refacturées. */
export function loyerHorsCharges(mensuelChargesComprises: number, chargesRecuperables: number) {
  return Math.max(0, Math.round(mensuelChargesComprises - Math.max(0, chargesRecuperables)))
}
