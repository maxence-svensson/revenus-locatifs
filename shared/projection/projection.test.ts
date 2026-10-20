import { describe, expect, it } from 'vitest'
import { dossierExemple, dossierSchema } from '../model/dossier'
import { projeter } from './projection'
import { casesPour } from '../tax/cases'

describe('projection', () => {
  it('projette l’exemple en location nue sur dix ans', () => {
    const p = projeter(dossierExemple(2025))
    expect(p.annees).toHaveLength(10)
    expect(p.annees.map((a) => a.annee)).toEqual([
      2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034,
    ])
    // Première année : travaux de 12 000 et intérêts, le réel dégage un déficit.
    const premiere = p.annees[0]!
    expect(premiere.reel.resultat.regime).toBe('reel-foncier')
    expect(premiere.reel.net.lessThan(premiere.micro.net)).toBe(true)
    expect(p.recommandation).toBe('reel')
    expect(p.economieReel.greaterThan(0)).toBe(true)
    expect(p.avertissements.some((a) => a.includes('3 ans'))).toBe(true)
  })

  it('projette le même bien en meublé avec des amortissements', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({ ...base, bien: { ...base.bien, typeLocation: 'meublee' } }),
    )
    const premiere = p.annees[0]!
    expect(premiere.reel.resultat.regime).toBe('reel-bic')
    expect(premiere.micro.resultat.regime).toBe('micro-bic')
    expect(p.plan.length).toBeGreaterThan(0)
    // Les amortissements effacent le bénéfice : zéro impôt au réel.
    expect(premiere.reel.net.isZero()).toBe(true)
    expect(p.recommandation).toBe('reel')
  })

  it('tient compte de la CSG déductible l’année suivante', () => {
    const p = projeter(dossierExemple(2025))
    const seconde = p.annees[1]!
    expect(seconde.micro.economieCsgDeductible.greaterThan(0)).toBe(true)
    expect(seconde.micro.net.toFixed(0)).toBe(
      seconde.micro.resultat.total.minus(seconde.micro.economieCsgDeductible).toFixed(0),
    )
  })

  it('impose le réel quand le micro n’est pas applicable', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({
        ...base,
        foyer: { ...base.foyer, autresRecettesMemeCategorie: 20000 },
      }),
    )
    expect(p.microApplicablePremiereAnnee).toBe(false)
    expect(p.recommandation).toBe('reel')
  })

  it('reste indifférent quand rien ne distingue les régimes', () => {
    const base = dossierExemple(2025)
    const p = projeter(
      dossierSchema.parse({
        ...base,
        horizonAnnees: 1,
        bien: {
          ...base.bien,
          loyerMensuelHorsCharges: 0,
          taxeFonciere: 0,
          assurances: 0,
          fraisGestionPourcent: 0,
          chargesCopropriete: 0,
          travaux: [],
          emprunt: { ...base.bien.emprunt, actif: false },
        },
      }),
    )
    expect(p.recommandation).toBe('indifferent')
  })

  it('produit les cases à reporter des deux régimes', () => {
    const p = projeter(dossierExemple(2025))
    const micro = casesPour(p.annees[0]!, 'micro')
    const reel = casesPour(p.annees[0]!, 'reel')
    expect(micro.map((c) => c.numero)).toEqual(['4BE'])
    expect(reel.map((c) => c.numero)).toContain('263')
    expect(reel.map((c) => c.numero)).toContain('4BC')
  })
})
