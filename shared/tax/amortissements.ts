import type { Decimal } from './decimal'
import { d, ZERO, somme, pourcent, centimes } from './decimal'
import type { Bien } from '../model/dossier'
import type { ReglesAnnee } from './rules'

/**
 * Amortissements du meublé au réel, par composants.
 *
 * Le terrain ne s'amortit pas. Le bâti se répartit entre composants d'usage,
 * chacun sur sa durée. Les frais d'acquisition suivent le bien. Le mobilier et
 * les travaux d'amélioration ont leur propre durée. Chaque ligne s'amortit en
 * linéaire, prorata temporis la première année n'étant pas appliqué : l'outil
 * raisonne en années pleines de location.
 */

export interface LigneAmortissement {
  cle: string
  libelle: string
  base: Decimal
  dureeAnnees: number
  anneeDebut: number
  annuite: Decimal
}

export function planAmortissement(bien: Bien, regles: ReglesAnnee): LigneAmortissement[] {
  const lignes: LigneAmortissement[] = []
  const { composants, mobilierAnnees, travauxAmeliorationAnnees } = regles.bic.amortissement

  const valeurBien = d(bien.prixAcquisition).plus(d(bien.fraisAcquisition))
  const terrain = valeurBien.times(pourcent(bien.partTerrainPourcent))
  const construction = valeurBien.minus(terrain)

  for (const c of composants) {
    const base = construction.times(c.part)
    if (base.isZero()) continue
    lignes.push({
      cle: c.cle,
      libelle: c.libelle,
      base,
      dureeAnnees: c.dureeAnnees,
      anneeDebut: bien.anneeMiseEnLocation,
      annuite: base.dividedBy(c.dureeAnnees),
    })
  }

  const mobilier = d(bien.mobilier)
  if (mobilier.greaterThan(0)) {
    lignes.push({
      cle: 'mobilier',
      libelle: 'Mobilier',
      base: mobilier,
      dureeAnnees: mobilierAnnees,
      anneeDebut: bien.anneeMiseEnLocation,
      annuite: mobilier.dividedBy(mobilierAnnees),
    })
  }

  const dureeGrosOeuvre = composants.find((c) => c.cle === 'grosOeuvre')?.dureeAnnees ?? 50
  for (const t of bien.travaux) {
    if (t.nature === 'entretien') continue
    const base = d(t.montant)
    if (base.isZero()) continue
    // Une construction ou un agrandissement s'amortit comme le gros œuvre ;
    // une amélioration, sur une durée plus courte.
    const duree = t.nature === 'construction' ? dureeGrosOeuvre : travauxAmeliorationAnnees
    lignes.push({
      cle: `travaux-${t.id}`,
      libelle: t.libelle || 'Travaux',
      base,
      dureeAnnees: duree,
      anneeDebut: t.annee,
      annuite: base.dividedBy(duree),
    })
  }

  return lignes
}

/** Dotation théorique d'une année, avant tout plafonnement. */
export function dotationAnnee(plan: LigneAmortissement[], annee: number): Decimal {
  return centimes(
    somme(
      plan
        .filter((l) => annee >= l.anneeDebut && annee < l.anneeDebut + l.dureeAnnees)
        .map((l) => l.annuite),
    ),
  )
}

export function dotationsParLigne(plan: LigneAmortissement[], annee: number) {
  return plan
    .filter((l) => annee >= l.anneeDebut && annee < l.anneeDebut + l.dureeAnnees)
    .map((l) => ({ ...l, dotation: centimes(l.annuite) }))
}

export { ZERO }
