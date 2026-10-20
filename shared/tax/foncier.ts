import type { Decimal } from './decimal'
import { d, ZERO, somme, max0, min, euros, pourcent } from './decimal'
import type { AnneeBrute } from './charges'
import type { ReglesAnnee } from './rules'

/**
 * Location nue : revenus fonciers.
 *
 * Micro-foncier : abattement forfaitaire, pas de déficit possible.
 * Réel : charges effectives ; le déficit qui provient des charges autres que
 * les intérêts d'emprunt s'impute sur le revenu global dans une limite
 * annuelle, le reste se reporte sur les revenus fonciers des dix années
 * suivantes. Sources : CGI art. 28 à 31, 32 et 156-I-3° ; BOI-RFPI-BASE-30-20.
 */

export interface ReportFoncier {
  /** Déficits reportables sur les revenus fonciers, par année d'origine. */
  deficits: { annee: number; montant: Decimal }[]
}

export const REPORT_FONCIER_VIDE: ReportFoncier = { deficits: [] }

export interface ResultatMicroFoncier {
  regime: 'micro-foncier'
  applicable: boolean
  motifInapplicable?: string
  recettes: Decimal
  abattement: Decimal
  revenuNet: Decimal
  deficitsAnterieursImputes: Decimal
  baseImposable: Decimal
  impotRevenu: Decimal
  prelevementsSociaux: Decimal
  total: Decimal
  csgDeductibleAnneeSuivante: Decimal
  report: ReportFoncier
}

export interface ResultatReelFoncier {
  regime: 'reel-foncier'
  recettes: Decimal
  charges: {
    fraisAdministration: Decimal
    forfaitGestion: Decimal
    assurances: Decimal
    travaux: Decimal
    taxeFonciere: Decimal
    chargesCopropriete: Decimal
    interets: Decimal
    total: Decimal
  }
  /** Recettes moins charges, avant toute imputation (ligne 263 de la 2044). */
  resultatBrut: Decimal
  deficitInterets: Decimal
  deficitAutresCharges: Decimal
  deficitImputeRevenuGlobal: Decimal
  plafondImputationGlobal: Decimal
  deficitReportable: Decimal
  deficitsAnterieursImputes: Decimal
  baseImposable: Decimal
  impotRevenu: Decimal
  /** Économie d'impôt due au déficit imputé sur le revenu global, à la TMI. */
  economieDeficitGlobal: Decimal
  prelevementsSociaux: Decimal
  /** Impôt et prélèvements, net de l'économie du déficit (peut être négatif). */
  total: Decimal
  csgDeductibleAnneeSuivante: Decimal
  report: ReportFoncier
}

function imputerDeficitsAnterieurs(
  revenuPositif: Decimal,
  report: ReportFoncier,
  annee: number,
  regles: ReglesAnnee,
): { impute: Decimal; report: ReportFoncier } {
  let restant = revenuPositif
  let impute = ZERO
  const deficits: ReportFoncier['deficits'] = []
  for (const def of [...report.deficits].sort((a, b) => a.annee - b.annee)) {
    if (annee - def.annee > regles.foncier.reportDeficitAnnees) continue
    const part = min(def.montant, restant)
    restant = restant.minus(part)
    impute = impute.plus(part)
    const reste = def.montant.minus(part)
    if (reste.greaterThan(0)) deficits.push({ annee: def.annee, montant: reste })
  }
  return { impute, report: { deficits } }
}

function impots(base: Decimal, tmi: number, regles: ReglesAnnee) {
  const baseArrondie = euros(max0(base))
  const impotRevenu = euros(baseArrondie.times(pourcent(tmi)))
  const prelevementsSociaux = euros(baseArrondie.times(pourcent(regles.prelevementsSociaux)))
  const csgDeductibleAnneeSuivante = euros(baseArrondie.times(pourcent(regles.csgDeductible)))
  return {
    baseImposable: baseArrondie,
    impotRevenu,
    prelevementsSociaux,
    csgDeductibleAnneeSuivante,
  }
}

