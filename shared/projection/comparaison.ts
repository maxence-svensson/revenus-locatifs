import type { Decimal } from '../tax/decimal'
import { d, centimes } from '../tax/decimal'
import type { Dossier, TypeLocation } from '../model/dossier'
import { projeter, type Projection } from './projection'

/**
 * Nue ou meublée ? Le même bien, le même foyer et les mêmes charges, projetés
 * dans les deux types de location : quatre régimes côte à côte.
 *
 * Le loyer saisi est celui du type choisi ; celui de l'autre type s'en déduit
 * par le supplément de loyer du meublé indiqué dans le dossier (0 % : même
 * loyer). Le mobilier, l'expert-comptable et la CFE ne comptent qu'en meublé,
 * comme dans toute projection.
 */

export type CleRegime = 'micro-foncier' | 'reel-foncier' | 'micro-bic' | 'reel-bic'

export interface RegimeCompare {
  cle: CleRegime
  typeLocation: TypeLocation
  regime: 'micro' | 'reel'
  /** Nom en minuscules, prêt pour une phrase. */
  nom: string
  /** Impôt et prélèvements cumulés sur l'horizon, nets des économies. */
  total: Decimal
  /** Le micro n'est pas applicable au-dessus du plafond de recettes du foyer. */
  applicable: boolean
  motifInapplicable?: string
}

export interface Comparaison {
  typeChoisi: TypeLocation
  supplementLoyerPourcent: number
  loyerMensuelNue: number
  loyerMensuelMeublee: number
  nue: Projection
  meublee: Projection
  /** Les quatre régimes, dans l'ordre : micro-foncier, réel foncier, micro-BIC, LMNP au réel. */
  regimes: RegimeCompare[]
  /** Le moins cher des régimes applicables. */
  meilleur: RegimeCompare
  meilleurDuTypeChoisi: RegimeCompare
  meilleurAutreType: RegimeCompare
  /** Ce que l'autre type ferait économiser par rapport au type choisi : positif s'il gagne. */
  economieAutreType: Decimal
}

const NOMS: Record<CleRegime, string> = {
  'micro-foncier': 'micro-foncier',
  'reel-foncier': 'réel foncier',
  'micro-bic': 'micro-BIC',
  'reel-bic': 'LMNP au réel',
}

export function autreType(type: TypeLocation): TypeLocation {
  return type === 'nue' ? 'meublee' : 'nue'
}

/** Le même dossier dans l'autre type de location, le loyer ajusté du supplément du meublé. */
export function dossierPourType(dossier: Dossier, type: TypeLocation): Dossier {
  const { bien } = dossier
  if (bien.typeLocation === type) return dossier
  const facteur = d(bien.supplementLoyerMeublePourcent).dividedBy(100).plus(1)
  const loyer = d(bien.loyerMensuelHorsCharges)
  const ajuste = type === 'meublee' ? loyer.times(facteur) : loyer.dividedBy(facteur)
  return {
    ...dossier,
    bien: { ...bien, typeLocation: type, loyerMensuelHorsCharges: centimes(ajuste).toNumber() },
  }
}

function regimesDe(p: Projection): RegimeCompare[] {
  const micro = p.annees[0]!.micro.resultat
  const cleMicro: CleRegime = p.typeLocation === 'nue' ? 'micro-foncier' : 'micro-bic'
  const cleReel: CleRegime = p.typeLocation === 'nue' ? 'reel-foncier' : 'reel-bic'
  return [
    {
      cle: cleMicro,
      typeLocation: p.typeLocation,
      regime: 'micro',
      nom: NOMS[cleMicro],
      total: p.totalMicro,
      applicable: micro.applicable,
      motifInapplicable: micro.motifInapplicable,
    },
    {
      cle: cleReel,
      typeLocation: p.typeLocation,
      regime: 'reel',
      nom: NOMS[cleReel],
      total: p.totalReel,
      applicable: true,
    },
  ]
}

/** Le moins cher des régimes applicables ; à égalité, le premier de la liste, donc le micro. */
function moinsCher(liste: RegimeCompare[]): RegimeCompare {
  const candidats = liste.filter((r) => r.applicable)
  return candidats.reduce((meilleur, r) => (r.total.lessThan(meilleur.total) ? r : meilleur))
}

export function comparer(dossier: Dossier): Comparaison {
  const dossierNue = dossierPourType(dossier, 'nue')
  const dossierMeublee = dossierPourType(dossier, 'meublee')
  const nue = projeter(dossierNue)
  const meublee = projeter(dossierMeublee)
  const regimes = [...regimesDe(nue), ...regimesDe(meublee)]
  const typeChoisi = dossier.bien.typeLocation
  const meilleurDuTypeChoisi = moinsCher(regimes.filter((r) => r.typeLocation === typeChoisi))
  const meilleurAutreType = moinsCher(
    regimes.filter((r) => r.typeLocation === autreType(typeChoisi)),
  )
  return {
    typeChoisi,
    supplementLoyerPourcent: dossier.bien.supplementLoyerMeublePourcent,
    loyerMensuelNue: dossierNue.bien.loyerMensuelHorsCharges,
    loyerMensuelMeublee: dossierMeublee.bien.loyerMensuelHorsCharges,
    nue,
    meublee,
    regimes,
    meilleur: moinsCher(regimes),
    meilleurDuTypeChoisi,
    meilleurAutreType,
    economieAutreType: meilleurDuTypeChoisi.total.minus(meilleurAutreType.total),
  }
}
