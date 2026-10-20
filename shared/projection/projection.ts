import type { Decimal } from '../tax/decimal'
import { d, ZERO, euros, pourcent } from '../tax/decimal'
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
  /** Économie d'impôt sur le revenu grâce à la CSG déductible de l'année précédente. */
  economieCsgDeductible: Decimal
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

export function projeter(dossier: Dossier): Projection {
  const { bien, foyer, horizonAnnees } = dossier
  const brutes = anneesBrutes(bien, horizonAnnees)
  const reglesInitiales = reglesPour(bien.anneeMiseEnLocation)
  const plan = bien.typeLocation === 'meublee' ? planAmortissement(bien, reglesInitiales) : []
  const tmi = foyer.tmi
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
      const m = microFoncier(brut, tmi, autres, reportMicroF, regles)
      const r = reelFoncier(brut, tmi, reportReelF, regles)
      reportMicroF = m.report
      reportReelF = r.report
      micro = m
      reel = r
    } else {
      const m = microBic(brut, tmi, autres, reportMicroB, regles)
      const r = reelBic(brut, tmi, plan, reportReelB, regles)
      reportMicroB = m.report
      reportReelB = r.report
      micro = m
      reel = r
    }

    const economieCsgMicro = euros(csgMicro.times(pourcent(tmi)))
    const economieCsgReel = euros(csgReel.times(pourcent(tmi)))
    const netMicro = micro.total.minus(economieCsgMicro)
    const netReel = reel.total.minus(economieCsgReel)
    cumulMicro = cumulMicro.plus(netMicro)
    cumulReel = cumulReel.plus(netReel)
    csgMicro = micro.csgDeductibleAnneeSuivante
    csgReel = reel.csgDeductibleAnneeSuivante

    annees.push({
      annee: brut.annee,
      rang: brut.rang,
      brut,
      regles,
      micro: {
        resultat: micro,
        economieCsgDeductible: economieCsgMicro,
        net: netMicro,
        cumul: cumulMicro,
      },
      reel: {
        resultat: reel,
        economieCsgDeductible: economieCsgReel,
        net: netReel,
        cumul: cumulReel,
      },
      ecart: netMicro.minus(netReel),
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
