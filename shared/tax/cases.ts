import type { Decimal } from './decimal'
import type { LigneProjection } from '../projection/projection'
import type { ResultatMicroFoncier, ResultatReelFoncier } from './foncier'
import type { ResultatMicroBic, ResultatReelBic } from './bic'

/**
 * Les cases à reporter sur la déclaration, pour une année et un régime.
 * Les numéros sont ceux des formulaires des revenus 2025 (déclarés en 2026) ;
 * ils sont à vérifier sur la notice de l'année, l'administration les déplace parfois.
 */
export interface CaseDeclaration {
  formulaire: '2042' | '2042 C PRO' | '2044' | '2031' | '2033-B'
  numero: string
  libelle: string
  montant: Decimal
  /** Une case qui ne se remplit que si le montant est non nul. */
  facultative?: boolean
}

export function casesMicroFoncier(r: ResultatMicroFoncier): CaseDeclaration[] {
  return [
    {
      formulaire: '2042',
      numero: '4BE',
      libelle: 'Recettes brutes sans abattement',
      montant: r.recettes,
    },
  ]
}

export function casesReelFoncier(r: ResultatReelFoncier): CaseDeclaration[] {
  const c = r.charges
  const cases: CaseDeclaration[] = [
    { formulaire: '2044', numero: '211', libelle: 'Loyers bruts encaissés', montant: r.recettes },
    {
      formulaire: '2044',
      numero: '221',
      libelle: 'Frais d’administration et de gestion',
      montant: c.fraisAdministration,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '222',
      libelle: 'Autres frais de gestion (forfait)',
      montant: c.forfaitGestion,
    },
    {
      formulaire: '2044',
      numero: '223',
      libelle: 'Primes d’assurance',
      montant: c.assurances,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '224',
      libelle: 'Dépenses de réparation, d’entretien et d’amélioration',
      montant: c.travaux,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '227',
      libelle: 'Taxes foncières',
      montant: c.taxeFonciere,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '229',
      libelle: 'Provisions pour charges de copropriété',
      montant: c.chargesCopropriete,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '250',
      libelle: 'Intérêts d’emprunt et frais',
      montant: c.interets,
      facultative: true,
    },
    {
      formulaire: '2044',
      numero: '263',
      libelle: 'Revenu ou déficit foncier',
      montant: r.resultatBrut,
    },
  ]
  if (r.resultatBrut.isNegative()) {
    cases.push(
      {
        formulaire: '2042',
        numero: '4BC',
        libelle: 'Déficit imputable sur le revenu global',
        montant: r.deficitImputeRevenuGlobal,
      },
      {
        formulaire: '2042',
        numero: '4BB',
        libelle: 'Déficit imputable sur les revenus fonciers',
        montant: r.deficitReportable,
        facultative: true,
      },
    )
  } else {
    cases.push({
      formulaire: '2042',
      numero: '4BA',
      libelle: 'Revenus fonciers nets',
      montant: r.resultatBrut,
    })
    if (r.deficitsAnterieursImputes.greaterThan(0)) {
      cases.push({
        formulaire: '2042',
        numero: '4BD',
        libelle: 'Déficits antérieurs imputés',
        montant: r.deficitsAnterieursImputes,
      })
    }
  }
  return cases
}

export function casesMicroBic(r: ResultatMicroBic): CaseDeclaration[] {
  return [
    {
      formulaire: '2042 C PRO',
      numero: '5ND',
      libelle: 'Locations meublées non professionnelles, recettes brutes',
      montant: r.recettes,
    },
  ]
}

export function casesReelBic(r: ResultatReelBic): CaseDeclaration[] {
  const cases: CaseDeclaration[] = [
    {
      formulaire: '2033-B',
      numero: '210',
      libelle: 'Chiffre d’affaires (loyers)',
      montant: r.recettes,
    },
    {
      formulaire: '2033-B',
      numero: '254',
      libelle: 'Dotations aux amortissements déduites',
      montant: r.amortissementDeduit,
    },
    {
      formulaire: '2031',
      numero: 'C',
      libelle: 'Résultat fiscal (bénéfice ou déficit)',
      montant: r.baseImposable.minus(r.deficitExercice),
    },
  ]
  if (r.deficitExercice.greaterThan(0)) {
    cases.push({
      formulaire: '2042 C PRO',
      numero: '5NY',
      libelle: 'Déficit LMNP au réel',
      montant: r.deficitExercice,
    })
  } else {
    cases.push({
      formulaire: '2042 C PRO',
      numero: '5NA',
      libelle: 'Bénéfice LMNP au réel',
      montant: r.baseImposable,
    })
  }
  return cases
}

export function casesPour(ligne: LigneProjection, regime: 'micro' | 'reel'): CaseDeclaration[] {
  const r = regime === 'micro' ? ligne.micro.resultat : ligne.reel.resultat
  switch (r.regime) {
    case 'micro-foncier':
      return casesMicroFoncier(r)
    case 'reel-foncier':
      return casesReelFoncier(r)
    case 'micro-bic':
      return casesMicroBic(r)
    case 'reel-bic':
      return casesReelBic(r)
  }
}
