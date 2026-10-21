import type { Decimal } from '../tax/decimal'
import { d, ZERO } from '../tax/decimal'
import { impotSurLeRevenu, type FoyerFiscal } from '../tax/bareme'
import type { Dossier } from '../model/dossier'
import { anneesBrutes, type AnneeBrute } from '../tax/charges'
import { reglesPour, DERNIERE_ANNEE_CONNUE, type ReglesAnnee } from '../tax/rules'
import {
  microFoncier,
  reelFoncier,
  REPORT_FONCIER_VIDE,
  type ResultatMicroFoncier,
  type ResultatReelFoncier,
} from '../tax/foncier'
import {
  microBic,
  reelBic,
  REPORT_BIC_VIDE,
  type ResultatMicroBic,
  type ResultatReelBic,
} from '../tax/bic'
import { planAmortissement, type LigneAmortissement } from '../tax/amortissements'

export type ResultatMicro = ResultatMicroFoncier | ResultatMicroBic
export type ResultatReel = ResultatReelFoncier | ResultatReelBic

export interface CoteAnnee<R> {
  resultat: R
  /** Impôt sur le revenu que le bien ajoute au foyer, au barème. */
  impotRevenu: Decimal
  /** Impôt en moins grâce au déficit foncier imputé sur le revenu global. */
  economieDeficitGlobal: Decimal
  /** Impôt en moins grâce à la CSG déductible de l'année précédente. */
  economieCsgDeductible: Decimal
  prelevementsSociaux: Decimal
  /** Tranche marginale du foyer cette année, bien compris. */
  tmi: number
  /** Impôt et prélèvements de l'année, net des économies (déficit global, CSG déductible). */
  net: Decimal
  cumul: Decimal
}

export interface LigneProjection {
  annee: number
  rang: number
  brut: AnneeBrute
  regles: ReglesAnnee
  micro: CoteAnnee<ResultatMicro>
  reel: CoteAnnee<ResultatReel>
  /** Écart de l'année : positif quand le réel coûte moins cher. */
  ecart: Decimal
}

export type Recommandation = 'micro' | 'reel' | 'indifferent'

export interface Projection {
  typeLocation: Dossier['bien']['typeLocation']
  annees: LigneProjection[]
  plan: LigneAmortissement[]
  totalMicro: Decimal
  totalReel: Decimal
  /** Économie cumulée du réel sur l'horizon : positive si le réel gagne. */
  economieReel: Decimal
  recommandation: Recommandation
  microApplicablePremiereAnnee: boolean
  /** Première année où le micro redevient moins cher que le réel, s'il y en a une. */
  premiereAnneeMicroMoinsCher?: number
  avertissements: string[]
}

/** Au-dessous de cet écart cumulé, on ne tranche pas entre les deux régimes. */
const SEUIL_INDIFFERENCE = d(100)

/**
 * L'impôt qu'un régime coûte au foyer une année : impôt du foyer avec le bien moins impôt du
 * foyer sans lui, au barème. L'écart se décompose dans l'ordre de l'avis : le revenu locatif,
 * puis le déficit imputé sur le revenu global, puis la CSG déductible de l'année précédente.
 * Chaque étape se calcule exactement, même quand elle fait changer de tranche.
 */
function cote<R extends ResultatMicro | ResultatReel>(
  resultat: R,
  csgAnneePrecedente: Decimal,
  revenuFoyer: Decimal,
  foyer: FoyerFiscal,
  regles: ReglesAnnee,
  cumulPrecedent: Decimal,
): CoteAnnee<R> {
  const deficitGlobal =
    resultat.regime === 'reel-foncier' ? resultat.deficitImputeRevenuGlobal : ZERO
  const impot = (revenu: Decimal) => impotSurLeRevenu(revenu, foyer, regles)
  const sansLeBien = impot(revenuFoyer)
  const avecRevenu = impot(revenuFoyer.plus(resultat.baseImposable))
  const apresDeficit = impot(revenuFoyer.plus(resultat.baseImposable).minus(deficitGlobal))
  const final = impot(
    revenuFoyer.plus(resultat.baseImposable).minus(deficitGlobal).minus(csgAnneePrecedente),
  )
  const net = final.impot.minus(sansLeBien.impot).plus(resultat.prelevementsSociaux)
  return {
    resultat,
    impotRevenu: avecRevenu.impot.minus(sansLeBien.impot),
    economieDeficitGlobal: avecRevenu.impot.minus(apresDeficit.impot),
    economieCsgDeductible: apresDeficit.impot.minus(final.impot),
    prelevementsSociaux: resultat.prelevementsSociaux,
    tmi: final.tmi,
    net,
    cumul: cumulPrecedent.plus(net),
  }
}

