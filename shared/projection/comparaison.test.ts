import { describe, expect, it } from 'vitest'
import { dossierExemple, dossierSchema } from '../model/dossier'
import { projeter } from './projection'
import { comparer, dossierPourType } from './comparaison'

describe('comparaison nue / meublée', () => {
  it('met les quatre régimes côte à côte sur l’exemple', () => {
    const c = comparer(dossierExemple(2025))
    expect(c.regimes.map((r) => r.cle)).toEqual([
      'micro-foncier',
      'reel-foncier',
      'micro-bic',
      'reel-bic',
    ])
    expect(c.typeChoisi).toBe('nue')
    // Le type choisi est projeté tel quel : mêmes totaux que la projection seule.
    const seule = projeter(dossierExemple(2025))
    expect(c.nue.totalMicro.equals(seule.totalMicro)).toBe(true)
    expect(c.nue.totalReel.equals(seule.totalReel)).toBe(true)
    // Le moins cher des quatre coûte au plus autant que chacun des applicables.
    for (const r of c.regimes.filter((r) => r.applicable))
      expect(c.meilleur.total.lessThanOrEqualTo(r.total)).toBe(true)
    expect(
      c.economieAutreType.equals(c.meilleurDuTypeChoisi.total.minus(c.meilleurAutreType.total)),
    ).toBe(true)
  })

  it('applique le supplément de loyer du meublé au loyer saisi en nu', () => {
    const c = comparer(dossierExemple(2025))
    expect(c.supplementLoyerPourcent).toBe(12)
    expect(c.loyerMensuelNue).toBe(720)
    expect(c.loyerMensuelMeublee).toBe(806.4)
    expect(c.meublee.annees[0]!.brut.loyers.toFixed(2)).toBe('9273.60')
  })

  it('déduit le loyer du nu quand le dossier est en meublé', () => {
    const base = dossierExemple(2025)
    const meuble = dossierSchema.parse({
      ...base,
      bien: { ...base.bien, typeLocation: 'meublee', loyerMensuelHorsCharges: 806.4 },
    })
    const c = comparer(meuble)
    expect(c.typeChoisi).toBe('meublee')
    expect(c.loyerMensuelMeublee).toBe(806.4)
    expect(c.loyerMensuelNue).toBe(720)
    // L'aller-retour retombe sur le dossier de départ.
    expect(
      dossierPourType(dossierPourType(base, 'meublee'), 'nue').bien.loyerMensuelHorsCharges,
    ).toBe(720)
  })

  it('garde le même loyer sans supplément', () => {
    const base = dossierExemple(2025)
    const c = comparer(
      dossierSchema.parse({ ...base, bien: { ...base.bien, supplementLoyerMeublePourcent: 0 } }),
    )
    expect(c.loyerMensuelMeublee).toBe(c.loyerMensuelNue)
  })

  it('écarte un micro inapplicable du choix du moins cher', () => {
    const base = dossierExemple(2025)
    const c = comparer(
      dossierSchema.parse({
        ...base,
        foyer: { ...base.foyer, autresRecettesMemeCategorie: 20000 },
      }),
    )
    const microFoncier = c.regimes.find((r) => r.cle === 'micro-foncier')!
    expect(microFoncier.applicable).toBe(false)
    expect(microFoncier.motifInapplicable).toContain('15000')
    expect(c.regimes.find((r) => r.cle === 'micro-bic')!.applicable).toBe(true)
    expect(c.meilleur.cle).not.toBe('micro-foncier')
    expect(c.meilleurDuTypeChoisi.cle).toBe('reel-foncier')
  })
})
