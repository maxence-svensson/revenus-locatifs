import { describe, expect, it } from 'vitest'
import { dossierExemple } from '../model/dossier'
import { reglesPour } from './rules'
import { dotationAnnee, planAmortissement } from './amortissements'

const regles = reglesPour(2025)

describe('plan d’amortissement', () => {
  const bien = { ...dossierExemple(2025).bien, typeLocation: 'meublee' as const }
  const plan = planAmortissement(bien, regles)

  it('exclut le terrain et répartit la construction par composants', () => {
    // (180 000 + 14 000) × 85 % = 164 900 de construction.
    const construction = plan
      .filter((l) => ['grosOeuvre', 'facade', 'installations', 'agencements'].includes(l.cle))
      .reduce((acc, l) => acc.plus(l.base), plan[0]!.base.minus(plan[0]!.base))
    expect(construction.toFixed(0)).toBe('164900')
    expect(plan.find((l) => l.cle === 'grosOeuvre')!.annuite.toFixed(2)).toBe('1813.90')
  })

  it('amortit le mobilier et les travaux d’amélioration sur leur durée', () => {
    expect(plan.find((l) => l.cle === 'mobilier')!.annuite.toFixed(2)).toBe('857.14')
    const travaux = plan.find((l) => l.cle.startsWith('travaux-'))!
    expect(travaux.dureeAnnees).toBe(10)
    expect(travaux.annuite.toFixed(0)).toBe('1200')
  })

  it('arrête chaque ligne au bout de sa durée', () => {
    const premiere = dotationAnnee(plan, 2025)
    const apresMobilier = dotationAnnee(plan, 2032)
    expect(premiere.minus(apresMobilier).toFixed(2)).toBe('857.14')
    const apresTravaux = dotationAnnee(plan, 2035)
    expect(apresMobilier.minus(apresTravaux).toFixed(0)).toBe('1200')
  })

  it('ignore les travaux d’entretien, qui se déduisent l’année même', () => {
    const avecEntretien = planAmortissement(
      {
        ...bien,
        travaux: [{ id: 'e', annee: 2025, montant: 500, nature: 'entretien', libelle: '' }],
      },
      regles,
    )
    expect(avecEntretien.some((l) => l.cle.startsWith('travaux-'))).toBe(false)
  })
})
