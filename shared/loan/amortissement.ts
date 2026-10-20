import type { Decimal } from '../tax/decimal'
import { d, ZERO, centimes, pourcent } from '../tax/decimal'
import type { Emprunt } from '../model/dossier'

export interface EcheanceMensuelle {
  annee: number
  mois: number
  interets: Decimal
  capitalRembourse: Decimal
  assurance: Decimal
  capitalRestant: Decimal
}

export interface ChargesEmpruntAnnee {
  annee: number
  interets: Decimal
  assurance: Decimal
  /** Frais de dossier, comptés la première année seulement. */
  frais: Decimal
  capitalRembourse: Decimal
}

/** Mensualité constante d'un prêt amortissable classique. */
export function mensualite(
  capital: Decimal,
  tauxAnnuelPourcent: Decimal,
  dureeMois: number,
): Decimal {
  if (dureeMois <= 0) return ZERO
  const tauxMensuel = pourcent(tauxAnnuelPourcent).dividedBy(12)
  if (tauxMensuel.isZero()) return capital.dividedBy(dureeMois)
  const facteur = tauxMensuel.plus(1).pow(dureeMois)
  return capital.times(tauxMensuel).times(facteur).dividedBy(facteur.minus(1))
}

export function tableauAmortissement(emprunt: Emprunt): EcheanceMensuelle[] {
  if (!emprunt.actif || emprunt.capital <= 0) return []
  const capital = d(emprunt.capital)
  const tauxMensuel = pourcent(emprunt.tauxAnnuel).dividedBy(12)
  const m = mensualite(capital, d(emprunt.tauxAnnuel), emprunt.dureeMois)
  const assuranceMensuelle = capital.times(pourcent(emprunt.tauxAssurance)).dividedBy(12)

  const echeances: EcheanceMensuelle[] = []
  // On tient les comptes au centime, comme la banque : la dernière échéance solde
  // exactement le capital restant.
  const mensualiteArrondie = centimes(m)
  let restant = capital
  let annee = emprunt.anneeDebut
  let mois = emprunt.moisDebut
  for (let i = 0; i < emprunt.dureeMois; i++) {
    const interets = centimes(restant.times(tauxMensuel))
    let capitalRembourse = mensualiteArrondie.minus(interets)
    if (i === emprunt.dureeMois - 1 || capitalRembourse.greaterThan(restant))
      capitalRembourse = restant
    restant = restant.minus(capitalRembourse)
    echeances.push({
      annee,
      mois,
      interets,
      capitalRembourse,
      assurance: centimes(assuranceMensuelle),
      capitalRestant: restant,
    })
    mois++
    if (mois > 12) {
      mois = 1
      annee++
    }
  }
  return echeances
}

/** Intérêts, assurance et frais par année civile, tels qu'ils se déduisent. */
export function chargesEmpruntParAnnee(emprunt: Emprunt): Map<number, ChargesEmpruntAnnee> {
  const parAnnee = new Map<number, ChargesEmpruntAnnee>()
  for (const e of tableauAmortissement(emprunt)) {
    const courant = parAnnee.get(e.annee) ?? {
      annee: e.annee,
      interets: ZERO,
      assurance: ZERO,
      frais: ZERO,
      capitalRembourse: ZERO,
    }
    courant.interets = courant.interets.plus(e.interets)
    courant.assurance = courant.assurance.plus(e.assurance)
    courant.capitalRembourse = courant.capitalRembourse.plus(e.capitalRembourse)
    parAnnee.set(e.annee, courant)
  }
  const premiere = parAnnee.get(emprunt.anneeDebut)
  if (premiere && emprunt.actif) premiere.frais = d(emprunt.fraisDossier)
  return parAnnee
}
