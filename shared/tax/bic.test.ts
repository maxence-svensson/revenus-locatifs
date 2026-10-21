import { describe, expect, it } from 'vitest'
import { d, ZERO } from './decimal'
import { reglesPour } from './rules'
import { microBic, reelBic, REPORT_BIC_VIDE } from './bic'
import type { AnneeBrute } from './charges'
import type { LigneAmortissement } from './amortissements'

const regles = reglesPour(2025)

function annee(partiel: Partial<AnneeBrute>): AnneeBrute {
  return {
    annee: 2025,
    rang: 0,
    loyers: ZERO,
    taxeFonciere: ZERO,
    assurances: ZERO,
    fraisGestion: ZERO,
    chargesCopropriete: ZERO,
    fraisComptable: ZERO,
    cfe: ZERO,
    travauxEntretien: ZERO,
    travauxAmelioration: ZERO,
    travauxEnergetique: ZERO,
    travauxConstruction: ZERO,
    interetsEmprunt: ZERO,
    assuranceEmprunt: ZERO,
    fraisEmprunt: ZERO,
    ...partiel,
  }
}

function plan(annuite: number): LigneAmortissement[] {
  return [
    {
      cle: 'test',
      libelle: 'Test',
      base: d(annuite * 10),
      dureeAnnees: 10,
      anneeDebut: 2025,
      annuite: d(annuite),
    },
  ]
}

describe('micro-BIC', () => {
  it('applique l’abattement de 50 %', () => {
    const r = microBic(annee({ loyers: d(10000) }), ZERO, REPORT_BIC_VIDE, regles)
    expect(r.abattement.toFixed(0)).toBe('5000')
    expect(r.baseImposable.toFixed(0)).toBe('5000')
    expect(r.prelevementsSociaux.toFixed(0)).toBe('860')
  })
  it('garantit l’abattement minimum de 305 €', () => {
    const r = microBic(annee({ loyers: d(500) }), ZERO, REPORT_BIC_VIDE, regles)
    expect(r.abattement.toFixed(0)).toBe('305')
    expect(r.baseImposable.toFixed(0)).toBe('195')
  })
  it('ne dépasse pas les recettes', () => {
    const r = microBic(annee({ loyers: d(200) }), ZERO, REPORT_BIC_VIDE, regles)
    expect(r.abattement.toFixed(0)).toBe('200')
    expect(r.baseImposable.isZero()).toBe(true)
  })
  it('n’est plus applicable au-dessus de 77 700 €', () => {
    const r = microBic(annee({ loyers: d(80000) }), ZERO, REPORT_BIC_VIDE, regles)
    expect(r.applicable).toBe(false)
  })
})

describe('réel BIC', () => {
  it('déduit charges et amortissements quand le résultat le permet', () => {
    const r = reelBic(
      annee({ loyers: d(12000), taxeFonciere: d(1000), interetsEmprunt: d(3000) }),
      plan(4000),
      REPORT_BIC_VIDE,
      regles,
    )
    expect(r.resultatAvantAmortissement.toFixed(0)).toBe('8000')
    expect(r.amortissementDeduit.toFixed(0)).toBe('4000')
    expect(r.amortissementReporte.isZero()).toBe(true)
    expect(r.baseImposable.toFixed(0)).toBe('4000')
    expect(r.prelevementsSociaux.toFixed(0)).toBe('688')
  })

  it('plafonne l’amortissement au résultat avant amortissement (art. 39 C)', () => {
    const r = reelBic(
      annee({ loyers: d(10000), taxeFonciere: d(4000) }),
      plan(8000),
      REPORT_BIC_VIDE,
      regles,
    )
    expect(r.amortissementDeduit.toFixed(0)).toBe('6000')
    expect(r.amortissementReporte.toFixed(0)).toBe('2000')
    expect(r.baseImposable.isZero()).toBe(true)
    expect(r.prelevementsSociaux.isZero()).toBe(true)
    expect(r.report.amortissementsEnReport.toFixed(0)).toBe('2000')
  })

  it('reprend les amortissements en report l’année suivante, toujours plafonnés', () => {
    const premiere = reelBic(
      annee({ loyers: d(10000), taxeFonciere: d(4000) }),
      plan(8000),
      REPORT_BIC_VIDE,
      regles,
    )
    const seconde = reelBic(
      annee({ annee: 2026, rang: 1, loyers: d(10000), taxeFonciere: d(4000) }),
      plan(8000),
      premiere.report,
      regles,
    )
    expect(seconde.amortissementsAnterieursDisponibles.toFixed(0)).toBe('2000')
    expect(seconde.amortissementDeduit.toFixed(0)).toBe('6000')
    expect(seconde.amortissementReporte.toFixed(0)).toBe('4000')
  })

  it('reporte un déficit hors amortissement sur les BIC suivants, sans toucher au revenu global', () => {
    const premiere = reelBic(
      annee({ loyers: d(6000), taxeFonciere: d(1000), travauxEntretien: d(7000) }),
      plan(3000),
      REPORT_BIC_VIDE,
      regles,
    )
    expect(premiere.deficitExercice.toFixed(0)).toBe('2000')
    expect(premiere.amortissementDeduit.isZero()).toBe(true)
    expect(premiere.amortissementReporte.toFixed(0)).toBe('3000')
    expect(premiere.prelevementsSociaux.isZero()).toBe(true)

    const seconde = reelBic(
      annee({ annee: 2026, rang: 1, loyers: d(12000) }),
      plan(3000),
      premiere.report,
      regles,
    )
    // 12 000 de résultat ; 6 000 d'amortissements (3 000 + 3 000 en report) ; 2 000 de déficit antérieur.
    expect(seconde.amortissementDeduit.toFixed(0)).toBe('6000')
    expect(seconde.deficitsAnterieursImputes.toFixed(0)).toBe('2000')
    expect(seconde.baseImposable.toFixed(0)).toBe('4000')
    expect(seconde.report.deficits).toHaveLength(0)
  })
})