export function projeter(dossier: Dossier): Projection {
  const { bien, foyer, horizonAnnees } = dossier
  const brutes = anneesBrutes(bien, horizonAnnees)
  const reglesInitiales = reglesPour(bien.anneeMiseEnLocation)
  const plan = bien.typeLocation === 'meublee' ? planAmortissement(bien, reglesInitiales) : []
  const foyerFiscal: FoyerFiscal = { situation: foyer.situation, parts: foyer.parts }
  const revenuFoyer = d(foyer.revenuImposable)
  const autres = d(foyer.autresRecettesMemeCategorie)

  const annees: LigneProjection[] = []
  let reportMicroF = REPORT_FONCIER_VIDE
  let reportReelF = REPORT_FONCIER_VIDE
  let reportMicroB = REPORT_BIC_VIDE
  let reportReelB = REPORT_BIC_VIDE
  let csgMicro = ZERO
  let csgReel = ZERO
  let cumulMicro = ZERO
  let cumulReel = ZERO

  for (const brut of brutes) {
    const regles = reglesPour(brut.annee)
    let micro: ResultatMicro
    let reel: ResultatReel
    if (bien.typeLocation === 'nue') {
      const m = microFoncier(brut, autres, reportMicroF, regles)
      const r = reelFoncier(brut, reportReelF, regles)
      reportMicroF = m.report
      reportReelF = r.report
      micro = m
      reel = r
    } else {
      const m = microBic(brut, autres, reportMicroB, regles)
      const r = reelBic(brut, plan, reportReelB, regles)
      reportMicroB = m.report
      reportReelB = r.report
      micro = m
      reel = r
    }

    const coteMicro = cote(micro, csgMicro, revenuFoyer, foyerFiscal, regles, cumulMicro)
    const coteReel = cote(reel, csgReel, revenuFoyer, foyerFiscal, regles, cumulReel)
    cumulMicro = coteMicro.cumul
    cumulReel = coteReel.cumul
    csgMicro = micro.csgDeductibleAnneeSuivante
    csgReel = reel.csgDeductibleAnneeSuivante

    annees.push({
      annee: brut.annee,
      rang: brut.rang,
      brut,
      regles,
      micro: coteMicro,
      reel: coteReel,
      ecart: coteMicro.net.minus(coteReel.net),
    })
  }

  const premiere = annees[0]!
  const microApplicable = premiere.micro.resultat.applicable
  const economieReel = cumulMicro.minus(cumulReel)

  let recommandation: Recommandation
  if (!microApplicable) recommandation = 'reel'
  else if (economieReel.abs().lessThan(SEUIL_INDIFFERENCE)) recommandation = 'indifferent'
  else recommandation = economieReel.greaterThan(0) ? 'reel' : 'micro'

  const premiereAnneeMicroMoinsCher = annees.find((a) => a.rang > 0 && a.ecart.isNegative())?.annee

  const avertissements: string[] = []
  if (bien.anneeMiseEnLocation + horizonAnnees - 1 > DERNIERE_ANNEE_CONNUE) {
    avertissements.push(
      `Les règles connues s'arrêtent aux revenus ${DERNIERE_ANNEE_CONNUE} : les années suivantes les appliquent telles quelles, sans anticiper les lois de finances à venir.`,
    )
  }
  if (bien.typeLocation === 'nue' && recommandation === 'reel' && microApplicable) {
    avertissements.push(
      `L'option pour le réel engage pour ${reglesInitiales.foncier.dureeOptionReelAnnees} ans, puis se reconduit chaque année tant que vous ne revenez pas au micro.`,
    )
  }
  if (
    bien.typeLocation === 'nue' &&
    annees.some((a) =>
      (a.reel.resultat as ResultatReelFoncier).deficitImputeRevenuGlobal.greaterThan(0),
    )
  ) {
    avertissements.push(
      'Un déficit imputé sur le revenu global oblige à louer le bien jusqu’au 31 décembre de la troisième année qui suit, sous peine de reprise.',
    )
  }
  if (
    bien.typeLocation === 'nue' &&
    annees.some((a) =>
      (a.reel.resultat as ResultatReelFoncier).deficitImputeRevenuGlobal.greaterThan(revenuFoyer),
    )
  ) {
    avertissements.push(
      'Le déficit imputé dépasse le revenu imposable du foyer : l’excédent forme un déficit global reportable six ans, que l’outil ne reporte pas.',
    )
  }
  if (bien.typeLocation === 'meublee' && recommandation === 'reel') {
    avertissements.push(
      'Depuis les cessions de 2025, les amortissements déduits en LMNP se réintègrent dans le calcul de la plus-value à la revente (hors résidences services). Ce simulateur ne chiffre pas la revente.',
    )
  }
  if (bien.typeLocation === 'meublee' && d(bien.cfe).isZero()) {
    avertissements.push(
      `La location meublée est soumise à la CFE, sauf recettes inférieures à ${reglesInitiales.bic.cfeExonerationRecettes.toFixed(0)} € : renseignez-la si votre commune vous l’appelle.`,
    )
  }

  return {
    typeLocation: bien.typeLocation,
    annees,
    plan,
    totalMicro: cumulMicro,
    totalReel: cumulReel,
    economieReel,
    recommandation,
    microApplicablePremiereAnnee: microApplicable,
    premiereAnneeMicroMoinsCher,
    avertissements,
  }
}
