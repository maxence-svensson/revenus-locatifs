import type { Decimal } from './decimal'
import { ZERO, somme, max0, min, euros, pourcent } from './decimal'
import { prelevementsSurBase } from './sociaux'
import type { AnneeBrute } from './charges'
import type { ReglesAnnee } from './rules'
import type { LigneAmortissement } from './amortissements'
import { dotationAnnee } from './amortissements'

/**
 * Location meublée non professionnelle : bénéfices industriels et commerciaux.
 *
 * Micro-BIC : abattement forfaitaire, minimum légal, pas de déficit.
 * Réel simplifié : charges effectives et amortissements ; l'amortissement ne
 * peut pas créer ni augmenter un déficit (CGI art. 39 C), l'excédent se
 * reporte sans limite de durée. Le déficit dû aux autres charges se reporte
 * dix ans, sur les seuls BIC non professionnels (CGI art. 156-I-1° ter).
 */

export interface ReportBic {
  amortissementsEnReport: Decimal
  deficits: { annee: number; montant: Decimal }[]
}

export const REPORT_BIC_VIDE: ReportBic = { amortissementsEnReport: ZERO, deficits: [] }

export interface ResultatMicroBic {
  regime: 'micro-bic'
  applicable: boolean
  motifInapplicable?: string
  recettes: Decimal
  abattement: Decimal
  baseImposable: Decimal
  prelevementsSociaux: Decimal
  csgDeductibleAnneeSuivante: Decimal
  report: ReportBic
}

export interface ResultatReelBic {
  regime: 'reel-bic'
  recettes: Decimal
  charges: {
    taxeFonciere: Decimal
    assurances: Decimal
    fraisGestion: Decimal
    chargesCopropriete: Decimal
    fraisComptable: Decimal
    cfe: Decimal
    entretien: Decimal
    interets: Decimal
    total: Decimal
  }
  resultatAvantAmortissement: Decimal
  dotationAmortissement: Decimal
  amortissementsAnterieursDisponibles: Decimal
  amortissementDeduit: Decimal
  amortissementReporte: Decimal
  deficitExercice: Decimal
  deficitsAnterieursImputes: Decimal
  baseImposable: Decimal
  prelevementsSociaux: Decimal
  csgDeductibleAnneeSuivante: Decimal
  report: ReportBic
}

export function microBic(
  annee: AnneeBrute,
  autresRecettes: Decimal,
  report: ReportBic,
  regles: ReglesAnnee,
): ResultatMicroBic {
  const recettes = euros(annee.loyers)
  const applicable = recettes.plus(autresRecettes).lessThanOrEqualTo(regles.bic.microPlafond)
  const abattementCalcule = euros(recettes.times(pourcent(regles.bic.microAbattement)))
  const abattement = min(
    recettes,
    abattementCalcule.greaterThan(regles.bic.microAbattementMinimum)
      ? abattementCalcule
      : regles.bic.microAbattementMinimum,
  )
  const calc = prelevementsSurBase(recettes.minus(abattement), 'bic', regles)
  return {
    regime: 'micro-bic',
    applicable,
    motifInapplicable: applicable
      ? undefined
      : `Les recettes de location meublée du foyer dépassent ${regles.bic.microPlafond.toFixed(0)} € : le réel s'applique obligatoirement.`,
    recettes,
    abattement,
    ...calc,
    // Sous le micro, les reports ne se consomment pas ; ils attendent un retour au réel.
    report,
  }
}

export function reelBic(
  annee: AnneeBrute,
  plan: LigneAmortissement[],
  report: ReportBic,
  regles: ReglesAnnee,
): ResultatReelBic {
  const recettes = euros(annee.loyers)
  const charges = {
    taxeFonciere: euros(annee.taxeFonciere),
    assurances: euros(annee.assurances),
    fraisGestion: euros(annee.fraisGestion),
    chargesCopropriete: euros(annee.chargesCopropriete),
    fraisComptable: euros(annee.fraisComptable),
    cfe: euros(annee.cfe),
    entretien: euros(annee.travauxEntretien),
    interets: euros(somme([annee.interetsEmprunt, annee.assuranceEmprunt, annee.fraisEmprunt])),
    total: ZERO,
  }
  charges.total = somme([
    charges.taxeFonciere,
    charges.assurances,
    charges.fraisGestion,
    charges.chargesCopropriete,
    charges.fraisComptable,
    charges.cfe,
    charges.entretien,
    charges.interets,
  ])
  const resultatAvantAmortissement = recettes.minus(charges.total)
  const dotation = euros(dotationAnnee(plan, annee.annee))
  const disponibles = report.amortissementsEnReport
  const amortissableTotal = dotation.plus(disponibles)

  // Art. 39 C : l'amortissement déduit ne peut pas dépasser le résultat avant amortissement.
  const amortissementDeduit = min(amortissableTotal, max0(resultatAvantAmortissement))
  const amortissementReporte = amortissableTotal.minus(amortissementDeduit)
  const deficitExercice = max0(resultatAvantAmortissement.negated())
  const resultatApresAmortissement = max0(resultatAvantAmortissement).minus(amortissementDeduit)

  // Déficits BIC non professionnels des dix années précédentes.
  let restant = resultatApresAmortissement
  let deficitsAnterieursImputes = ZERO
  const deficits: ReportBic['deficits'] = []
  for (const def of [...report.deficits].sort((a, b) => a.annee - b.annee)) {
    if (annee.annee - def.annee > regles.bic.reportDeficitAnnees) continue
    const part = min(def.montant, restant)
    restant = restant.minus(part)
    deficitsAnterieursImputes = deficitsAnterieursImputes.plus(part)
    const reste = def.montant.minus(part)
    if (reste.greaterThan(0)) deficits.push({ annee: def.annee, montant: reste })
  }
  if (deficitExercice.greaterThan(0))
    deficits.push({ annee: annee.annee, montant: deficitExercice })

  const calc = prelevementsSurBase(restant, 'bic', regles)
  return {
    regime: 'reel-bic',
    recettes,
    charges,
    resultatAvantAmortissement,
    dotationAmortissement: dotation,
    amortissementsAnterieursDisponibles: disponibles,
    amortissementDeduit,
    amortissementReporte,
    deficitExercice,
    deficitsAnterieursImputes,
    ...calc,
    report: { amortissementsEnReport: amortissementReporte, deficits },
  }
}

export function totalDeficitsBic(report: ReportBic): Decimal {
  return somme(report.deficits.map((d) => d.montant))
}
