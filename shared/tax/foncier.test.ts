import { describe, expect, it } from 'vitest'
import { d, ZERO } from './decimal'
import { reglesPour } from './rules'
import { microFoncier, reelFoncier, REPORT_FONCIER_VIDE } from './foncier'
import type { AnneeBrute } from './charges'

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

describe('micro-foncier', () => {
  it('applique l’abattement de 30 %', () => {
    const r = microFoncier(annee({ loyers: d(12000) }), 30, ZERO, REPORT_FONCIER_VIDE, regles)
    expect(r.applicable).toBe(true)
    expect(r.abattement.toFixed(0)).toBe('3600')
    expect(r.baseImposable.toFixed(0)).toBe('8400')
    expect(r.impotRevenu.toFixed(0)).toBe('2520')
    expect(r.prelevementsSociaux.toFixed(0)).toBe('1445')
    expect(r.total.toFixed(0)).toBe('3965')
    expect(r.csgDeductibleAnneeSuivante.toFixed(0)).toBe('571')
  })
  it('n’est plus applicable au-dessus de 15 000 € de recettes du foyer', () => {
    const r = microFoncier(annee({ loyers: d(9000) }), 30, d(7000), REPORT_FONCIER_VIDE, regles)
    expect(r.applicable).toBe(false)
    expect(r.motifInapplicable).toMatch(/15000/)
  })
  it('impute les déficits antérieurs sur le revenu net', () => {
    const report = { deficits: [{ annee: 2023, montant: d(5000) }] }
    const r = microFoncier(annee({ loyers: d(10000) }), 30, ZERO, report, regles)
    expect(r.deficitsAnterieursImputes.toFixed(0)).toBe('5000')
    expect(r.baseImposable.toFixed(0)).toBe('2000')
    expect(r.report.deficits).toHaveLength(0)
  })
})

describe('réel foncier', () => {
  it('déduit les charges et taxe le revenu net', () => {
    const r = reelFoncier(
      annee({
        loyers: d(12000),
        taxeFonciere: d(900),
        assurances: d(300),
        interetsEmprunt: d(2000),
      }),
      30,
      REPORT_FONCIER_VIDE,
      regles,
    )
    // 12 000 − 900 − 300 − 2 000 − 20 (forfait) = 8 780
    expect(r.charges.total.toFixed(0)).toBe('3220')
    expect(r.resultatBrut.toFixed(0)).toBe('8780')
    expect(r.baseImposable.toFixed(0)).toBe('8780')
    expect(r.impotRevenu.toFixed(0)).toBe('2634')
    expect(r.prelevementsSociaux.toFixed(0)).toBe('1510')
    expect(r.deficitImputeRevenuGlobal.isZero()).toBe(true)
  })

  it('impute le déficit hors intérêts sur le revenu global, les intérêts en report', () => {
    // BOI-RFPI-BASE-30-20 : recettes 10 000, intérêts 12 000, autres charges 5 000.
    // Les intérêts absorbent les recettes : 2 000 de déficit « intérêts », reportable ;
    // les 5 000 d'autres charges s'imputent sur le revenu global.
    const r = reelFoncier(
      annee({ loyers: d(10000), interetsEmprunt: d(12000), taxeFonciere: d(4980) }),
      30,
      REPORT_FONCIER_VIDE,
      regles,
    )
    expect(r.resultatBrut.toFixed(0)).toBe('-7000')
    expect(r.deficitInterets.toFixed(0)).toBe('2000')
    expect(r.deficitAutresCharges.toFixed(0)).toBe('5000')
    expect(r.deficitImputeRevenuGlobal.toFixed(0)).toBe('5000')
    expect(r.deficitReportable.toFixed(0)).toBe('2000')
    expect(r.economieDeficitGlobal.toFixed(0)).toBe('1500')
    expect(r.total.toFixed(0)).toBe('-1500')
    expect(r.report.deficits).toEqual([{ annee: 2025, montant: d(2000) }])
  })

  it('plafonne l’imputation sur le revenu global à 10 700 €', () => {
    // Recettes 20 000, intérêts 5 000, travaux 29 980 (+ 20 de forfait = 30 000 d'autres charges).
    // Déficit « autres charges » = 30 000 − (20 000 − 5 000) = 15 000 : 10 700 sur le global, 4 300 en report.
    const r = reelFoncier(
      annee({ loyers: d(20000), interetsEmprunt: d(5000), travauxEntretien: d(29980) }),
      41,
      REPORT_FONCIER_VIDE,
      regles,
    )
    expect(r.deficitInterets.isZero()).toBe(true)
    expect(r.deficitAutresCharges.toFixed(0)).toBe('15000')
    expect(r.deficitImputeRevenuGlobal.toFixed(0)).toBe('10700')
    expect(r.deficitReportable.toFixed(0)).toBe('4300')
    expect(r.economieDeficitGlobal.toFixed(0)).toBe('4387')
  })

  it('relève le plafond à 21 400 € avec des travaux de rénovation énergétique', () => {
    const r = reelFoncier(
      annee({ loyers: d(10000), travauxEnergetique: d(30000) }),
      30,
      REPORT_FONCIER_VIDE,
      regles,
    )
    expect(r.plafondImputationGlobal.toFixed(0)).toBe('21400')
    expect(r.deficitImputeRevenuGlobal.toFixed(0)).toBe('20020')
  })

  it('consomme les déficits reportés les années suivantes, dans la limite de dix ans', () => {
    const report = {
      deficits: [
        { annee: 2014, montant: d(1000) },
        { annee: 2020, montant: d(3000) },
      ],
    }
    const r = reelFoncier(annee({ loyers: d(5020) }), 30, report, regles)
    // 5 020 − 20 de forfait = 5 000 ; le déficit de 2014 est périmé, celui de 2020 s'impute.
    expect(r.deficitsAnterieursImputes.toFixed(0)).toBe('3000')
    expect(r.baseImposable.toFixed(0)).toBe('2000')
    expect(r.report.deficits).toHaveLength(0)
  })
})