export function microFoncier(
  annee: AnneeBrute,
  tmi: number,
  autresRecettes: Decimal,
  report: ReportFoncier,
  regles: ReglesAnnee,
): ResultatMicroFoncier {
  const recettes = euros(annee.loyers)
  const totalRecettesFoyer = recettes.plus(autresRecettes)
  const applicable = totalRecettesFoyer.lessThanOrEqualTo(regles.foncier.microPlafond)
  const abattement = euros(recettes.times(pourcent(regles.foncier.microAbattement)))
  const revenuNet = recettes.minus(abattement)
  const imputation = imputerDeficitsAnterieurs(revenuNet, report, annee.annee, regles)
  const base = revenuNet.minus(imputation.impute)
  const calc = impots(base, tmi, regles)
  return {
    regime: 'micro-foncier',
    applicable,
    motifInapplicable: applicable
      ? undefined
      : `Les recettes foncières du foyer dépassent ${regles.foncier.microPlafond.toFixed(0)} € : le réel s'applique obligatoirement.`,
    recettes,
    abattement,
    revenuNet,
    deficitsAnterieursImputes: imputation.impute,
    ...calc,
    total: calc.impotRevenu.plus(calc.prelevementsSociaux),
    report: imputation.report,
  }
}

export function reelFoncier(
  annee: AnneeBrute,
  tmi: number,
  report: ReportFoncier,
  regles: ReglesAnnee,
): ResultatReelFoncier {
  const recettes = euros(annee.loyers)
  const interets = euros(somme([annee.interetsEmprunt, annee.assuranceEmprunt, annee.fraisEmprunt]))
  const travauxDeductibles = somme([
    annee.travauxEntretien,
    annee.travauxAmelioration,
    annee.travauxEnergetique,
  ])
  const charges = {
    fraisAdministration: euros(annee.fraisGestion),
    forfaitGestion: regles.foncier.forfaitGestionParLocal,
    assurances: euros(annee.assurances),
    travaux: euros(travauxDeductibles),
    taxeFonciere: euros(annee.taxeFonciere),
    chargesCopropriete: euros(annee.chargesCopropriete),
    interets,
    total: ZERO,
  }
  const autresCharges = somme([
    charges.fraisAdministration,
    charges.forfaitGestion,
    charges.assurances,
    charges.travaux,
    charges.taxeFonciere,
    charges.chargesCopropriete,
  ])
  charges.total = autresCharges.plus(interets)
  const resultatBrut = recettes.minus(charges.total)

  const plafond = annee.travauxEnergetique.greaterThan(0)
    ? regles.foncier.deficitImputableGlobalEnergetique
    : regles.foncier.deficitImputableGlobal

  let deficitInterets = ZERO
  let deficitAutresCharges = ZERO
  let deficitImputeRevenuGlobal = ZERO
  let deficitReportable = ZERO
  let deficitsAnterieursImputes = ZERO
  let base = ZERO
  let nouveauReport: ReportFoncier

  if (resultatBrut.isNegative()) {
    // Les intérêts s'imputent d'abord sur les recettes ; ce qu'ils laissent de déficit
    // ne se reporte que sur les revenus fonciers. Le déficit dû aux autres charges
    // s'impute sur le revenu global, dans la limite du plafond.
    deficitInterets = max0(interets.minus(recettes))
    deficitAutresCharges = interets.greaterThanOrEqualTo(recettes)
      ? autresCharges
      : max0(autresCharges.minus(recettes.minus(interets)))
    deficitImputeRevenuGlobal = min(deficitAutresCharges, plafond)
    deficitReportable = deficitInterets.plus(deficitAutresCharges.minus(deficitImputeRevenuGlobal))
    nouveauReport = {
      deficits: [
        ...report.deficits.filter(
          (d) => annee.annee - d.annee < regles.foncier.reportDeficitAnnees,
        ),
        ...(deficitReportable.greaterThan(0)
          ? [{ annee: annee.annee, montant: deficitReportable }]
          : []),
      ],
    }
  } else {
    const imputation = imputerDeficitsAnterieurs(resultatBrut, report, annee.annee, regles)
    deficitsAnterieursImputes = imputation.impute
    base = resultatBrut.minus(imputation.impute)
    nouveauReport = imputation.report
  }

  const calc = impots(base, tmi, regles)
  const economieDeficitGlobal = euros(deficitImputeRevenuGlobal.times(pourcent(tmi)))
  return {
    regime: 'reel-foncier',
    recettes,
    charges,
    resultatBrut,
    deficitInterets,
    deficitAutresCharges,
    deficitImputeRevenuGlobal,
    plafondImputationGlobal: plafond,
    deficitReportable,
    deficitsAnterieursImputes,
    ...calc,
    economieDeficitGlobal,
    total: calc.impotRevenu.plus(calc.prelevementsSociaux).minus(economieDeficitGlobal),
    report: nouveauReport,
  }
}

export function totalReport(report: ReportFoncier): Decimal {
  return somme(report.deficits.map((d) => d.montant))
}

export { d }
