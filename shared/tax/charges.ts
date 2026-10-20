import type { Decimal } from './decimal'
import { d, ZERO, somme, pourcent, centimes } from './decimal'
import type { Bien } from '../model/dossier'
import { chargesEmpruntParAnnee } from '../loan/amortissement'

/**
 * Les recettes et charges d'une année civile pour un bien, avant toute règle
 * de régime. Les montants sont indexés à partir de l'année de mise en location.
 */
export interface AnneeBrute {
  annee: number
  /** Rang de l'année depuis la mise en location : 0 la première. */
  rang: number
  loyers: Decimal
  taxeFonciere: Decimal
  assurances: Decimal
  fraisGestion: Decimal
  chargesCopropriete: Decimal
  fraisComptable: Decimal
  cfe: Decimal
  travauxEntretien: Decimal
  travauxAmelioration: Decimal
  travauxEnergetique: Decimal
  /** Travaux de construction ou d'agrandissement, jamais déductibles. */
  travauxConstruction: Decimal
  interetsEmprunt: Decimal
  assuranceEmprunt: Decimal
  fraisEmprunt: Decimal
}

export function indexer(base: Decimal.Value, tauxPourcent: Decimal.Value, rang: number): Decimal {
  return d(base).times(pourcent(tauxPourcent).plus(1).pow(rang))
}

export function anneesBrutes(bien: Bien, horizon: number): AnneeBrute[] {
  const emprunt = chargesEmpruntParAnnee(bien.emprunt)
  const resultats: AnneeBrute[] = []
  for (let rang = 0; rang < horizon; rang++) {
    const annee = bien.anneeMiseEnLocation + rang
    const moisLoues = d(12).minus(d(bien.vacanceMoisParAn))
    const loyers = centimes(
      indexer(bien.loyerMensuelHorsCharges, bien.revalorisationLoyersPourcent, rang).times(
        moisLoues,
      ),
    )
    const charge = (v: Decimal.Value) =>
      centimes(indexer(v, bien.revalorisationChargesPourcent, rang))
    const travaux = (nature: string) =>
      somme(
        bien.travaux.filter((t) => t.annee === annee && t.nature === nature).map((t) => t.montant),
      )
    const e = emprunt.get(annee)
    resultats.push({
      annee,
      rang,
      loyers,
      taxeFonciere: charge(bien.taxeFonciere),
      assurances: charge(bien.assurances),
      fraisGestion: centimes(loyers.times(pourcent(bien.fraisGestionPourcent))),
      chargesCopropriete: charge(bien.chargesCopropriete),
      fraisComptable: charge(bien.fraisComptable),
      cfe: charge(bien.cfe),
      travauxEntretien: travaux('entretien'),
      travauxAmelioration: travaux('amelioration'),
      travauxEnergetique: travaux('energetique'),
      travauxConstruction: travaux('construction'),
      interetsEmprunt: e?.interets ?? ZERO,
      assuranceEmprunt: e?.assurance ?? ZERO,
      fraisEmprunt: e?.frais ?? ZERO,
    })
  }
  return resultats
}
